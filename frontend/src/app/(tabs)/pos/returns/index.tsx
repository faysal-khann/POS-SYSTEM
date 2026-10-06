import { useState, useMemo, useEffect, useCallback } from "react";
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
  Keyboard,
  Platform,
} from "react-native";
import { getProducts, Product } from "../../../../services/productApi";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import SideMenu from "../../../../components/SideMenu";
import Dropdown from "../../../../components/Dropdown";
import {
  lookupSale,
  createSaleReturn,
  ReturnableItem,
  SaleLookupResult,
} from "../../../../services/saleReturnApi";
import {
  getSales,
  createSale,
  SaleListItem,
  SaleCreateInput,
} from "../../../../services/saleApi";
import { getStoredUser } from "../../../../services/authApi";

const REASONS = ["Damaged", "Wrong Item", "Changed Mind", "Expired", "Other"];
const REFUND_METHODS = ["Cash", "Card", "Mobile", "Other"];

type ReturnLine = ReturnableItem & { ReturnQty: number };
type ExchangeLine = {
  ProductID: number;
  ProductName: string;
  UnitPrice: number;
  TaxPercent: number;
  Qty: number;
  Stock: number;
};

export default function ReturnsRefundsScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [returnType, setReturnType] = useState<"Sales Return" | "Refund">(
    "Sales Return",
  );

  const [invoiceInput, setInvoiceInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [sale, setSale] = useState<SaleLookupResult | null>(null);
  const [lines, setLines] = useState<ReturnLine[]>([]);

  const [returnDate, setReturnDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [note, setNote] = useState("");
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);

  // All completed sales, loaded up-front so the user can pick one without searching
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  const loadSales = useCallback(async () => {
    try {
      setLoadingSales(true);
      const data = await getSales();
      setSales(data.filter((s) => s.Status === "Completed"));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't load sales.");
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Typing in the invoice box now also filters the list (invoice no. or customer)
  const filteredSales = useMemo(() => {
    const q = invoiceInput.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.InvoiceNo.toLowerCase().includes(q) ||
        s.CustomerName.toLowerCase().includes(q),
    );
  }, [sales, invoiceInput]);

  const clearSelection = () => {
    setSale(null);
    setLines([]);
    setInvoiceInput("");
  };

  const handleSearch = async (invoiceNo?: string) => {
    const invoice = (invoiceNo ?? invoiceInput).trim();
    if (!invoice) return;
    try {
      setSearching(true);
      const result = await lookupSale(invoice);
      if (result.items.length === 0) {
        Alert.alert(
          "Nothing to return",
          "All items on this invoice have already been returned.",
        );
        setSale(null);
        setLines([]);
        return;
      }
      setInvoiceInput(result.InvoiceNo);
      setSale(result);
      setLines(result.items.map((i) => ({ ...i, ReturnQty: 0 })));
    } catch (err: any) {
      console.log("========== RETURN SEARCH FAILED ==========");
      console.log("ERROR OBJECT:", err);
      console.log("ERROR MESSAGE:", err?.message);
      console.log("ERROR CODE:", err?.code);
      console.log("STATUS:", err?.response?.status);
      console.log("DATA:", JSON.stringify(err?.response?.data, null, 2));
      console.log("URL:", err?.config?.url);
      console.log("BASE URL:", err?.config?.baseURL);
      console.log("PARAMS:", JSON.stringify(err?.config?.params, null, 2));
      console.log("==========================================");
      console.error("========================================");
      Alert.alert(
        "Not found",
        err?.response?.data?.detail || "Invoice not found.",
      );
      setSale(null);
      setLines([]);
    } finally {
      setSearching(false);
    }
  };

  const updateQty = (productId: number, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.ProductID === productId
          ? { ...l, ReturnQty: Math.max(0, Math.min(qty, l.QtyAvailable)) }
          : l,
      ),
    );
  };

  const lineTotal = (l: ReturnLine) => l.ReturnQty * l.UnitPrice;

  const totals = useMemo(() => {
    const subTotal = lines.reduce((s, l) => s + lineTotal(l), 0);
    const tax = lines.reduce(
      (s, l) => s + (lineTotal(l) * l.TaxPercent) / 100,
      0,
    );
    return { subTotal, tax, grand: subTotal + tax };
  }, [lines]);

  const totalItemsSelected = lines.filter((l) => l.ReturnQty > 0).length;
  const [exchange, setExchange] = useState<ExchangeLine[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pSearch, setPSearch] = useState("");
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const s = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKbHeight(e.endCoordinates.height),
    );
    const h = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbHeight(0),
    );
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const openPicker = async () => {
    setShowPicker(true);
    if (products.length === 0) {
      try {
        const all = await getProducts();
        setProducts(all.filter((p) => p.Status !== "Inactive"));
      } catch {
        Alert.alert("Error", "Couldn't load products.");
      }
    }
  };

  const addExchange = (p: Product) => {
    setExchange((prev) => {
      const found = prev.find((l) => l.ProductID === p.ProductID);
      if (found) {
        return prev.map((l) =>
          l.ProductID === p.ProductID ? { ...l, Qty: l.Qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          ProductID: p.ProductID,
          ProductName: p.ProductName,
          UnitPrice: p.SalePrice ?? 0,
          TaxPercent: p.TaxPercent ?? 0,
          Qty: 1,
          Stock: p.CurrentStock,
        },
      ];
    });
    setShowPicker(false);
    setPSearch("");
  };

  const setExchangeQty = (id: number, qty: number) =>
    setExchange((prev) =>
      qty <= 0
        ? prev.filter((l) => l.ProductID !== id)
        : prev.map((l) => (l.ProductID === id ? { ...l, Qty: qty } : l)),
    );

  const exTotals = useMemo(() => {
    const sub = exchange.reduce((s, l) => s + l.Qty * l.UnitPrice, 0);
    const tax = exchange.reduce(
      (s, l) => s + (l.Qty * l.UnitPrice * l.TaxPercent) / 100,
      0,
    );
    return { sub, tax, grand: sub + tax };
  }, [exchange]);

  // > 0: customer pays the difference, < 0: you refund the difference
  const net = exTotals.grand - totals.grand;

  const filteredExchangeProducts = useMemo(() => {
    const q = pSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.ProductName.toLowerCase().includes(q) ||
        (p.ProductCode ?? "").toLowerCase().includes(q) ||
        (p.Barcode ?? "").toLowerCase().includes(q),
    );
  }, [products, pSearch]);
  const handleProcess = async () => {
    if (!sale) {
      Alert.alert("No invoice", "Search for an invoice first.");
      return;
    }
    const itemsToReturn = lines.filter((l) => l.ReturnQty > 0);
    if (itemsToReturn.length === 0) {
      Alert.alert("No items", "Enter a return quantity for at least one item.");
      return;
    }

    const session = await getStoredUser();
    if (!session) {
      Alert.alert("Session error", "Please log in again.");
      return;
    }

    try {
      setSaving(true);
      const isExchange = exchange.length > 0;

      // 1) sale for the new items (cash, paid in full)
      let exchangeInvoice: string | undefined;
      if (isExchange) {
        const exSale = await createSale({
          CompanyID: sale.CompanyID,
          BranchID: sale.BranchID,
          CustomerID: sale.CustomerID ?? undefined,
          UserID: session.UserID,
          PriceType: "Retail Price",
          SubTotal: exTotals.sub,
          DiscountAmount: 0,
          TaxAmount: exTotals.tax,
          GrandTotal: exTotals.grand,
          PaymentMethod: "Cash",
          ReceivedAmount: exTotals.grand,
          ChangeAmount: 0,
          Payments: [{ Method: "Cash", ProviderID: 1, Amount: exTotals.grand }],
          Status: "Completed",
          items: exchange.map((l) => ({
            ProductID: l.ProductID,
            Qty: l.Qty,
            UnitPrice: l.UnitPrice,
            DiscountPercent: 0,
            TaxPercent: l.TaxPercent,
            LineTotal: l.Qty * l.UnitPrice,
          })),
        } as SaleCreateInput);
        exchangeInvoice = exSale.InvoiceNo;
      }

      // 2) the return for the old items
      let result;
      try {
        result = await createSaleReturn({
          OriginalSaleID: sale.SaleID,
          ReturnType: returnType,
          CompanyID: sale.CompanyID,
          BranchID: sale.BranchID,
          CustomerID: sale.CustomerID ?? undefined,
          UserID: session.UserID,
          Reason: reason,
          Note: isExchange
            ? `Exchange -> ${exchangeInvoice}${note ? ` | ${note}` : ""}`
            : note || undefined,
          SubTotal: totals.subTotal,
          TaxAmount: totals.tax,
          GrandTotal: totals.grand,
          RefundMethod: isExchange ? "Cash" : refundMethod,
          ReceivedAmount: totals.grand,
          items: itemsToReturn.map((l) => ({
            ProductID: l.ProductID,
            ReturnQty: l.ReturnQty,
            UnitPrice: l.UnitPrice,
            LineTotal: lineTotal(l),
          })),
        });
      } catch (e: any) {
        if (isExchange) {
          Alert.alert(
            "Return failed",
            `The new sale ${exchangeInvoice} WAS saved, but the return was not. ` +
              `Process the return again without adding new items.`,
          );
          return;
        }
        throw e;
      }

      const msg = !isExchange
        ? `Return processed. Refund: ৳ ${result.GrandTotal.toFixed(2)}`
        : net > 0.005
          ? `Exchange done (${exchangeInvoice}).\nCustomer pays: ৳ ${net.toFixed(2)}`
          : net < -0.005
            ? `Exchange done (${exchangeInvoice}).\nRefund customer: ৳ ${Math.abs(net).toFixed(2)}`
            : `Exchange done (${exchangeInvoice}).\nEven exchange, no money to collect.`;

      Alert.alert("Success", msg, [
        {
          text: "OK",
          onPress: () => {
            clearSelection();
            setNote("");
            setReason(undefined);
            loadSales();
          },
        },
      ]);
    } catch (err: any) {
      console.error(err);
      const d = err?.response?.data;
      Alert.alert(
        "Error",
        d?.detail || d?.title || err?.message || "Couldn't process.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">
          Returns & Refunds
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Return type toggle */}
        <View className="flex-row mb-4">
          {(["Sales Return", "Refund"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setReturnType(type)}
              className="flex-row items-center mr-6"
            >
              <View
                className={`w-4 h-4 rounded-full border-2 items-center justify-center mr-2 ${
                  returnType === type ? "border-blue-600" : "border-gray-300"
                }`}
              >
                {returnType === type && (
                  <View className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </View>
              <Text className="text-sm text-gray-800">{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invoice search */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Original Invoice
          </Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
            <TextInput
              value={invoiceInput}
              onChangeText={setInvoiceInput}
              placeholder="INV-250506-0001"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              onSubmitEditing={() => handleSearch()}
              editable={!sale}
              className="flex-1 py-3 text-sm text-gray-800"
            />
            <TouchableOpacity
              onPress={() => handleSearch()}
              disabled={searching || !!sale}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="search" size={18} color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sales list — shown immediately, no search needed */}
        {!sale && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Sales ({filteredSales.length})
            </Text>

            {loadingSales ? (
              <View className="my-8">
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : filteredSales.length === 0 ? (
              <Text className="text-sm text-gray-400 text-center my-8">
                {invoiceInput.trim() ? "No matching sales." : "No sales yet."}
              </Text>
            ) : (
              filteredSales.map((s) => (
                <TouchableOpacity
                  key={s.SaleID}
                  onPress={() => handleSearch(s.InvoiceNo)}
                  disabled={searching}
                  className="bg-white border border-gray-200 rounded-xl p-3 mb-3"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {s.InvoiceNo}
                    </Text>
                    <Text className="text-sm font-bold text-blue-600">
                      ৳ {s.GrandTotal.toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 mb-0.5">
                    {s.CustomerName}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(s.SaleDate).toLocaleString()} · {s.TotalItems}{" "}
                    item
                    {s.TotalItems === 1 ? "" : "s"} · {s.PaymentStatus}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {sale && (
          <>
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Customer
              </Text>
              <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
                <Text className="text-sm text-gray-700">
                  {sale.CustomerName}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Return Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-white"
              >
                <Text className="text-sm text-gray-800">
                  {returnDate.toLocaleString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={returnDate}
                  mode="date"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (e.type === "set" && d) setReturnDate(d);
                  }}
                />
              )}
            </View>

            <Dropdown
              label="Reason"
              placeholder="Select reason"
              options={REASONS.map((r, i) => ({ id: i + 1, name: r }))}
              selectedId={reason ? REASONS.indexOf(reason) + 1 : undefined}
              onSelect={(id) => setReason(REASONS[id - 1])}
            />

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Note
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Enter note (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            {/* Items */}
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Items ({totalItemsSelected} selected)
            </Text>

            {lines.map((l) => (
              <View
                key={l.ProductID}
                className="bg-white border border-gray-200 rounded-xl p-3 mb-3"
              >
                <Text className="text-sm font-medium text-gray-900 mb-1">
                  {l.ProductName}
                </Text>
                <Text className="text-xs text-gray-400 mb-2">
                  Available: {l.QtyAvailable} · Unit Price ৳{" "}
                  {l.UnitPrice.toFixed(2)}
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => updateQty(l.ProductID, l.ReturnQty - 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center"
                    >
                      <Ionicons name="remove" size={16} color="#374151" />
                    </TouchableOpacity>
                    <TextInput
                      value={String(l.ReturnQty)}
                      onChangeText={(v) =>
                        updateQty(l.ProductID, parseFloat(v) || 0)
                      }
                      keyboardType="numeric"
                      className="w-12 text-center text-sm font-semibold text-gray-900"
                    />
                    <TouchableOpacity
                      onPress={() => updateQty(l.ProductID, l.ReturnQty + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center"
                    >
                      <Ionicons name="add" size={16} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-sm font-semibold text-gray-900">
                    ৳ {lineTotal(l).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {/* Exchange items */}
            <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-900">
                  Exchange items (optional)
                </Text>
                <TouchableOpacity
                  onPress={openPicker}
                  className="flex-row items-center"
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color="#2563EB"
                  />
                  <Text className="text-sm text-blue-600 ml-1">
                    Add product
                  </Text>
                </TouchableOpacity>
              </View>

              {exchange.length === 0 && (
                <Text className="text-xs text-gray-400">
                  Add products the customer is taking instead.
                </Text>
              )}

              {exchange.map((l) => (
                <View
                  key={l.ProductID}
                  className="flex-row items-center py-2 border-t border-gray-100"
                >
                  <View className="flex-1">
                    <Text className="text-sm text-gray-900">
                      {l.ProductName}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      ৳ {l.UnitPrice} · stock {l.Stock}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setExchangeQty(l.ProductID, l.Qty - 1)}
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  <Text className="w-8 text-center text-sm text-gray-900">
                    {l.Qty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setExchangeQty(l.ProductID, l.Qty + 1)}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color="#2563EB"
                    />
                  </TouchableOpacity>
                  <Text className="w-20 text-right text-sm font-medium text-gray-900">
                    ৳ {(l.Qty * l.UnitPrice).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Total Items</Text>
                <Text className="text-sm text-gray-900">
                  {totalItemsSelected}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Sub Total</Text>
                <Text className="text-sm text-gray-900">
                  ৳ {totals.subTotal.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Tax</Text>
                <Text className="text-sm text-gray-900">
                  ৳ {totals.tax.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-gray-100 pt-2">
                <Text className="text-base font-semibold text-gray-900">
                  Grand Total
                </Text>
                <Text className="text-lg font-bold text-blue-600">
                  ৳ {totals.grand.toFixed(2)}
                </Text>
              </View>
              {exchange.length > 0 && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-gray-600">New items</Text>
                    <Text className="text-sm text-gray-900">
                      ৳ {exTotals.grand.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-base font-semibold text-gray-900">
                      {net > 0.005
                        ? "Customer pays"
                        : net < -0.005
                          ? "Refund customer"
                          : "Even"}
                    </Text>
                    <Text
                      className={`text-lg font-bold ${net > 0.005 ? "text-green-600" : "text-orange-600"}`}
                    >
                      ৳ {Math.abs(net).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Refund method */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Refund Method
            </Text>
            <View className="flex-row mb-6">
              {REFUND_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setRefundMethod(m)}
                  className={`flex-1 mr-2 rounded-lg py-2.5 items-center ${
                    refundMethod === m ? "bg-blue-600" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      refundMethod === m ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={clearSelection}
                className="flex-1 mr-2 border border-gray-300 rounded-xl py-3.5 items-center"
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleProcess}
                disabled={saving}
                className="flex-[2] bg-green-600 rounded-xl py-3.5 items-center flex-row justify-center"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">
                    {exchange.length > 0
                      ? "Process Exchange"
                      : `Process Return ৳ ${totals.grand.toFixed(2)}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          style={{ paddingBottom: kbHeight }}
          onPress={() => setShowPicker(false)}
        >
          <Pressable
            className="bg-white rounded-t-2xl p-5 max-h-[75%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Select Product
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-3 bg-gray-50">
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                value={pSearch}
                onChangeText={setPSearch}
                placeholder="Name, code or barcode..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                className="flex-1 ml-2 py-2.5 text-sm text-gray-800"
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredExchangeProducts.map((p) => (
                <TouchableOpacity
                  key={p.ProductID}
                  onPress={() => addExchange(p)}
                  disabled={p.CurrentStock <= 0}
                  className="flex-row justify-between items-center py-3 border-b border-gray-100"
                  style={{ opacity: p.CurrentStock <= 0 ? 0.4 : 1 }}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm text-gray-900">
                      {p.ProductName}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Stock: {p.CurrentStock}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    ৳ {p.SalePrice ?? 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}
