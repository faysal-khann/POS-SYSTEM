import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Dropdown from "../../../components/Dropdown";
import {
  createPurchase,
  getBranches,
  Lookup,
} from "../../../services/purchaseApi";
import { getSuppliers, Supplier } from "../../../services/supplierApi";
import { getProducts, Product } from "../../../services/productApi";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { createBranch } from "../../../services/purchaseApi";


type DiscountType = "percent" | "fixed";

type ItemRow = {
  key: string;
  ProductID?: number;
  ProductName: string;
  BatchNo: string;
  Qty: string;
  UnitPrice: string;
  DiscountValue: string;
  DiscountType: DiscountType;
};

const PAYMENT_TERMS: Lookup[] = [
  { id: 1, name: "Cash" },
  { id: 2, name: "Credit" },
  { id: 3, name: "Bank Transfer" },
  { id: 4, name: "Mobile Banking" },
];

const emptyRow = (): ItemRow => ({
  key: Math.random().toString(36).slice(2),
  ProductName: "",
  BatchNo: "",
  Qty: "0",
  UnitPrice: "0",
  DiscountValue: "0",
  DiscountType: "percent",
});

// Small reusable toggle used for switching between % and ৳ discount modes
function DiscountTypeToggle({
  value,
  onChange,
  compact = false,
}: {
  value: DiscountType;
  onChange: (v: DiscountType) => void;
  compact?: boolean;
}) {
  return (
    <View
      className={`flex-row bg-gray-100 rounded-lg overflow-hidden ${
        compact ? "" : "ml-2"
      }`}
    >
      <TouchableOpacity
        onPress={() => onChange("percent")}
        className={`px-2.5 py-1.5 ${value === "percent" ? "bg-blue-600" : ""}`}
      >
        <Text
          className={`text-xs font-medium ${
            value === "percent" ? "text-white" : "text-gray-500"
          }`}
        >
          %
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange("fixed")}
        className={`px-2.5 py-1.5 ${value === "fixed" ? "bg-blue-600" : ""}`}
      >
        <Text
          className={`text-xs font-medium ${
            value === "fixed" ? "text-white" : "text-gray-500"
          }`}
        >
          ৳
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NewPurchaseScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Lookup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<number | undefined>();
  const [paymentTermId, setPaymentTermId] = useState<number | undefined>();
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType] = useState<DiscountType>("fixed");
  const [taxPercent, setTaxPercent] = useState("0");
  const [shippingCharge, setShippingCharge] = useState("0");

  const [items, setItems] = useState<ItemRow[]>([emptyRow(), emptyRow()]);
  const [productPickerFor, setProductPickerFor] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // inside component:
  // state
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchManager, setNewBranchManager] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) {
      Alert.alert("Missing field", "Branch Name is required.");
      return;
    }

    try {
      setSavingBranch(true);
      const created = await createBranch({
        CompanyID: 1,
        BranchName: newBranchName,
        ManagerName: newBranchManager || undefined,
        Phone: newBranchPhone || undefined,
        Address: newBranchAddress || undefined,
      });

      setBranches((prev) => [...prev, { id: created.id, name: created.name }]);
      setBranchId(created.id);
      setShowAddBranch(false);
      setNewBranchName("");
      setNewBranchManager("");
      setNewBranchPhone("");
      setNewBranchAddress("");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't create branch.");
    } finally {
      setSavingBranch(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const search = productSearch.toLowerCase();

    return (
      p.ProductName?.toLowerCase().includes(search) ||
      p.ProductCode?.toLowerCase().includes(search)
    );
  });
  useEffect(() => {
    (async () => {
      try {
        const [sup, br, prod] = await Promise.all([
          getSuppliers(),
          getBranches(),
          getProducts(),
        ]);
        setSuppliers(sup);
        setBranches(br);
        setProducts(prod);
        if (br.length > 0) setBranchId(br[0].id);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load suppliers/branches/products.");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const updateItem = (
    key: string,
    field: keyof ItemRow,
    value: string | DiscountType,
  ) => {
    setItems((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const selectProductForRow = (key: string, product: Product) => {
    setItems((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              ProductID: product.ProductID,
              ProductName: product.ProductName,
              UnitPrice: String(product.PurchasePrice ?? 0),
            }
          : row,
      ),
    );
    setProductPickerFor(null);
  };

  const addRow = () => setItems((prev) => [...prev, emptyRow()]);

  const removeRow = (key: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((row) => row.key !== key));
  };

  // Discount amount for a single line, in currency terms
  const rowDiscountAmount = (row: ItemRow) => {
    const qty = parseFloat(row.Qty) || 0;
    const price = parseFloat(row.UnitPrice) || 0;
    const discount = parseFloat(row.DiscountValue) || 0;
    const gross = qty * price;

    if (row.DiscountType === "percent") {
      return (gross * discount) / 100;
    }
    return Math.min(discount, gross); // don't let fixed discount exceed line total
  };

  const rowTotal = (row: ItemRow) => {
    const qty = parseFloat(row.Qty) || 0;
    const price = parseFloat(row.UnitPrice) || 0;
    const gross = qty * price;
    return gross - rowDiscountAmount(row);
  };

  const subTotal = items.reduce((sum, row) => sum + rowTotal(row), 0);

  const grossSubTotal = items.reduce((sum, row) => {
    const qty = parseFloat(row.Qty) || 0;
    const price = parseFloat(row.UnitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const discountRaw = parseFloat(discountValue) || 0;
  const discountAmt =
    discountType === "percent"
      ? (subTotal * discountRaw) / 100
      : Math.min(discountRaw, subTotal);

  const taxPct = parseFloat(taxPercent) || 0;
  const shipping = parseFloat(shippingCharge) || 0;
  const taxable = subTotal - discountAmt;
  const taxAmt = (taxable * taxPct) / 100;
  const grandTotal = taxable + taxAmt + shipping;

  const handleSave = async () => {
    if (!supplierId) {
      Alert.alert("Missing field", "Please select a Supplier.");
      return;
    }
    if (!branchId) {
      Alert.alert("Missing field", "Please select a Warehouse.");
      return;
    }

    const validItems = items.filter(
      (row) => row.ProductID && parseFloat(row.Qty) > 0,
    );
    if (validItems.length === 0) {
      Alert.alert("No items", "Add at least one product with a quantity.");
      return;
    }

    try {
      setSaving(true);
      await createPurchase({
        CompanyID: 1, // single-company setup for now
        BranchID: branchId,
        SupplierID: supplierId,
        PurchaseDate: purchaseDate,
        PaymentTerm: PAYMENT_TERMS.find((p) => p.id === paymentTermId)?.name,
        ReferenceNo: referenceNo,
        Remarks: remarks,
        SubTotal: subTotal,
        DiscountValue: discountRaw,
        DiscountType: discountType,
        DiscountAmount: discountAmt,
        TaxPercent: taxPct,
        TaxAmount: taxAmt,
        ShippingCharge: shipping,
        GrandTotal: grandTotal,
        Status: "Completed",
        PaymentStatus: "Paid",
        items: validItems.map((row) => ({
          ProductID: row.ProductID!,
          BatchNo: row.BatchNo,
          Qty: parseFloat(row.Qty) || 0,
          UnitPrice: parseFloat(row.UnitPrice) || 0,
          DiscountValue: parseFloat(row.DiscountValue) || 0,
          DiscountType: row.DiscountType,
          DiscountAmount: rowDiscountAmount(row),
          LineTotal: rowTotal(row),
        })),
      });

      Alert.alert("Success", "Purchase saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't save purchase.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingLookups) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const supplierOptions: Lookup[] = suppliers.map((s) => ({
    id: s.SupplierId,
    name: s.SupplierName,
  }));

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            New Purchase
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-medium ml-1.5">
                Save
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {/* Purchase Information */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Purchase Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Purchase No
          </Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-500">
              Auto-generated on save
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Purchase Date <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>
        <View className="flex-row items-start">
          <View className="flex-1 mr-2">
            <Dropdown
              label="Supplier"
              placeholder="Select supplier"
              required
              options={supplierOptions}
              selectedId={supplierId}
              onSelect={setSupplierId}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/suppliers/add")}
            className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mt-[24px]"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-start">
          <View className="flex-1 mr-2">
            <Dropdown
              label="Warehouse"
              placeholder="Select warehouse"
              options={branches}
              required
              selectedId={branchId}
              onSelect={setBranchId}
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowAddBranch(true)}
            className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mt-[24px]"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <Dropdown
          label="Payment Term"
          placeholder="Select payment term"
          options={PAYMENT_TERMS}
          selectedId={paymentTermId}
          onSelect={setPaymentTermId}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Reference No
          </Text>
          <TextInput
            value={referenceNo}
            onChangeText={setReferenceNo}
            placeholder="Enter reference number"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Remarks
          </Text>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Enter remarks"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        {/* Item Details */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Item Details
        </Text>

        {items.map((row, index) => (
          <View
            key={row.key}
            className="bg-white border border-gray-200 rounded-xl p-3 mb-3"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs text-gray-400 font-medium">
                Item {index + 1}
              </Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeRow(row.key)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setProductPickerFor(row.key)}
              className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-white mb-2"
            >
              <Text
                className={`text-sm ${row.ProductName ? "text-gray-800" : "text-gray-400"}`}
              >
                {row.ProductName || "Select Product *"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TextInput
              value={row.BatchNo}
              onChangeText={(v) => updateItem(row.key, "BatchNo", v)}
              placeholder="Enter batch no"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white mb-2"
            />

            <View className="flex-row mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-xs text-gray-500 mb-1">Qty *</Text>
                <TextInput
                  value={row.Qty}
                  onChangeText={(v) => updateItem(row.key, "Qty", v)}
                  keyboardType="numeric"
                  placeholder="0"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Unit Price *</Text>
                <TextInput
                  value={row.UnitPrice}
                  onChangeText={(v) => updateItem(row.key, "UnitPrice", v)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white"
                />
              </View>
            </View>

            {/* Discount with fixed / percentage toggle */}
            <View className="mb-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-gray-500">
                  Discount ({row.DiscountType === "percent" ? "%" : "৳"})
                </Text>
                <DiscountTypeToggle
                  value={row.DiscountType}
                  onChange={(v) => updateItem(row.key, "DiscountType", v)}
                  compact
                />
              </View>
              <TextInput
                value={row.DiscountValue}
                onChangeText={(v) => updateItem(row.key, "DiscountValue", v)}
                keyboardType="numeric"
                placeholder="0"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="flex-row justify-between items-center border-t border-gray-100 pt-2 mt-2">
              <Text className="text-xs text-gray-500">
                Discount: ৳ {rowDiscountAmount(row).toFixed(2)}
              </Text>
              <Text className="text-sm font-semibold text-gray-900">
                ৳ {rowTotal(row).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={addRow}
          className="flex-row items-center justify-center bg-blue-600 rounded-xl py-3 mb-6"
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-medium ml-1.5">Add Row</Text>
        </TouchableOpacity>

        {/* Totals */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Sub Total</Text>
            <Text className="text-sm text-gray-900">
              ৳ {grossSubTotal.toFixed(2)}
            </Text>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm text-gray-600">Discount</Text>
              <DiscountTypeToggle
                value={discountType}
                onChange={setDiscountType}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-400">
                {discountType === "percent"
                  ? `= ৳ ${discountAmt.toFixed(2)}`
                  : "Fixed amount"}
              </Text>
              <TextInput
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 bg-white w-24 text-right"
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-600">Tax (%)</Text>
            <TextInput
              value={taxPercent}
              onChangeText={setTaxPercent}
              keyboardType="numeric"
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 bg-white w-24 text-right"
            />
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Tax Amount</Text>
            <Text className="text-sm text-gray-900">৳ {taxAmt.toFixed(2)}</Text>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-600">Shipping Charge</Text>
            <TextInput
              value={shippingCharge}
              onChangeText={setShippingCharge}
              keyboardType="numeric"
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 bg-white w-24 text-right"
            />
          </View>

          <View className="flex-row justify-between border-t border-gray-100 pt-3">
            <Text className="text-base font-semibold text-gray-900">
              Grand Total
            </Text>
            <Text className="text-lg font-bold text-green-600">
              ৳ {grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Product picker modal */}
      {productPickerFor && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm max-h-[70%] p-5">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Select Product
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setProductPickerFor(null);
                  setProductSearch("");
                }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-4 bg-gray-50">
              <Ionicons name="search" size={18} color="#9CA3AF" />

              <TextInput
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search product..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-2 py-3 text-sm text-gray-800"
              />

              {productSearch.length > 0 && (
                <TouchableOpacity onPress={() => setProductSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Products */}
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <TouchableOpacity
                    key={p.ProductID}
                    onPress={() => {
                      selectProductForRow(productPickerFor, p);
                      setProductSearch("");
                    }}
                    className="flex-row justify-between items-center border border-gray-200 rounded-xl px-4 py-3 mb-2"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-medium text-gray-800">
                        {p.ProductName}
                      </Text>

                      <Text className="text-xs text-gray-400">
                        {p.ProductCode}
                      </Text>
                    </View>

                    <Text className="text-sm text-gray-600">
                      ৳ {Number(p.PurchasePrice ?? 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-center text-gray-400 py-6">
                  No products found
                </Text>
              )}
            </KeyboardAwareScrollView>
          </View>
        </View>
      )}
      {showAddBranch && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Add Branch
              </Text>
              <TouchableOpacity onPress={() => setShowAddBranch(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Auto-generated code preview (read-only) */}
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Branch Code
              </Text>
              <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
                <Text className="text-sm text-gray-500">
                  Auto-generated on save
                </Text>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Branch Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={newBranchName}
                onChangeText={setNewBranchName}
                placeholder="Enter branch name"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Manager Name
              </Text>
              <TextInput
                value={newBranchManager}
                onChangeText={setNewBranchManager}
                placeholder="Enter manager name"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </Text>
              <TextInput
                value={newBranchPhone}
                onChangeText={setNewBranchPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Address
              </Text>
              <TextInput
                value={newBranchAddress}
                onChangeText={setNewBranchAddress}
                placeholder="Enter address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddBranch}
              disabled={savingBranch}
              className="bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
            >
              {savingBranch ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Save Branch</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
