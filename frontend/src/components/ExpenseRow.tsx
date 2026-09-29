import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExpenseListItem } from "../services/expenseApi";

export default function ExpenseRow({
  expense,
  onDeleted,
}: {
  expense: ExpenseListItem;
  onDeleted: (id: number) => void;
}) {
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900">
            {expense.Description ?? expense.CategoryName}
          </Text>
          <Text className="text-xs text-gray-400">
            {new Date(expense.ExpenseDate).toLocaleDateString()}
          </Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full ${expense.Status === "Paid" ? "bg-green-100" : "bg-orange-100"}`}
        >
          <Text
            className={`text-xs font-medium ${expense.Status === "Paid" ? "text-green-600" : "text-orange-600"}`}
          >
            {expense.Status}
          </Text>
        </View>
        <Text className="text-sm font-bold text-red-600">
          ৳ {expense.Amount.toFixed(2)}
        </Text>
      </View>

      <Text className="text-xs text-gray-400">{expense.ExpenseNo}</Text>

      <View className="self-start bg-blue-50 px-2.5 py-1 rounded-full mb-2">
        <Text className="text-xs font-medium text-blue-600">
          {expense.CategoryName}
        </Text>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Payment</Text>
        <Text className="text-xs text-gray-700">{expense.PaymentMethod}</Text>
      </View>
      {expense.ReferenceNo && (
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-500">Reference</Text>
          <Text className="text-xs text-gray-700">{expense.ReferenceNo}</Text>
        </View>
      )}
      <View className="flex-row justify-between mb-2">
        <Text className="text-xs text-gray-500">Added By</Text>
        <Text className="text-xs text-gray-700">{expense.CreatedByName}</Text>
      </View>

      <View className="flex-row justify-end border-t border-gray-100 pt-2">
        <TouchableOpacity onPress={() => onDeleted(expense.ExpenseID)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
