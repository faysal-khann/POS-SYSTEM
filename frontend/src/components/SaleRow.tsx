import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SaleListItem } from "../services/saleApi";

export default function SaleRow({
  sale,
  onDeleted,
}: {
  sale: SaleListItem;
  onDeleted: (id: number) => void;
}) {
  const isPaid = sale.PaymentStatus === "Paid";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900">{sale.InvoiceNo}</Text>
          <Text className="text-xs text-gray-400">
            {new Date(sale.SaleDate).toLocaleString()}
          </Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${isPaid ? "bg-green-100" : "bg-orange-100"}`}>
          <Text className={`text-xs font-medium ${isPaid ? "text-green-600" : "text-orange-600"}`}>
            {sale.PaymentStatus}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Customer</Text>
        <Text className="text-xs text-gray-700">{sale.CustomerName}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Cashier</Text>
        <Text className="text-xs text-gray-700">{sale.CashierName}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Payment</Text>
        <Text className="text-xs text-gray-700">{sale.PaymentMethod ?? "—"}</Text>
      </View>

      <View className="flex-row justify-between items-center border-t border-gray-100 pt-2 mt-2">
        <Text className="text-xs text-gray-600">{sale.TotalItems} items</Text>
        <Text className="text-sm font-semibold text-gray-900">
          ৳ {sale.GrandTotal.toFixed(2)}
        </Text>
      </View>

      <View className="flex-row justify-end border-t border-gray-100 pt-2 mt-2">
        <TouchableOpacity
        //   onPress={() => router.push(`/pos/sales-history/${sale.SaleID}`)}
          className="mr-4"
        >
          <Ionicons name="eye-outline" size={18} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Ionicons name="print-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleted(sale.SaleID)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}