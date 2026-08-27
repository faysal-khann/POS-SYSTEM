import { View, Text } from "react-native";
import { StockListItem } from "../services/stockApi";

export default function StockCard({ item }: { item: StockListItem }) {
  const isLow = item.Status === "Low Stock";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900">{item.ProductName}</Text>
          <Text className="text-xs text-gray-400">{item.ProductCode}</Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full ${isLow ? "bg-orange-100" : "bg-green-100"}`}
        >
          <Text className={`text-xs font-medium ${isLow ? "text-orange-600" : "text-green-600"}`}>
            {item.Status}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Category</Text>
        <Text className="text-xs text-gray-700">{item.CategoryName ?? "—"}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Warehouse</Text>
        <Text className="text-xs text-gray-700">{item.BranchName}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Unit</Text>
        <Text className="text-xs text-gray-700">{item.UnitShortName ?? "—"}</Text>
      </View>

      <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-2">
        <Text className="text-sm text-gray-600">Qty: {item.CurrentStock}</Text>
        <Text className="text-sm font-semibold text-gray-900">
          ৳ {item.StockValue.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}