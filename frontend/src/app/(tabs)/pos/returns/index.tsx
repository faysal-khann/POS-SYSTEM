import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
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
import { getSales, SaleListItem } from "../../../../services/saleApi";
import { getStoredUser } from "../../../../services/authApi";

const REASONS = ["Damaged", "Wrong Item", "Changed Mind", "Expired", "Other"];
const REFUND_METHODS = ["Cash", "Card", "Mobile", "Other"];

type ReturnLine = ReturnableItem & { ReturnQty: number };

export default function ReturnsRefundsScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [returnType, setReturnType] = useState<"Sales Return" | "Refund">("Sales Return");

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
        Alert.alert("Nothing to return", "All items on this invoice have already been returned.");
        setSale(null);
        setLines([]);
        return;
      }
      setInvoiceInput(result.InvoiceNo);
      setSale(result);
      setLines(result.items.map((i) => ({ ...i, ReturnQty: 0 })));
    } catch (err: any) {
      console.error(err);
      Alert.alert("Not found", err?.response?.data?.detail || "Invoice not found.");
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
    const tax = lines.reduce((s, l) => s + (lineTotal(l) * l.TaxPercent) / 100, 0);
    return { subTotal, tax, grand: subTotal + tax };
  }, [lines]);

  const totalItemsSelected = lines.filter((l) => l.ReturnQty > 0).length;

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
      const result = await createSaleReturn({
        OriginalSaleID: sale.SaleID,
        ReturnType: returnType,
        CompanyID: sale.CompanyID,
        BranchID: sale.BranchID,
        CustomerID: sale.CustomerID ?? undefined,
        UserID: session.UserID,
        Reason: reason,
        Note: note || undefined,
        SubTotal: totals.subTotal,
        TaxAmount: totals.tax,
        GrandTotal: totals.grand,
        RefundMethod: refundMethod,
        ReceivedAmount: totals.grand,
        items: itemsToReturn.map((l) => ({
          ProductID: l.ProductID,
          ReturnQty: l.ReturnQty,
          UnitPrice: l.UnitPrice,
          LineTotal: lineTotal(l),
        })),
      });

      Alert.alert("Success", `Return processed. Refund: ৳ ${result.GrandTotal.toFixed(2)}`, [
        {
          text: "OK",
          onPress: () => {
            clearSelection();
            setNote("");
            setReason(undefined);
            loadSales(); // refresh list after a return
          },
        },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.detail || "Couldn't process return.");
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
        <Text className="text-lg font-semibold text-gray-900 ml-3">Returns & Refunds</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
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
                {returnType === type && <View className="w-2 h-2 rounded-full bg-blue-600" />}
              </View>
              <Text className="text-sm text-gray-800">{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invoice search */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Original Invoice</Text>
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
            <TouchableOpacity onPress={() => handleSearch()} disabled={searching || !!sale}>
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
              <View className="my-8"><ActivityIndicator size="large" color="#3B82F6" /></View>
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
                    <Text className="text-sm font-semibold text-gray-900">{s.InvoiceNo}</Text>
                    <Text className="text-sm font-bold text-blue-600">
                      ৳ {s.GrandTotal.toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 mb-0.5">{s.CustomerName}</Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(s.SaleDate).toLocaleString()} · {s.TotalItems} item
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
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Customer</Text>
              <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
                <Text className="text-sm text-gray-700">{sale.CustomerName}</Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Return Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-white"
              >
                <Text className="text-sm text-gray-800">{returnDate.toLocaleString()}</Text>
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
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Note</Text>
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
              <View key={l.ProductID} className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
                <Text className="text-sm font-medium text-gray-900 mb-1">{l.ProductName}</Text>
                <Text className="text-xs text-gray-400 mb-2">
                  Available: {l.QtyAvailable} · Unit Price ৳ {l.UnitPrice.toFixed(2)}
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
                      onChangeText={(v) => updateQty(l.ProductID, parseFloat(v) || 0)}
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

            {/* Totals */}
            <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Total Items</Text>
                <Text className="text-sm text-gray-900">{totalItemsSelected}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Sub Total</Text>
                <Text className="text-sm text-gray-900">৳ {totals.subTotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Tax</Text>
                <Text className="text-sm text-gray-900">৳ {totals.tax.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between border-t border-gray-100 pt-2">
                <Text className="text-base font-semibold text-gray-900">Grand Total</Text>
                <Text className="text-lg font-bold text-blue-600">৳ {totals.grand.toFixed(2)}</Text>
              </View>
            </View>

            {/* Refund method */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Refund Method</Text>
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
                    Process Return ৳ {totals.grand.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}