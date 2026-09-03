import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PermissionListItem } from "../services/permissionApi";

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  Dashboard: { bg: "bg-blue-100", text: "text-blue-600" },
  POS: { bg: "bg-purple-100", text: "text-purple-600" },
  Products: { bg: "bg-teal-100", text: "text-teal-600" },
};

export default function PermissionRow({
  permission,
  onDeleted,
}: {
  permission: PermissionListItem;
  onDeleted: (id: number) => void;
}) {
  const moduleColor = MODULE_COLORS[permission.Module] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  const isActive = permission.Status === "Active";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2">
          {permission.PermissionName}
        </Text>
        <View className={`px-2.5 py-1 rounded-full ${isActive ? "bg-green-100" : "bg-red-100"}`}>
          <Text className={`text-xs font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
            {permission.Status}
          </Text>
        </View>
      </View>

      <View className={`self-start px-2.5 py-1 rounded-full mb-2 ${moduleColor.bg}`}>
        <Text className={`text-xs font-medium ${moduleColor.text}`}>{permission.Module}</Text>
      </View>

      <Text className="text-xs text-gray-500 mb-3">{permission.Description ?? "—"}</Text>

      <View className="flex-row justify-end border-t border-gray-100 pt-2">
        <TouchableOpacity className="mr-4">
          <Ionicons name="create-outline" size={18} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleted(permission.PermissionID)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}