import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import SupplierCard from "../../../components/SupplierCard";
import SideMenu from "../../../components/SideMenu";

const mockSuppliers = [
  {
    SupplierId: 1,
    SupplierCode: "SUP-0001",
    SupplierName: "ABC Traders",
    Phone: "01711111111",
    Email: "info@abctraders.com",
    City: "Dhaka",
    DueAmount: 25430,
    Status: "Active" as const,
  },
  {
    SupplierId: 2,
    SupplierCode: "SUP-0002",
    SupplierName: "Rahman Corporation",
    Phone: "01822222222",
    Email: "rahman.corp@gmail.com",
    City: "Chattogram",
    DueAmount: 12500,
    Status: "Active" as const,
  },
];

export default function SupplierListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Suppliers
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Search + filter */}
      <View className="flex-row items-center px-4 mt-4 mb-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 mr-2">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name/phone/..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
        <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-2.5">
          <Ionicons name="filter" size={16} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Count + sort */}
      <View className="flex-row justify-between items-center px-4 mb-2">
        <Text className="text-sm text-gray-500">
          {mockSuppliers.length} suppliers
        </Text>
        <TouchableOpacity className="flex-row items-center">
          <Text className="text-sm text-gray-500 mr-1">Sort</Text>
          <Ionicons name="swap-vertical" size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={mockSuppliers}
        keyExtractor={(item) => item.SupplierId.toString()}
        renderItem={({ item }) => <SupplierCard supplier={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      />

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}