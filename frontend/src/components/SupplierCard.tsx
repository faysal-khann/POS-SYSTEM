import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Supplier = {
  SupplierId: number;
  SupplierCode: string;
  SupplierName: string;
  Phone: string;
  Email: string;
  City: string;
  DueAmount: number;
  Status: "Active" | "Inactive";
};

export default function SupplierCard({ supplier }: { supplier: Supplier }) {
  const isActive = supplier.Status === "Active";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-base font-semibold text-gray-900">
          {supplier.SupplierName}
        </Text>
        <View
          className={`px-2 py-0.5 rounded-full ${
            isActive ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isActive ? "text-green-700" : "text-red-700"
            }`}
          >
            {supplier.Status}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-gray-500 mb-2">
        {supplier.SupplierCode} · {supplier.City}
      </Text>

      <View className="flex-row items-center mb-1">
        <Ionicons name="call-outline" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-700 ml-2">{supplier.Phone}</Text>
      </View>

      <View className="flex-row items-center mb-3">
        <Ionicons name="mail-outline" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-700 ml-2">{supplier.Email}</Text>
      </View>

      <View className="border-t border-gray-100 pt-3 flex-row justify-between items-center">
        <Text className="text-orange-500 font-semibold text-sm">
          ৳ {supplier.DueAmount.toLocaleString()} due
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}