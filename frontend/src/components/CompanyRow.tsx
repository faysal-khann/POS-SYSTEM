import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CompanyListItem } from "../services/companyApi";

export default function CompanyRow({
  company,
  onDeleted,
}: {
  company: CompanyListItem;
  onDeleted: (id: number) => void;
}) {
  const isActive = company.Status === "Active";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-sm font-semibold text-gray-900">{company.CompanyName}</Text>
        <View className={`px-2.5 py-1 rounded-full ${isActive ? "bg-green-100" : "bg-red-100"}`}>
          <Text className={`text-xs font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
            {company.Status}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-gray-500 mb-1">{company.Phone ?? "—"}</Text>
      <Text className="text-xs text-gray-500 mb-1">{company.Email ?? "—"}</Text>
      <Text className="text-xs text-gray-500 mb-3">{company.Address ?? "—"}</Text>

      <View className="flex-row justify-between items-center border-t border-gray-100 pt-2">
        <Text className="text-xs text-gray-600">{company.Currency ?? "—"}</Text>
        <View className="flex-row">
          <TouchableOpacity
            // onPress={() => router.push(`/settings/company-info/${company.CompanyID}`)}
            className="mr-4"
          >
            <Ionicons name="create-outline" size={18} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDeleted(company.CompanyID)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}