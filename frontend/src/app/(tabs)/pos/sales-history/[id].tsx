import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSaleDetail, SaleDetail } from "../../../../services/saleApi";
import { getStoredUser } from "../../../../services/authApi";
import { printReceipt } from "../../../../utils/printReceipt";
import { saleDetailToReceipt } from "../../../../utils/saleReceipt";
import { normalizePhone, sendReceiptWhatsApp } from "../../../../utils/whatsapp";

const money = (n: number) => `৳ ${(Number(n) || 0).toFixed(2)}`;

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState({ name: "", branch: "" });

  useEffect(() => {
    (async () => {
      try {
        const [detail, session] = await Promise.all([
          getSaleDetail(Number(id)),
          getStoredUser(),
        ]);
        setSale(detail);
        setCompany({
          name: session?.CompanyName ?? "",
          branch: session?.BranchName ?? "",
        });
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load this sale.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const receipt = () => saleDetailToReceipt(sale!, company.name, company.branch);

  const handlePrint = async () => {
    try {
      await printReceipt(receipt());
    } catch (err) {
      console.log("Print cancelled or failed", err);
    }
  };

  if (loading || !sale) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const lineDiscount = sale.items.reduce(
    (s, i) => s + (i.Qty * i.UnitPrice * i.DiscountPercent) / 100,
    0,
  );
  const canWhatsApp = !!normalizePhone(sale.CustomerPhone);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">
          {sale.InvoiceNo}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Info */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          {[
            ["Date", new Date(sale.SaleDate).toLocaleString()],
            ["Customer", sale.CustomerName],
            ["Phone", sale.CustomerPhone || "—"],
            ["Cashier", sale.CashierName],
            ["Price type", sale.PriceType ?? "—"],
            ["Status", `${sale.Status} · ${sale.PaymentStatus}`],
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between mb-1.5">
              <Text className="text-xs text-gray-500">{label}</Text>
              <Text className="text-xs text-gray-800 flex-1 text-right ml-4">
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Items */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Items ({sale.items.length})
          </Text>
          {sale.items.map((i, idx) => (
            <View
              key={`${i.ProductID}-${idx}`}
              className="py-2 border-t border-gray-100"
            >
              <Text className="text-sm text-gray-900">{i.ProductName}</Text>
              <View className="flex-row justify-between mt-0.5">
                <Text className="text-xs text-gray-500">
                  {i.Qty} x {money(i.UnitPrice)}
                  {i.DiscountPercent ? ` (-${i.DiscountPercent}%)` : ""}
                </Text>
                <Text className="text-sm font-medium text-gray-900">
                  {money(i.LineTotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Row label="Subtotal" value={money(sale.SubTotal)} />
          {lineDiscount + sale.DiscountAmount > 0 && (
            <Row label="Discount" value={`-${money(lineDiscount + sale.DiscountAmount)}`} />
          )}
          {sale.LoyaltyDiscountAmount > 0 && (
            <Row label="Points used" value={`-${money(sale.LoyaltyDiscountAmount)}`} />
          )}
          {sale.TaxAmount > 0 && <Row label="Tax" value={money(sale.TaxAmount)} />}
          <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-1">
            <Text className="text-base font-semibold text-gray-900">Total</Text>
            <Text className="text-lg font-bold text-blue-600">
              {money(sale.GrandTotal)}
            </Text>
          </View>
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Row label={`Paid (${sale.PaymentMethod ?? "—"})`} value={money(sale.ReceivedAmount)} />
            <Row label="Change" value={money(sale.ChangeAmount)} />
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={handlePrint}
            className="flex-1 flex-row items-center justify-center bg-blue-600 rounded-xl py-3.5 mr-2"
          >
            <Ionicons name="print-outline" size={18} color="#fff" />
            <Text className="text-white font-semibold ml-2">Print</Text>
          </TouchableOpacity>
          {canWhatsApp && (
            <TouchableOpacity
              onPress={() => sendReceiptWhatsApp(sale.CustomerPhone, receipt())}
              className="flex-1 flex-row items-center justify-center bg-green-600 rounded-xl py-3.5"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between mb-1.5">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm text-gray-900">{value}</Text>
    </View>
  );
}