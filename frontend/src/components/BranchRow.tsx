import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BranchListItem } from "../services/branchApi";

export default function BranchRow({
  branch,
  onDeleted,
}: {
  branch: BranchListItem;
  onDeleted: (id: number) => void;
}) {
  const isActive = branch.Status === "Active";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900">{branch.BranchName}</Text>
          <Text className="text-xs text-gray-400">{branch.BranchCode}</Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${isActive ? "bg-green-100" : "bg-red-100"}`}>
          <Text className={`text-xs font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
            {branch.Status}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-gray-500 mb-1">Manager: {branch.ManagerName ?? "—"}</Text>
      <Text className="text-xs text-gray-500 mb-1">{branch.Phone ?? "—"}</Text>
      <Text className="text-xs text-gray-500 mb-3">{branch.Address ?? "—"}</Text>

      <View className="flex-row justify-end border-t border-gray-100 pt-2">
        <TouchableOpacity
        //   onPress={() => router.push(`/settings/branches/${branch.BranchID}`)}
          className="mr-4"
        >
          <Ionicons name="create-outline" size={18} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleted(branch.BranchID)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}