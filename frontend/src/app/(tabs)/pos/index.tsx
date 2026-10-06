import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Platform,
  UIManager,
  LayoutAnimation,
  KeyboardAvoidingView,
  RefreshControl,
  Vibration,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SideMenu from "../../../components/SideMenu";
import {
  getProducts,
  getProductByBarcode,
  Product,
} from "../../../services/productApi";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  getCustomers,
  createCustomer,
  Customer,
} from "../../../services/customerApi";

import { printReceipt, ReceiptData } from "../../../utils/printReceipt";

import {
  createSale,
  deleteSale,
  getDraftDetail,
  getHeldSaleDetail,
  getNextInvoiceNo,
  getAllCashiers,
} from "../../../services/saleApi";
import { getStoredUser, getStoredPermissions } from "../../../services/authApi";
import { useLocalSearchParams } from "expo-router";
import Dropdown from "../../../components/Dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  adjustLoyaltyPoints,
  getLoyaltySummary,
} from "../../../services/loyaltyApi";

// Enable smooth add/remove/update animations on Android.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CartLine = {
  ProductID: number;
  ProductName: string;
  Qty: number;
  UnitPrice: number;
  DiscountPercent: number;
  TaxPercent: number;
  ManualPrice?: boolean;
};

// Must match the PermissionKey saved in the Permissions table
const PRICE_CHANGE_KEY = "pos.pricechange_";

const SPLIT = "Cash + Card";
type SingleMethod = "Cash" | "Card" | "Mobile";

const PAYMENT_METHODS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Cash", icon: "cash-outline" },
  { label: "Card", icon: "card-outline" },
  { label: "Mobile", icon: "phone-portrait-outline" },
  { label: SPLIT, icon: "swap-horizontal-outline" },
];

const BANKS = [
  "Dutch-Bangla Bank",
  "BRAC Bank",
  "City Bank",
  "Islami Bank",
  "Eastern Bank",
  "Standard Chartered",
  "Sonali Bank",
  "Other Bank",
].map((name, i) => ({ id: i + 1, name }));

const PAYMENT_PROVIDERS: Record<
  SingleMethod,
  { label: string; options: { id: number; name: string }[] }
> = {
  Cash: { label: "Cash Type", options: [{ id: 1, name: "Cash by hand" }] },
  Card: { label: "Bank", options: BANKS },
  Mobile: {
    label: "Mobile Banking",
    options: [
      { id: 1, name: "bKash" },
      { id: 2, name: "Rocket" },
      { id: 3, name: "Nagad" },
    ],
  },
};

const DiscountTypeToggle = ({
  value,
  onChange,
}: {
  value: "fixed" | "percent";
  onChange: (v: "fixed" | "percent") => void;
}) => (
  <View className="flex-row bg-gray-100 rounded-lg p-0.5">
    {(["fixed", "percent"] as const).map((t) => (
      <TouchableOpacity
        key={t}
        onPress={() => onChange(t)}
        className={`px-3 py-1 rounded-md ${value === t ? "bg-blue-600" : ""}`}
      >
        <Text
          className={`text-xs font-medium ${
            value === t ? "text-white" : "text-gray-600"
          }`}
        >
          {t === "fixed" ? "৳" : "%"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const formatCurrency = (n: number) =>
  `৳ ${Number(n || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const priceFor = (p: Product, typeId: number) => {
  const retail = Number(p.SalePrice ?? 0);
  if (typeId === 2) {
    const wholesale = Number(p.WholesalePrice ?? 0);
    return wholesale > 0 ? wholesale : retail;
  }
  return retail;
};

const animateNext = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export default function POSScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const [invoiceNo, setInvoiceNo] = useState("—");
  const [session, setSession] = useState<any>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  // add customer state
  const CUSTOMER_GROUPS = ["Retail", "Wholesale", "VIP"] as const;

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [newCust, setNewCust] = useState({
    CustomerName: "",
    Phone: "",
    CustomerGroup: "Retail" as string,
    AddressLine1: "",
    City: "",
  });
  //fix keyboard avoiding view issue

  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvt, (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customerPhone, setCustomerPhone] = useState("");
  const [loyaltyPointsMap, setLoyaltyPointsMap] = useState<
    Record<number, number>
  >({});
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [showInfo, setShowInfo] = useState(false); // sale info + customer panel
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [received, setReceived] = useState("0");
  const { resumeSaleId, resumeType } = useLocalSearchParams<{
    resumeSaleId?: string;
    resumeType?: string;
  }>();
  const sourceDraftId = useRef<number | null>(null);
  const [showParkPrompt, setShowParkPrompt] = useState(false);
  const [parkName, setParkName] = useState("");

  const [cashiers, setCashiers] = useState<{ id: number; name: string }[]>([]);
  const [cashierId, setCashierId] = useState<number | undefined>();
  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const PRICE_TYPE_OPTIONS = [
    { id: 1, name: "Retail Price" },
    { id: 2, name: "Wholesale Price" },
  ];
  const [priceTypeId, setPriceTypeId] = useState<number>(1);

  // Only users with this permission can edit a line's price (this sale only,
  // the product's price in the database is never changed).
  const [canChangePrice, setCanChangePrice] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const perms = await getStoredPermissions();
        setCanChangePrice(
          Array.isArray(perms) && perms.includes(PRICE_CHANGE_KEY),
        );
      } catch {
        setCanChangePrice(false);
      }
    })();
  }, []);

  const searchInputRef = useRef<TextInput>(null);

  // --- Payment popup ---
  const inputsScrollRef = useRef<ScrollView>(null);
  const scrollInputsToEnd = () =>
    setTimeout(
      () => inputsScrollRef.current?.scrollToEnd({ animated: true }),
      250,
    );

  // --- Barcode scanner ---
  const [showScanner, setShowScanner] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanMessage, setScanMessage] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLock = useRef(false);
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const scanMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState("0");

  const [discountType, setDiscountType] = useState<"fixed" | "percent">(
    "fixed",
  );
  const [discountValue, setDiscountValue] = useState("");

  const [providerId, setProviderId] = useState<number | undefined>(1); // Cash by hand
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");
  const [splitBankId, setSplitBankId] = useState<number | undefined>();

  useEffect(() => {
    return () => {
      if (scanMsgTimer.current) clearTimeout(scanMsgTimer.current);
    };
  }, []);

  // --- Data loading ---
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [prod, cust, inv, user, cashierList, loyaltySummary] =
        await Promise.all([
          getProducts(),
          getCustomers(),
          getNextInvoiceNo(),
          getStoredUser(),
          getAllCashiers(),
          getLoyaltySummary(),
        ]);
      setProducts(prod);
      setCustomers(cust);
      setInvoiceNo(inv);
      setSession(user);
      setCashiers(cashierList);
      setLoyaltyPointsMap(
        Object.fromEntries(
          loyaltySummary.map((l) => [l.CustomerId, l.AvailablePoints]),
        ),
      );
      if (user && cashierId === undefined) setCashierId(user.UserID);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't load POS data. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!resumeSaleId) return;
    (async () => {
      try {
        const isDraft = resumeType === "draft";
        const held = isDraft
          ? await getDraftDetail(Number(resumeSaleId))
          : await getHeldSaleDetail(Number(resumeSaleId));
        sourceDraftId.current = isDraft ? Number(resumeSaleId) : null;
        animateNext();
        setCart(
          held.items.map((i) => ({
            ProductID: i.ProductID,
            ProductName: i.ProductName,
            Qty: i.Qty,
            UnitPrice: i.UnitPrice,
            DiscountPercent: i.DiscountPercent,
            TaxPercent: i.TaxPercent,
            ManualPrice: true,
          })),
        );
        if (held.CustomerID) setCustomerId(held.CustomerID);
        const resumedName = (held as { CustomerName?: string }).CustomerName;
        if (resumedName) setCustomerName(resumedName);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't resume this sale.");
      }
    })();
  }, [resumeSaleId, resumeType]);

  const changePriceType = (id: number) => {
    setPriceTypeId(id);
    animateNext();
    setCart((prev) =>
      prev.map((l) => {
        if (l.ManualPrice) return l; // keep prices the cashier typed in
        const p = products.find((x) => x.ProductID === l.ProductID);
        return p ? { ...l, UnitPrice: priceFor(p, id) } : l;
      }),
    );
  };
  const handleAddCustomer = async () => {
    if (!newCust.CustomerName.trim()) {
      Alert.alert("Missing field", "Customer name is required.");
      return;
    }
    if (!newCust.Phone.trim()) {
      Alert.alert("Missing field", "Phone is required.");
      return;
    }

    try {
      setSavingCustomer(true);
      const created = await createCustomer({
        CustomerName: newCust.CustomerName.trim(),
        Phone: newCust.Phone.trim(),
        CustomerGroup: newCust.CustomerGroup,
        // the API requires these two, so use a placeholder if left empty
        AddressLine1: newCust.AddressLine1.trim() || "N/A",
        City: newCust.City.trim() || "N/A",
        LoyaltyPoints: 0,
        OpeningBalance: 0,
        CreditLimit: 0,
        Status: "Active",
      });

      // add to the list and select for this sale
      setCustomers((prev) => [...prev, created]);
      setCustomerId(created.CustomerId);
      setCustomerName(created.CustomerName);
      setCustomerPhone(created.Phone ?? "—");
      setCustomerLoyaltyPoints(0);

      setNewCust({
        CustomerName: "",
        Phone: "",
        CustomerGroup: "Retail",
        AddressLine1: "",
        City: "",
      });
      setShowAddCustomer(false);
      setShowCustomerPicker(false);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.detail
          ? String(err.response.data.detail)
          : "Could not save the customer.",
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  const addProduct = (p: Product) => {
    animateNext();
    setCart((prev) => {
      const existing = prev.find((l) => l.ProductID === p.ProductID);
      if (existing) {
        return prev.map((l) =>
          l.ProductID === p.ProductID ? { ...l, Qty: l.Qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          ProductID: p.ProductID,
          ProductName: p.ProductName,
          Qty: 1,
          UnitPrice: priceFor(p, priceTypeId),
          DiscountPercent: 0,
          TaxPercent: Number(p.TaxPercent ?? 0),
        },
      ];
    });
    setShowProductPicker(false);
    setSearch("");
  };

  const flashScanMessage = (text: string, ok: boolean) => {
    if (scanMsgTimer.current) clearTimeout(scanMsgTimer.current);
    setScanMessage({ text, ok });
    scanMsgTimer.current = setTimeout(() => setScanMessage(null), 1600);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          "Camera permission",
          "Camera access is needed to scan barcodes.",
        );
        return;
      }
    }
    scanLock.current = false;
    lastScan.current = null;
    setScanMessage(null);
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setTorchOn(false);
  };

  // Stays open after each scan so a whole basket can be scanned in one go
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    const code = data.trim();
    if (!code) return;

    const now = Date.now();
    const last = lastScan.current;
    // The camera re-reads a code many times a second. While the same barcode stays in
    // view keep ignoring it; move it away and scan again to add another unit.
    if (last && last.code === code && now - last.at < 1500) {
      last.at = now;
      return;
    }
    if (scanLock.current) return;

    scanLock.current = true;
    lastScan.current = { code, at: now };
    try {
      // 1) products are already loaded, so match locally first (instant)
      let product: Product | undefined = products.find(
        (p) =>
          p.Barcode?.trim() === code ||
          p.ProductCode?.toLowerCase() === code.toLowerCase(),
      );
      // 2) otherwise ask the server
      if (!product) {
        try {
          product = await getProductByBarcode(code);
        } catch {
          product = undefined;
        }
      }

      if (!product) {
        Vibration.vibrate([0, 80, 60, 80]);
        flashScanMessage(`No product found for ${code}`, false);
        return;
      }
      if (product.Status && product.Status !== "Active") {
        Vibration.vibrate([0, 80, 60, 80]);
        flashScanMessage(`${product.ProductName} is inactive`, false);
        return;
      }

      const qtyAfter =
        (cart.find((l) => l.ProductID === product!.ProductID)?.Qty ?? 0) + 1;
      addProduct(product);
      Vibration.vibrate(60);
      flashScanMessage(`${product.ProductName}  ×${qtyAfter}`, true);
    } finally {
      // short pause between different scans
      setTimeout(() => {
        scanLock.current = false;
      }, 700);
    }
  };

  const updateQty = (productId: number, delta: number) => {
    animateNext();
    setCart((prev) =>
      prev
        .map((l) =>
          l.ProductID === productId
            ? { ...l, Qty: Math.max(0, l.Qty + delta) }
            : l,
        )
        .filter((l) => l.Qty > 0),
    );
  };

  const updateLine = (
    productId: number,
    field: keyof CartLine,
    value: number,
  ) => {
    setCart((prev) =>
      prev.map((l) =>
        l.ProductID === productId
          ? {
              ...l,
              [field]: value,
              ...(field === "UnitPrice" ? { ManualPrice: true } : {}),
            }
          : l,
      ),
    );
  };

  const removeLine = (productId: number, qty: number) => {
    const doRemove = () => {
      animateNext();
      setCart((prev) => prev.filter((l) => l.ProductID !== productId));
    };
    // Guard against an accidental tap wiping out a multi-unit line.
    if (qty > 1) {
      Alert.alert(
        "Remove item?",
        `This line has ${qty} units. Remove the whole line?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: doRemove },
        ],
      );
    } else {
      doRemove();
    }
  };

  const lineTotal = (l: CartLine) => {
    const gross = l.Qty * l.UnitPrice;
    return gross - (gross * l.DiscountPercent) / 100;
  };

  const totals = useMemo(() => {
    const subTotal = cart.reduce((s, l) => s + l.Qty * l.UnitPrice, 0);
    const lineDiscount = cart.reduce(
      (s, l) => s + (l.Qty * l.UnitPrice * l.DiscountPercent) / 100,
      0,
    );
    const tax = cart.reduce(
      (s, l) => s + (lineTotal(l) * l.TaxPercent) / 100,
      0,
    );

    const base = subTotal - lineDiscount;
    const rawValue = parseFloat(discountValue) || 0;
    const manualDiscountAmt =
      discountType === "percent"
        ? (base * Math.min(Math.max(rawValue, 0), 100)) / 100
        : Math.min(Math.max(rawValue, 0), base);

    const redeemAmt = parseFloat(pointsToRedeem) || 0;

    const rawGrand =
      Math.round(
        Math.max(0, base - manualDiscountAmt - redeemAmt + tax) * 100,
      ) / 100;
    // Whole-taka total: the fraction is rounded off (floor), e.g. 1150.56 -> 1150
    const grand = Math.floor(rawGrand);
    const roundOff = Math.round((rawGrand - grand) * 100) / 100;
    return {
      subTotal,
      lineDiscount,
      tax,
      manualDiscountAmt,
      redeemAmt,
      grand,
      rawGrand,
      roundOff,
    };
  }, [cart, discountType, discountValue, pointsToRedeem]);

  const isSplit = paymentMethod === SPLIT;
  const receivedNum = parseFloat(received) || 0;
  const splitCashNum = parseFloat(splitCash) || 0;
  const splitCardNum = parseFloat(splitCard) || 0;

  // Card / Mobile are paid exactly; Cash uses the Received input; Split sums both parts
  const paidNum = isSplit
    ? splitCashNum + splitCardNum
    : paymentMethod === "Cash"
      ? receivedNum
      : totals.grand;

  // In split mode only the cash part can produce change
  const change = Math.max(
    0,
    Math.min(paidNum - totals.grand, isSplit ? splitCashNum : Infinity),
  );
  const isShort =
    (paymentMethod === "Cash" || isSplit) &&
    paidNum < totals.grand &&
    cart.length > 0;

  const providerName = !isSplit
    ? PAYMENT_PROVIDERS[paymentMethod as SingleMethod]?.options.find(
        (o) => o.id === providerId,
      )?.name
    : undefined;

  const selectMethod = (m: string) => {
    setPaymentMethod(m);
    setProviderId(m === "Cash" ? 1 : undefined);
  };

  // Handy quick-cash buttons: exact amount, then round-up denominations.
  const quickAmounts = useMemo(() => {
    if (totals.grand <= 0) return [];
    const floored = Math.floor(totals.grand);
    const ceiled = Math.ceil(totals.grand);
    const roundUps = [50, 100, 500, 1000]
      .map((denom) => Math.ceil(totals.grand / denom) * denom)
      .filter((v) => v > ceiled);
    return Array.from(new Set([floored, ceiled, ...roundUps])).slice(0, 4);
  }, [totals.grand]);

  const handlePay = async (status: "Completed" | "Held" | "Draft") => {
    if (cart.length === 0) {
      Alert.alert("Empty cart", "Add at least one product.");
      return;
    }
    if (!isSplit && !providerId) {
      Alert.alert(
        "Select option",
        paymentMethod === "Card"
          ? "Please select a bank."
          : "Please select a payment option.",
      );
      return;
    }
    if (isSplit && splitCardNum > 0 && !splitBankId) {
      Alert.alert("Select bank", "Please select the bank for the card amount.");
      return;
    }
    if (status === "Held" && !showParkPrompt) {
      setShowParkPrompt(true);
      return;
    }
    if (!session) {
      Alert.alert("Session error", "Please log in again.");
      return;
    }
    if (status === "Completed" && isShort) {
      Alert.alert(
        "Insufficient amount",
        `Received (${formatCurrency(paidNum)}) is less than the total (${formatCurrency(totals.grand)}). Continue anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => submitSale(status) },
        ],
      );
      return;
    }
    submitSale(status);
  };

  const submitSale = async (status: "Completed" | "Held" | "Draft") => {
    try {
      setSaving(true);

      // Amounts recorded as payments never include change
      const cashKept = Math.max(0, splitCashNum - change); // split mode: cash actually kept
      const singleAmount = Math.min(paidNum, totals.grand);

      const payments = isSplit
        ? [
            ...(cashKept > 0
              ? [
                  {
                    Method: "Cash",
                    ProviderID: 1, // Cash by hand
                    Amount: cashKept,
                  },
                ]
              : []),
            ...(splitCardNum > 0
              ? [
                  {
                    Method: "Card",
                    ProviderID: splitBankId,
                    Amount: splitCardNum,
                  },
                ]
              : []),
          ]
        : [
            {
              Method: paymentMethod,
              ProviderID: providerId,
              Amount: singleAmount,
            },
          ];

      const result = await createSale({
        CompanyID: session.CompanyID,
        BranchID: session.PrimaryBranchID,
        CustomerID: customerId,
        UserID: cashierId ?? session.UserID,
        PriceType:
          PRICE_TYPE_OPTIONS.find((p) => p.id === priceTypeId)?.name ??
          "Retail Price",
        SubTotal: totals.subTotal,
        DiscountAmount: totals.manualDiscountAmt,

        DiscountType: discountType,
        DiscountValue: parseFloat(discountValue) || 0,
        TaxAmount: totals.tax,
        GrandTotal: totals.grand,
        PaymentMethod: isSplit
          ? "Cash + Card"
          : paymentMethod === "Cash"
            ? "Cash"
            : `${paymentMethod} - ${providerName}`,
        ReceivedAmount: paidNum,
        ChangeAmount: change,
        PointsToRedeem: parseInt(pointsToRedeem, 10) || 0, // .NET field name
        LoyaltyPointsToRedeem: parseInt(pointsToRedeem, 10) || 0, // FastAPI field name
        Payments: status === "Completed" ? payments : [],
        Status: status,
        items: cart.map((l) => ({
          ProductID: l.ProductID,
          Qty: l.Qty,
          UnitPrice: l.UnitPrice,
          DiscountPercent: l.DiscountPercent,
          TaxPercent: l.TaxPercent,
          LineTotal: lineTotal(l),
        })),
      });

      if (sourceDraftId.current) {
        try {
          await deleteSale(sourceDraftId.current);
        } catch (e) {
          console.error(e);
        }
        sourceDraftId.current = null;
      }

      setShowPayment(false);
      const receipt: ReceiptData = {
        companyName: session.CompanyName,
        branchName: session.BranchName,
        invoiceNo: result.InvoiceNo,
        date: saleDate,
        customerName,
        cashierName:
          cashiers.find((c) => c.id === cashierId)?.name ?? session.FullName,
        priceType: PRICE_TYPE_OPTIONS.find((p) => p.id === priceTypeId)?.name,
        items: cart.map((l) => ({
          name: l.ProductName,
          qty: l.Qty,
          unitPrice: l.UnitPrice,
          discountPercent: l.DiscountPercent,
          total: lineTotal(l),
        })),
        subTotal: totals.subTotal,
        discount: totals.lineDiscount + totals.manualDiscountAmt,
        pointsDiscount: totals.redeemAmt,
        tax: totals.tax,
        grandTotal: totals.grand,
        paymentMethod: isSplit
          ? "Cash + Card"
          : paymentMethod === "Cash"
            ? "Cash"
            : `${paymentMethod} - ${providerName}`,
        received: paidNum,
        change,
      };

      const message = `${result.InvoiceNo}\nChange: ${formatCurrency(result.ChangeAmount)}`;

      if (status === "Completed") {
        Alert.alert(
          "Sale Complete",
          message,
          [
            {
              text: "Print Receipt",
              onPress: async () => {
                try {
                  await printReceipt(receipt);
                } catch (e) {
                  console.log("Print cancelled or failed", e);
                }
                clearSale();
              },
            },
            { text: "Done", style: "cancel", onPress: clearSale },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert("Saved", message, [{ text: "OK", onPress: clearSale }]);
      }
    } catch (err: any) {
      console.log("STATUS:", err?.response?.status);
      console.log("SERVER SAYS:", JSON.stringify(err?.response?.data, null, 2));
      Alert.alert(
        "Error",
        typeof err?.response?.data?.detail === "string"
          ? err.response.data.detail
          : JSON.stringify(
              err?.response?.data?.detail ?? "Couldn't save sale.",
            ),
      );
    } finally {
      setSaving(false);
    }
  };

  const clearSale = async () => {
    animateNext();
    setCart([]);
    setReceived("0");
    setDiscountValue("");
    setDiscountType("fixed");
    setPointsToRedeem("0");
    setCustomerId(undefined);
    setCustomerName("Walk-in Customer");
    try {
      setInvoiceNo(await getNextInvoiceNo());
    } catch {}
  };

  const confirmClear = () => {
    if (cart.length === 0) return;
    Alert.alert("Clear sale?", "This will remove all items from the cart.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearSale },
    ]);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.ProductName?.toLowerCase().includes(search.toLowerCase()) ||
      p.ProductCode?.toLowerCase().includes(search.toLowerCase()) ||
      p.Barcode?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalItems = cart.reduce((s, l) => s + l.Qty, 0);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 text-xs mt-2">Loading POS…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior="padding">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-base font-semibold text-gray-900">
              New Sale
            </Text>
            <Text className="text-xs text-gray-400">{invoiceNo}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => loadData(true)}
            className="mr-2 p-1.5"
            accessibilityLabel="Refresh data"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Ionicons name="refresh" size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePay("Held")}
            disabled={cart.length === 0}
            className={`border rounded-lg px-3 py-1.5 mr-2 ${
              cart.length === 0 ? "border-gray-200" : "border-orange-400"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                cart.length === 0 ? "text-gray-300" : "text-orange-500"
              }`}
            >
              Hold
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePay("Draft")}
            disabled={cart.length === 0}
            className="border border-gray-300 rounded-lg px-3 py-1.5"
          >
            <Text
              className={`text-xs font-medium ${
                cart.length === 0 ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Draft
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Sale info + customer: one line, tap to open */}
        <View className="bg-white border border-gray-200 rounded-xl m-3 mb-0 overflow-hidden">
          <TouchableOpacity
            onPress={() => setShowInfo(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between px-3 py-3"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="receipt-outline" size={16} color="#6B7280" />
              <Text
                numberOfLines={1}
                className="flex-1 ml-2 text-sm text-gray-900"
              >
                <Text className="font-semibold">{invoiceNo}</Text>
                <Text className="text-gray-400">{"  ·  "}</Text>
                <Text>{customerName}</Text>
                {priceTypeId === 2 && (
                  <Text className="text-orange-600 font-semibold">
                    {"  ·  Wholesale"}
                  </Text>
                )}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Price type: always visible */}
        <View className="px-4 pt-3 bg-white mt-3">
          <View className="flex-row bg-gray-100 rounded-xl p-1">
            {PRICE_TYPE_OPTIONS.map((opt) => {
              const active = priceTypeId === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => changePriceType(opt.id)}
                  activeOpacity={0.8}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    active ? "bg-blue-600" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {opt.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Search + Scan */}
        <View className="px-4 pt-3 pb-2 bg-white">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setShowProductPicker(true)}
              className="flex-1 flex-row items-center justify-between bg-blue-600 rounded-xl px-3 py-3 mr-2 active:bg-blue-700"
            >
              <View className="flex-row items-center">
                <Ionicons name="search" size={18} color="#fff" />
                <Text className="text-white text-sm font-medium ml-2">
                  Search Product
                </Text>
              </View>
              <View className="flex-row items-center">
                {totalItems > 0 && (
                  <View className="bg-white/25 rounded-full px-2 py-0.5 mr-2">
                    <Text className="text-white text-xs font-semibold">
                      {totalItems} item{totalItems === 1 ? "" : "s"}
                    </Text>
                  </View>
                )}
                <Ionicons name="add" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openScanner}
              className="flex-row items-center bg-gray-900 rounded-xl px-4 py-3 active:bg-gray-700"
              accessibilityLabel="Scan barcode"
            >
              <Ionicons name="barcode-outline" size={18} color="#fff" />
              <Text className="text-white text-sm font-medium ml-2">Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cart */}
        <View className="px-4 pb-2">
          {cart.length === 0 ? (
            <View className="items-center mt-10 mb-4">
              <Ionicons name="cart-outline" size={44} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2 text-sm mb-3">
                No items added yet
              </Text>
              <TouchableOpacity
                onPress={() => setShowProductPicker(true)}
                className="border border-blue-500 rounded-lg px-4 py-2"
              >
                <Text className="text-blue-600 text-xs font-medium">
                  + Add first item
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            cart.map((item) => (
              <View
                key={item.ProductID}
                className="bg-white border border-gray-200 rounded-xl p-3 mb-2"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-sm font-medium text-gray-900 flex-1 mr-2">
                    {item.ProductName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeLine(item.ProductID, item.Qty)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  {/* Qty stepper */}
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => updateQty(item.ProductID, -1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center active:bg-gray-200"
                    >
                      <Ionicons name="remove" size={16} color="#374151" />
                    </TouchableOpacity>
                    <TextInput
                      value={String(item.Qty)}
                      onChangeText={(v) => {
                        const n = parseInt(v, 10);
                        updateLine(
                          item.ProductID,
                          "Qty",
                          Number.isFinite(n) && n >= 0 ? n : 0,
                        );
                      }}
                      keyboardType="numeric"
                      className="text-sm font-semibold text-gray-900 w-10 text-center"
                    />
                    <TouchableOpacity
                      onPress={() => updateQty(item.ProductID, 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center active:bg-gray-200"
                    >
                      <Ionicons name="add" size={16} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-sm font-semibold text-gray-900">
                    {formatCurrency(lineTotal(item))}
                  </Text>
                </View>

                <View className="flex-row mt-2 pt-2 border-t border-gray-100">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-xs text-gray-400">Price</Text>
                      {canChangePrice && (
                        <Ionicons
                          name="create-outline"
                          size={12}
                          color="#3B82F6"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    {canChangePrice ? (
                      <TextInput
                        value={String(item.UnitPrice)}
                        onChangeText={(v) =>
                          updateLine(
                            item.ProductID,
                            "UnitPrice",
                            parseFloat(v) || 0,
                          )
                        }
                        keyboardType="numeric"
                        selectTextOnFocus
                        className="border border-blue-300 rounded-lg px-2 py-1.5 text-xs text-gray-800"
                      />
                    ) : (
                      <View className="border border-gray-200 bg-gray-50 rounded-lg px-2 py-1.5">
                        <Text className="text-xs text-gray-700">
                          {item.UnitPrice}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-xs text-gray-400 mb-1">Disc %</Text>
                    <TextInput
                      value={String(item.DiscountPercent)}
                      onChangeText={(v) =>
                        updateLine(
                          item.ProductID,
                          "DiscountPercent",
                          parseFloat(v) || 0,
                        )
                      }
                      keyboardType="numeric"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-400 mb-1">Tax %</Text>
                    <TextInput
                      value={String(item.TaxPercent)}
                      onChangeText={(v) =>
                        updateLine(
                          item.ProductID,
                          "TaxPercent",
                          parseFloat(v) || 0,
                        )
                      }
                      keyboardType="numeric"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800"
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar: just totals + pay */}
      <View
        className="bg-white border-t border-gray-200 px-4 pt-3 pb-6"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-500">Items {totalItems}</Text>
          <Text className="text-xs text-gray-500">
            Sub {formatCurrency(totals.subTotal)}
          </Text>
          <Text className="text-xs text-gray-500">
            Disc {formatCurrency(totals.manualDiscountAmt)}
          </Text>
          <Text className="text-xs text-gray-500">
            Tax {formatCurrency(totals.tax)}
          </Text>
        </View>

        <View className="bg-blue-600 rounded-xl px-4 py-2.5 mb-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-sm font-medium">Grand Total</Text>
            <Text className="text-white text-lg font-bold">
              {formatCurrency(totals.rawGrand)}
            </Text>
          </View>
          {totals.roundOff > 0 && (
            <Text className="text-blue-100 text-xs text-right">
              Rounded: {formatCurrency(totals.grand)}
            </Text>
          )}
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={confirmClear}
            disabled={cart.length === 0}
            className={`flex-1 mr-2 border rounded-xl py-3 items-center ${
              cart.length === 0 ? "border-gray-200" : "border-gray-300"
            }`}
          >
            <Text
              className={`font-medium ${
                cart.length === 0 ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Clear
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className={`flex-[2] rounded-xl py-3 items-center flex-row justify-center ${
              cart.length === 0 ? "bg-green-300" : "bg-green-600"
            }`}
          >
            <Ionicons name="card-outline" size={16} color="#fff" />
            <Text className="text-white font-semibold ml-2">Pay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment popup */}
      <Modal
        visible={showPayment}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayment(false)}
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={() => setShowPayment(false)}
          >
            <Pressable
              className="bg-white rounded-t-2xl px-5 pt-5 pb-6 max-h-[92%]"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">
                  Payment
                </Text>
                <TouchableOpacity onPress={() => setShowPayment(false)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="bg-blue-600 rounded-xl px-4 py-2.5 mb-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-sm font-medium">
                    Grand Total
                  </Text>
                  <Text className="text-white text-lg font-bold">
                    {formatCurrency(totals.rawGrand)}
                  </Text>
                </View>
                {totals.roundOff > 0 && (
                  <Text className="text-blue-100 text-xs text-right">
                    Rounded: {formatCurrency(totals.grand)}
                  </Text>
                )}
              </View>

              <ScrollView
                ref={inputsScrollRef}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {customerId && customerLoyaltyPoints > 0 && (
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">
                      Redeem Points (Available: {customerLoyaltyPoints})
                    </Text>
                    <View className="flex-row items-center border border-gray-200 rounded-lg px-3 bg-white">
                      <TextInput
                        value={pointsToRedeem}
                        onChangeText={(v) => {
                          const num = parseInt(v, 10) || 0;
                          setPointsToRedeem(
                            String(
                              Math.max(0, Math.min(num, customerLoyaltyPoints)),
                            ),
                          );
                        }}
                        keyboardType="numeric"
                        className="flex-1 py-2 text-sm text-gray-800"
                      />
                      <Text className="text-xs text-gray-400">
                        = ৳ {pointsToRedeem}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-gray-500">
                      Discount ({discountType === "percent" ? "%" : "৳"})
                    </Text>
                    <DiscountTypeToggle
                      value={discountType}
                      onChange={setDiscountType}
                    />
                  </View>
                  <TextInput
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                    placeholder="0"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
                  />
                </View>

                {/* Payment methods */}
                <View className="flex-row mb-3">
                  {PAYMENT_METHODS.map((m) => (
                    <TouchableOpacity
                      key={m.label}
                      onPress={() => selectMethod(m.label)}
                      className={`flex-1 mr-2 rounded-lg py-2 items-center justify-center ${
                        paymentMethod === m.label
                          ? "bg-blue-600"
                          : "bg-gray-100"
                      }`}
                    >
                      <Ionicons
                        name={m.icon}
                        size={14}
                        color={paymentMethod === m.label ? "#fff" : "#4B5563"}
                      />
                      <Text
                        numberOfLines={1}
                        className={`text-[10px] font-medium mt-0.5 ${
                          paymentMethod === m.label
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Single method: provider dropdown */}
                {!isSplit && (
                  <View className="mb-3">
                    <Dropdown
                      label={
                        PAYMENT_PROVIDERS[paymentMethod as SingleMethod].label
                      }
                      placeholder={
                        paymentMethod === "Card"
                          ? "Select bank"
                          : "Select option"
                      }
                      options={
                        PAYMENT_PROVIDERS[paymentMethod as SingleMethod].options
                      }
                      selectedId={providerId}
                      onSelect={setProviderId}
                    />
                  </View>
                )}

                {/* Split: cash + card */}
                {isSplit && (
                  <View className="border border-gray-200 rounded-xl p-3 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">
                      Cash by hand (৳)
                    </Text>
                    <TextInput
                      value={splitCash}
                      onChangeText={setSplitCash}
                      keyboardType="numeric"
                      placeholder="0"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white mb-3"
                    />

                    <Dropdown
                      label="Card Bank"
                      placeholder="Select bank"
                      options={BANKS}
                      selectedId={splitBankId}
                      onSelect={setSplitBankId}
                    />

                    <View className="flex-row items-center justify-between mt-3 mb-1">
                      <Text className="text-xs text-gray-500">
                        Card amount (৳)
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setSplitCard(
                            String(Math.max(0, totals.grand - splitCashNum)),
                          )
                        }
                      >
                        <Text className="text-xs text-blue-600">
                          Fill remaining
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      value={splitCard}
                      onChangeText={setSplitCard}
                      keyboardType="numeric"
                      placeholder="0"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
                    />

                    <View className="flex-row justify-between mt-3 pt-2 border-t border-gray-100">
                      <Text className="text-xs text-gray-500">
                        Paid {formatCurrency(paidNum)}
                      </Text>
                      <Text
                        className={`text-xs font-semibold ${
                          isShort ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isShort
                          ? `Short ${formatCurrency(totals.grand - paidNum)}`
                          : `Change ${formatCurrency(change)}`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Cash: received + change */}
                {paymentMethod === "Cash" && (
                  <View className="flex-row items-center mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs text-gray-400 mb-1">
                        Received
                      </Text>
                      <TextInput
                        value={received}
                        onChangeText={setReceived}
                        onFocus={scrollInputsToEnd}
                        selectTextOnFocus
                        keyboardType="numeric"
                        className={`border rounded-lg px-2 py-2 text-sm text-gray-800 ${
                          isShort
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }`}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-400 mb-1">
                        {isShort ? "Short by" : "Change"}
                      </Text>
                      <View
                        className={`border rounded-lg px-2 py-2 ${
                          isShort
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            isShort ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {isShort
                            ? formatCurrency(totals.grand - paidNum)
                            : formatCurrency(change)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Quick cash amounts */}
                {paymentMethod === "Cash" && quickAmounts.length > 0 && (
                  <View className="flex-row mb-3">
                    {quickAmounts.map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => setReceived(String(amt))}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 mr-2"
                      >
                        <Text className="text-xs text-gray-600">
                          ৳ {amt.toLocaleString("en-BD")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View className="flex-row mt-3">
                <TouchableOpacity
                  onPress={() => setShowPayment(false)}
                  className="flex-1 mr-2 border border-gray-300 rounded-xl py-3 items-center"
                >
                  <Text className="font-medium text-gray-600">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePay("Completed")}
                  disabled={saving || cart.length === 0}
                  className={`flex-[2] rounded-xl py-3 items-center flex-row justify-center ${
                    cart.length === 0 ? "bg-green-300" : "bg-green-600"
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text className="text-white font-semibold ml-2">
                        Confirm {formatCurrency(totals.grand)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sale info popup */}
      <Modal
        visible={showInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowInfo(false)}
        >
          <Pressable
            className="bg-white rounded-t-2xl px-5 pt-5 pb-6 max-h-[85%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-lg font-semibold text-gray-900">
                Sale Info
              </Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="pb-2">
                {/* Sale info */}
                <Text className="text-xs font-semibold text-gray-500 mt-3 mb-2">
                  SALE INFO
                </Text>

                <View className="flex-row justify-between mb-3">
                  <Text className="text-xs text-gray-500">Invoice No</Text>
                  <Text className="text-xs text-gray-800 font-medium">
                    {invoiceNo}
                  </Text>
                </View>

                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1.5">Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="flex-row items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <Text className="text-xs text-gray-800">
                      {saleDate.toLocaleString()}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={saleDate}
                      mode="date"
                      onChange={(e, d) => {
                        setShowDatePicker(false);
                        if (e.type === "set" && d) setSaleDate(d);
                      }}
                    />
                  )}
                </View>

                <View className="mb-3">
                  <Dropdown
                    label="Cashier"
                    placeholder="Select cashier"
                    options={cashiers}
                    selectedId={cashierId}
                    onSelect={setCashierId}
                  />
                </View>

                {/* Customer */}
                <View className="border-t border-gray-100 pt-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-semibold text-gray-500">
                      CUSTOMER
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => setShowAddCustomer(true)}
                        className="flex-row items-center mr-4"
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={14}
                          color="#16A34A"
                        />
                        <Text className="text-xs text-green-600 ml-1">New</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowCustomerPicker(true)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name="swap-horizontal-outline"
                          size={14}
                          color="#3B82F6"
                        />
                        <Text className="text-xs text-blue-600 ml-1">
                          Change
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text className="text-sm font-medium text-gray-900 mb-1">
                    {customerName}
                  </Text>
                  {customerId && (
                    <>
                      <Text className="text-xs text-gray-500">
                        Phone: {customerPhone || "—"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Loyalty Points: {customerLoyaltyPoints}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowInfo(false)}
              className="bg-blue-600 rounded-xl py-3 items-center mt-3"
            >
              <Text className="text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Product picker */}
      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        //onShow={() => setTimeout(() => searchInputRef.current?.focus(), 150)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          style={{ paddingBottom: kbHeight }}
          onPress={() => setShowProductPicker(false)}
        >
          <Pressable
            className="bg-white rounded-t-2xl p-5 max-h-[75%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Select Product
              </Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-3 bg-gray-50">
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                ref={searchInputRef}
                value={search}
                onChangeText={setSearch}
                placeholder="Name, code or barcode..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                returnKeyType="search"
                className="flex-1 ml-2 py-2.5 text-sm text-gray-800"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredProducts.map((p) => {
                const inCart = cart.find((l) => l.ProductID === p.ProductID);
                return (
                  <TouchableOpacity
                    key={p.ProductID}
                    onPress={() => addProduct(p)}
                    className="flex-row justify-between items-center border border-gray-200 rounded-xl px-3 py-3 mb-2 active:bg-gray-50"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-medium text-gray-800">
                        {p.ProductName}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {p.ProductCode}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      {inCart && (
                        <View className="bg-blue-100 rounded-full px-2 py-0.5 mr-2">
                          <Text className="text-xs text-blue-600 font-medium">
                            x{inCart.Qty}
                          </Text>
                        </View>
                      )}
                      <Text className="text-sm text-gray-600">
                        {formatCurrency(Number(p.SalePrice ?? 0))}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filteredProducts.length === 0 && (
                <View className="items-center py-8">
                  <Ionicons name="search-outline" size={28} color="#D1D5DB" />
                  <Text className="text-center text-gray-400 mt-2">
                    No products found
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Customer picker */}
      <Modal visible={showCustomerPicker} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowCustomerPicker(false)}
        >
          <Pressable
            className="bg-white rounded-t-2xl p-5 max-h-[70%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Select Customer
              </Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setCustomerId(undefined);
                  setCustomerName("Walk-in Customer");
                  setCustomerPhone("");
                  setCustomerLoyaltyPoints(0);
                  setPointsToRedeem("0");
                  setShowCustomerPicker(false);
                }}
                className={`border rounded-xl px-3 py-3 mb-2 ${
                  !customerId ? "border-blue-400 bg-blue-50" : "border-gray-200"
                }`}
              >
                <Text className="text-sm font-medium text-gray-800">
                  Walk-in Customer
                </Text>
              </TouchableOpacity>

              {customers.map((c) => (
                <TouchableOpacity
                  key={c.CustomerId}
                  onPress={async () => {
                    setCustomerId(c.CustomerId);
                    setCustomerName(c.CustomerName);
                    setCustomerPhone(c.Phone ?? "—");
                    setPointsToRedeem("0");
                    try {
                      const summary = await getLoyaltySummary();
                      const match = summary.find(
                        (s) => s.CustomerId === c.CustomerId,
                      );
                      setCustomerLoyaltyPoints(match?.AvailablePoints ?? 0);
                    } catch {
                      setCustomerLoyaltyPoints(0);
                    }
                    setShowCustomerPicker(false);
                  }}
                  className={`border rounded-xl px-3 py-3 mb-2 ${
                    customerId === c.CustomerId
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <Text className="text-sm font-medium text-gray-800">
                    {c.CustomerName}
                  </Text>
                  <Text className="text-xs text-gray-400">{c.Phone}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Quick add customer */}
      <Modal visible={showAddCustomer} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-5"
            onPress={() => !savingCustomer && setShowAddCustomer(false)}
          >
            <Pressable
              className="bg-white rounded-2xl p-5"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  New Customer
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddCustomer(false)}
                  disabled={savingCustomer}
                >
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <Text className="text-xs text-gray-500 mb-1">Name *</Text>
                <TextInput
                  value={newCust.CustomerName}
                  onChangeText={(v) =>
                    setNewCust((p) => ({ ...p, CustomerName: v }))
                  }
                  placeholder="Customer name"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3"
                />

                <Text className="text-xs text-gray-500 mb-1">Phone *</Text>
                <TextInput
                  value={newCust.Phone}
                  onChangeText={(v) => setNewCust((p) => ({ ...p, Phone: v }))}
                  placeholder="01XXXXXXXXX"
                  keyboardType="phone-pad"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3"
                />

                <Text className="text-xs text-gray-500 mb-1">Group</Text>
                <View className="flex-row mb-3">
                  {CUSTOMER_GROUPS.map((g) => {
                    const active = newCust.CustomerGroup === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() =>
                          setNewCust((p) => ({ ...p, CustomerGroup: g }))
                        }
                        className={`px-3 py-1.5 rounded-full mr-2 border ${
                          active
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            active ? "text-white" : "text-gray-600"
                          }`}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text className="text-xs text-gray-500 mb-1">
                  Address (optional)
                </Text>
                <TextInput
                  value={newCust.AddressLine1}
                  onChangeText={(v) =>
                    setNewCust((p) => ({ ...p, AddressLine1: v }))
                  }
                  placeholder="Address"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3"
                />

                <Text className="text-xs text-gray-500 mb-1">
                  City (optional)
                </Text>
                <TextInput
                  value={newCust.City}
                  onChangeText={(v) => setNewCust((p) => ({ ...p, City: v }))}
                  placeholder="City"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4"
                />
              </ScrollView>

              <TouchableOpacity
                onPress={handleAddCustomer}
                disabled={savingCustomer}
                className={`rounded-xl py-3 items-center ${
                  savingCustomer ? "bg-blue-300" : "bg-blue-600"
                }`}
              >
                {savingCustomer ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">
                    Save & Select
                  </Text>
                )}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barcode scanner */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* Top bar */}
          <View className="absolute top-14 left-0 right-0 flex-row items-center justify-between px-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={closeScanner}
                className="bg-black/50 rounded-full p-2"
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white font-semibold text-base ml-3">
                Scan Products
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTorchOn((v) => !v)}
              className={`rounded-full p-2 ${torchOn ? "bg-yellow-400" : "bg-black/50"}`}
            >
              <Ionicons
                name={torchOn ? "flash" : "flash-outline"}
                size={20}
                color={torchOn ? "#111827" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* Scan frame + feedback */}
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
          >
            <View className="w-64 h-40 border-2 border-white rounded-xl" />
            <Text className="text-white text-xs mt-4">
              Point at a barcode — it's added automatically
            </Text>
            {scanMessage && (
              <View
                className={`mt-4 px-4 py-2 rounded-full ${
                  scanMessage.ok ? "bg-green-600" : "bg-red-600"
                }`}
              >
                <Text className="text-white text-sm font-medium">
                  {scanMessage.text}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom bar */}
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-5 pt-4 pb-8">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-500">
                {totalItems} item{totalItems === 1 ? "" : "s"} in cart
              </Text>
              <Text className="text-lg font-bold text-blue-600">
                {formatCurrency(totals.grand)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeScanner}
              className="bg-green-600 rounded-xl py-3.5 items-center"
            >
              <Text className="text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </KeyboardAvoidingView>
  );
}
