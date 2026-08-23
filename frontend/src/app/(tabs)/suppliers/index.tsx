import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import SupplierCard from "../../../components/SupplierCard";
import SideMenu from "../../../components/SideMenu";
import { getSuppliers, createSupplier, Supplier } from "../../../services/supplierApi";
import { SafeAreaView } from "react-native-safe-area-context";
 import { useFocusEffect } from "expo-router";
export default function SupplierListScreen() {
 // 👈 change this number to control suppliers per page
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortAZ, setSortAZ] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // 👈 default page size — change here
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
 
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

 useFocusEffect(
  useCallback(() => {
    fetchSuppliers();
  }, [fetchSuppliers])
);
  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.SupplierName.toLowerCase().includes(search.toLowerCase()) ||
       
        s.Email?.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "All" || s.Status === statusFilter),
  );

  const displayedSuppliers = sortAZ
    ? [...filteredSuppliers].sort((a, b) =>
        a.SupplierName.localeCompare(b.SupplierName),
      )
    : filteredSuppliers;

  const totalPages = Math.max(
    1,
    Math.ceil(displayedSuppliers.length / pageSize),
  );
  const paginatedSuppliers = displayedSuppliers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortAZ, pageSize]);
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      
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
          {/* Search */}
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

          {/* Filter */}
          <TouchableOpacity
            onPress={() => setShowFilter(true)}
            className={`bg-white border rounded-xl p-2.5 ${
              statusFilter !== "All" ? "border-blue-500" : "border-gray-200"
            }`}
          >
            <Ionicons
              name="filter"
              size={16}
              color={statusFilter !== "All" ? "#3B82F6" : "#374151"}
            />
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View className="mx-4 mb-3 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
            <Text className="text-sm font-semibold text-gray-700 px-2 py-1.5">
              Filter by Status
            </Text>

            {/* All */}
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("All");
                setShowFilter(false);
              }}
              className="flex-row items-center justify-between px-3 py-2.5 rounded-lg"
            >
              <Text
                className={
                  statusFilter === "All"
                    ? "text-blue-500 font-semibold"
                    : "text-gray-600"
                }
              >
                All
              </Text>

              {statusFilter === "All" && (
                <Ionicons name="checkmark" size={18} color="#3B82F6" />
              )}
            </TouchableOpacity>

            {/* Active */}
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("Active");
                setShowFilter(false);
              }}
              className="flex-row items-center justify-between px-3 py-2.5 rounded-lg"
            >
              <Text
                className={
                  statusFilter === "Active"
                    ? "text-blue-500 font-semibold"
                    : "text-gray-600"
                }
              >
                Active
              </Text>

              {statusFilter === "Active" && (
                <Ionicons name="checkmark" size={18} color="#3B82F6" />
              )}
            </TouchableOpacity>

            {/* Inactive */}
            <TouchableOpacity
              onPress={() => {
                setStatusFilter("Inactive");
                setShowFilter(false);
              }}
              className="flex-row items-center justify-between px-3 py-2.5 rounded-lg"
            >
              <Text
                className={
                  statusFilter === "Inactive"
                    ? "text-blue-500 font-semibold"
                    : "text-gray-600"
                }
              >
                Inactive
              </Text>

              {statusFilter === "Inactive" && (
                <Ionicons name="checkmark" size={18} color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Count + sort */}
        <View className="flex-row justify-between items-center px-4 mb-2">
          <Text className="text-sm text-gray-500">
            {filteredSuppliers.length} suppliers
          </Text>
          <TouchableOpacity
            onPress={() => setSortAZ((prev) => !prev)}
            className="flex-row items-center"
          >
            <Text
              className={`text-sm mr-1 ${
                sortAZ ? "text-blue-500 font-semibold" : "text-gray-500"
              }`}
            >
              Sort
            </Text>

            <Ionicons
              name="swap-vertical"
              size={14}
              color={sortAZ ? "#3B82F6" : "#6B7280"}
            />
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
            className="mb-20"
            data={paginatedSuppliers} // 👈 changed from displayedSuppliers
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

        {!loading && !error && displayedSuppliers.length > 0 && (
          <View className=" bg-white  border border-gray-200 px-4 py-2 absolute bottom-7 left-0 right-0  rounded-full mx-4 ">
            {/* Page size selector */}
            <View className="flex-row items-center justify-center mb-1">
              <Text className="text-xs text-gray-500 mr-2">Show:</Text>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setPageSize(size)}
                  className={`px-3 py-1 rounded-lg mx-1 ${
                    pageSize === size ? "bg-blue-500" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      pageSize === size
                        ? "text-white font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prev / Next */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`flex-row items-center px-3 py-2 rounded-lg ${
                  currentPage === 1 ? "opacity-40" : ""
                }`}
              >
                <Ionicons name="chevron-back" size={16} color="#3B82F6" />
                <Text className="text-blue-500 font-medium ml-1">Previous</Text>
              </TouchableOpacity>

              <Text className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={`flex-row items-center px-3 py-2 rounded-lg ${
                  currentPage === totalPages ? "opacity-40" : ""
                }`}
              >
                <Text className="text-blue-500 font-medium mr-1">Next</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <Modal
          visible={showFilter}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilter(false)}
        >
          {/* Dark background */}
          <Pressable
            className="flex-1 bg-black/40 justify-center items-center px-6"
            onPress={() => setShowFilter(false)}
          >
            {/* Popup box */}
            <Pressable
              className="bg-white rounded-2xl w-full max-w-sm p-5"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                  <Ionicons name="filter" size={20} color="#3B82F6" />

                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    Filter Suppliers
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setShowFilter(false)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Status */}
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Status
              </Text>

              {/* All */}
              <TouchableOpacity
                onPress={() => setStatusFilter("All")}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                  statusFilter === "All"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={
                    statusFilter === "All"
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }
                >
                  All Suppliers
                </Text>

                {statusFilter === "All" && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>

              {/* Active */}
              <TouchableOpacity
                onPress={() => setStatusFilter("Active")}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                  statusFilter === "Active"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />

                  <Text
                    className={
                      statusFilter === "Active"
                        ? "text-green-600 font-semibold"
                        : "text-gray-700"
                    }
                  >
                    Active
                  </Text>
                </View>

                {statusFilter === "Active" && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                )}
              </TouchableOpacity>

              {/* Inactive */}
              <TouchableOpacity
                onPress={() => setStatusFilter("Inactive")}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 ${
                  statusFilter === "Inactive"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" />

                  <Text
                    className={
                      statusFilter === "Inactive"
                        ? "text-red-600 font-semibold"
                        : "text-gray-700"
                    }
                  >
                    Inactive
                  </Text>
                </View>

                {statusFilter === "Inactive" && (
                  <Ionicons name="checkmark-circle" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>

              {/* Apply Button */}
              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                className="bg-blue-500 rounded-xl py-3 mt-5 items-center"
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>

              {/* Clear */}
              {statusFilter !== "All" && (
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilter("All");
                    setShowFilter(false);
                  }}
                  className="items-center mt-3"
                >
                  <Text className="text-gray-500 text-sm">Clear Filter</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </Pressable>
        </Modal>
   
    </SafeAreaView>
  );
}
