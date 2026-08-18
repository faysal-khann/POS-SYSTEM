import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";

import { deleteCustomer, Customer } from "../services/customerApi";

type CustomerCardProps = {
  customer: Customer;
  onDeleted?: (customerId: number) => void;
};

export default function CustomerCard({
  customer,
  onDeleted,
}: CustomerCardProps) {
  const isActive = customer.Status === "Active";

  const [deleting, setDeleting] = useState(false);

  // ============================================
  // DELETE CUSTOMER
  // ============================================

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete "${customer.CustomerName}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              setDeleting(true);

              await deleteCustomer(customer.CustomerId);

              onDeleted?.(customer.CustomerId);
            } catch (err) {
              console.error(err);

              Alert.alert(
                "Error",
                "Couldn't delete customer. Please try again.",
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
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      {/* ========================================
          CUSTOMER NAME + STATUS
      ======================================== */}

      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-base font-semibold text-gray-900 flex-1">
          {customer.CustomerName}
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
            {customer.Status}
          </Text>
        </View>
      </View>

      {/* ========================================
          CODE + GROUP + CITY
      ======================================== */}

      <Text className="text-sm text-gray-500 mb-2">
        {customer.CustomerCode}

        {" · "}

        {customer.CustomerGroup || "Regular"}

        {" · "}

        {customer.City || "N/A"}
      </Text>

      {/* ========================================
          PHONE
      ======================================== */}

      <View className="flex-row items-center mb-1">
        <Ionicons name="call-outline" size={14} color="#6B7280" />

        <Text className="text-sm text-gray-700 ml-2">
          {customer.Phone || "No phone"}
        </Text>
      </View>

      {/* ========================================
          EMAIL
      ======================================== */}

      {customer.Email && (
        <View className="flex-row items-center mb-3">
          <Ionicons name="mail-outline" size={14} color="#6B7280" />

          <Text className="text-sm text-gray-700 ml-2">{customer.Email}</Text>
        </View>
      )}

      {/* ========================================
          BOTTOM
      ======================================== */}

      <View className="border-t border-gray-100 pt-3 flex-row justify-between items-center">
        {/* DUE */}

        <Text className="text-orange-500 font-semibold text-sm">
          ৳ {(customer.DueAmount ?? 0).toLocaleString()}
          {" due"}
        </Text>

        {/* ACTION BUTTONS */}

        <View className="flex-row gap-2">
          {/* VIEW */}

          <Pressable
            className="bg-white border border-gray-100 rounded-md p-2 shadow-sm"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/customers/view/[id]",
                params: {
                  id: customer.CustomerId.toString(),
                },
              })
            }
          >
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
          </Pressable>

          {/* EDIT */}

          <Pressable
            className="bg-white border border-gray-100 rounded-md p-2 shadow-sm"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/customers/[id]",
                params: {
                  id: customer.CustomerId.toString(),
                },
              })
            }
          >
            <Ionicons name="create-outline" size={16} color="#22C55E" />
          </Pressable>

          {/* DELETE */}

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
