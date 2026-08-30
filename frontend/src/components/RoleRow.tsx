import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { RoleListItem } from "../services/roleApi";

export default function RoleRow({
  role,
  onDeleted,
}: {
  role: RoleListItem;
  onDeleted: (id: number) => void;
}) {
  const isActive = role.Status === "Active";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-sm font-semibold text-gray-900">{role.RoleName}</Text>
        <View className={`px-2.5 py-1 rounded-full ${isActive ? "bg-green-100" : "bg-red-100"}`}>
          <Text className={`text-xs font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
            {role.Status}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-gray-500 mb-3">{role.Description ?? "—"}</Text>

      <View className="flex-row justify-between items-center border-t border-gray-100 pt-2">
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600 ml-1">{role.UserCount} users</Text>
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={() => router.push(`./roles/${role.RoleID}`)}
            className="mr-4"
          >
            <Ionicons name="create-outline" size={18} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDeleted(role.RoleID)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}