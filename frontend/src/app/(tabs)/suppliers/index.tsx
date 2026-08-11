import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import SupplierCard from "../../../components/SupplierCard";
import SideMenu from "../../../components/SideMenu";
import { getSuppliers, createSupplier } from "../../../services/supplierApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupplierListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setError(null);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load suppliers. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.SupplierName.toLowerCase().includes(search.toLowerCase()) ||
      s.Phone.includes(search) ||
      s.Email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50  pb-40 ">
      <View>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={24} color="#111827" />
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-gray-900 ml-3">
              Supplier List
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/suppliers/add")}
            className="ml-3"
          >
            <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row">
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white font-medium px-2">Add Supplier</Text>
            </View>
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
            {filteredSuppliers.length} suppliers
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-sm text-gray-500 mr-1">Sort</Text>
            <Ionicons name="swap-vertical" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content states */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-red-500 text-center mb-3">{error}</Text>
            <TouchableOpacity
              onPress={fetchSuppliers}
              className="bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredSuppliers}
            keyExtractor={(item) => item.SupplierId.toString()}
            renderItem={({ item }) => (
              <SupplierCard
                supplier={item}
                onDeleted={(id) =>
                  setSuppliers((prev) =>
                    prev.filter((s) => s.SupplierId !== id),
                  )
                }
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-10">
                No suppliers found
              </Text>
            }
          />
        )}

        <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      </View>
    </SafeAreaView>
  );
}
