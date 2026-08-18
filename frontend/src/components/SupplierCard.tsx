import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useState } from "react";
import { Alert, ActivityIndicator } from "react-native";
import { deleteSupplier } from "../services/supplierApi";
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
import { router } from "expo-router";

type SupplierCardProps = {
  supplier: Supplier;
  onDeleted?: (supplierId: number) => void;
};

export default function SupplierCard({
  supplier,
  onDeleted,
}: SupplierCardProps) {
  const isActive = supplier.Status === "Active";
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Supplier",
      `Are you sure you want to delete "${supplier.SupplierName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteSupplier(supplier.SupplierId);
              onDeleted?.(supplier.SupplierId);
            } catch (err) {
              console.error(err);
              Alert.alert(
                "Error",
                "Couldn't delete supplier. Please try again.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3  ">
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
        <View className="flex-row gap-2">
          {/* View */}
          <Pressable
            className="bg-white border border-gray-100 rounded-md p-2 shadow-sm"
            onPress={() =>
              router.push(`/suppliers/view/${supplier.SupplierId}`)
            }
          >
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
          </Pressable>

          {/* Edit */}
          <Pressable
            className="bg-white border border-gray-100 rounded-md p-2 shadow-sm"
            onPress={() => router.push(`/suppliers/${supplier.SupplierId}`)}
          >
            <Ionicons name="create-outline" size={16} color="#22C55E" />
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            className="bg-white border border-gray-100 rounded-md p-2 shadow-sm"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
