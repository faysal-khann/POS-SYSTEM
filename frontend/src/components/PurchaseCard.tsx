import { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { deletePurchase, PurchaseListItem } from "../services/purchaseApi";

const statusColor = (status: string) => {
  switch (status) {
    case "Completed": return { bg: "bg-green-100", text: "text-green-700" };
    case "Cancelled": return { bg: "bg-red-100", text: "text-red-700" };
    case "Pending": return { bg: "bg-yellow-100", text: "text-yellow-700" };
    default: return { bg: "bg-gray-100", text: "text-gray-700" };
  }
};

const paymentColor = (status: string) => {
  switch (status) {
    case "Paid": return { bg: "bg-green-100", text: "text-green-700" };
    case "Partial": return { bg: "bg-orange-100", text: "text-orange-700" };
    case "Refunded": return { bg: "bg-red-100", text: "text-red-700" };
    default: return { bg: "bg-gray-100", text: "text-gray-700" };
  }
};

type Props = {
  purchase: PurchaseListItem;
  onDeleted: (id: number) => void;
};

export default function PurchaseCard({ purchase, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const status = statusColor(purchase.Status);
  const payment = paymentColor(purchase.PaymentStatus);

  const handleDelete = () => {
    Alert.alert(
      "Delete Purchase",
      `Delete purchase "${purchase.PurchaseNo}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deletePurchase(purchase.PurchaseID);
              onDeleted(purchase.PurchaseID);
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Couldn't delete purchase.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-1">
        <Text className="text-sm font-semibold text-gray-900">{purchase.PurchaseNo}</Text>
        <View className={`px-2 py-0.5 rounded-full ${status.bg}`}>
          <Text className={`text-xs font-medium ${status.text}`}>{purchase.Status}</Text>
        </View>
      </View>

      <Text className="text-sm text-gray-700 mb-0.5">{purchase.SupplierName}</Text>
      <Text className="text-xs text-gray-400 mb-3">
        {new Date(purchase.PurchaseDate).toLocaleDateString()} · {purchase.TotalItems} items
      </Text>

      <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
        <View>
          <Text className="text-xs text-gray-400">Total Amount</Text>
          <Text className="text-base font-bold text-gray-900">
            ৳ {Number(purchase.TotalAmount).toLocaleString()}
          </Text>
        </View>

        <View className={`px-2 py-0.5 rounded-full ${payment.bg}`}>
          <Text className={`text-xs font-medium ${payment.text}`}>{purchase.PaymentStatus}</Text>
        </View>
      </View>

      <View className="flex-row justify-end space-x-2 mt-3">
        <Pressable
        //   onPress={() => router.push(`/purchases/view/${purchase.PurchaseID}`)}
          className="bg-gray-50 border border-gray-100 rounded-md p-2"
        >
          <Ionicons name="eye-outline" size={16} color="#3B82F6" />
        </Pressable>
        <Pressable
        //   onPress={() => router.push(`/purchases/${purchase.PurchaseID}`)}
          className="bg-gray-50 border border-gray-100 rounded-md p-2"
        >
          <Ionicons name="create-outline" size={16} color="#22C55E" />
        </Pressable>
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          className="bg-gray-50 border border-gray-100 rounded-md p-2"
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          )}
        </Pressable>
      </View>
    </View>
  );
}