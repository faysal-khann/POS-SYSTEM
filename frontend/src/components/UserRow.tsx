import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UserListItem } from "../services/userApi";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  "Super Admin": { bg: "bg-purple-100", text: "text-purple-600" },
  Manager: { bg: "bg-blue-100", text: "text-blue-600" },
  "Sales Executive": { bg: "bg-green-100", text: "text-green-600" },
  Cashier: { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Store Keeper": { bg: "bg-teal-100", text: "text-teal-600" },
  Accountant: { bg: "bg-orange-100", text: "text-orange-600" },
};

export default function UserRow({
  user,
  onDeleted,
}: {
  user: UserListItem;
  onDeleted: (id: number) => void;
}) {
  const roleColor = ROLE_COLORS[user.RoleName] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  const isActive = user.Status === "Active";

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900">
            {user.FullName}
          </Text>
          <Text className="text-xs text-gray-400">@{user.Username}</Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full ${isActive ? "bg-green-100" : "bg-red-100"}`}
        >
          <Text
            className={`text-xs font-medium ${isActive ? "text-green-600" : "text-red-600"}`}
          >
            {user.Status}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-gray-500 mb-2">{user.Email}</Text>

      <View className="flex-row justify-between items-center mb-3">
        <View className={`px-2.5 py-1 rounded-full ${roleColor.bg}`}>
          <Text className={`text-xs font-medium ${roleColor.text}`}>
            {user.RoleName}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {user.LastLoginAt
            ? new Date(user.LastLoginAt).toLocaleString()
            : "Never logged in"}
        </Text>
      </View>

      <View className="flex-row justify-end border-t border-gray-100 pt-2">
        <TouchableOpacity
          onPress={() => router.push(`./users/view/${user.UserID}`)}
          className="mr-4"
        >
          <Ionicons name="eye-outline" size={18} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`./users/${user.UserID}`)}
          className="mr-4"
        >
          <Ionicons name="create-outline" size={18} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleted(user.UserID)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
