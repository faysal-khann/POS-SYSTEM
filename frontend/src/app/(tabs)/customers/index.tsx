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
import { SafeAreaView } from "react-native-safe-area-context";
import { usePagination } from "../../../hooks/usePagination";
import PaginationBar from "../../../components/PaginationBar";
import CustomerCard from "../../../components/CustomerCard";
import SideMenu from "../../../components/SideMenu";

import { getCustomers, Customer } from "../../../services/customerApi";

export default function CustomerListScreen() {
  // ============================================
  // MENU
  // ============================================

  const [menuVisible, setMenuVisible] = useState(false);

  // ============================================
  // SEARCH
  // ============================================

  const [search, setSearch] = useState("");

  // ============================================
  // CUSTOMERS
  // ============================================

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ============================================
  // SORT
  // ============================================

  const [sortAZ, setSortAZ] = useState(false);

  // ============================================
  // FILTER
  // ============================================

  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");
  type CustomerGroup = "All" | "Retail" | "Wholesale" | "VIP";
  const [groupFilter, setGroupFilter] = useState<CustomerGroup>("All");

  const [showFilter, setShowFilter] = useState(false);

  // ============================================
  // FETCH CUSTOMERS
  // ============================================

  const fetchCustomers = useCallback(async () => {
    try {
      setError(null);

      const data = await getCustomers();

      setCustomers(data);
    } catch (err) {
      console.error(err);

      setError("Couldn't load customers. Check your connection.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ============================================
  // REFRESH
  // ============================================

  const onRefresh = () => {
    setRefreshing(true);

    fetchCustomers();
  };

  // ============================================
  // GROUPS
  // ============================================

 const groups: CustomerGroup[] = [
  "All",
  "Retail",
  "Wholesale",
  "VIP",
  
  
];

  // ============================================
  // FILTER
  // ============================================

  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      customer.CustomerName?.toLowerCase().includes(searchText) ||
      customer.Phone?.toLowerCase().includes(searchText) ||
      customer.Email?.toLowerCase().includes(searchText) ||
      customer.CustomerCode?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || customer.Status === statusFilter;

    const matchesGroup =
      groupFilter === "All" || customer.CustomerGroup === groupFilter;

    return matchesSearch && matchesStatus && matchesGroup;
  });

  // ============================================
  // SORT
  // ============================================

  const displayedCustomers = sortAZ
    ? [...filteredCustomers].sort((a, b) =>
        a.CustomerName.localeCompare(b.CustomerName),
      )
    : filteredCustomers;

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(displayedCustomers, 10, `${search}-${statusFilter}`);

  // data={paginatedData} in FlatList
  // <PaginationBar currentPage={currentPage} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} pageSize={pageSize} onPageSizeChange={setPageSize} />

  // ============================================
  // SCREEN
  // ============================================

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right", "bottom"]}
    >
      {/* ========================================
          HEADER
      ======================================== */}

      <View className="flex-row items-center justify-between px-4 pt-4 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Customer List
          </Text>
        </View>

        {/* ADD CUSTOMER */}

        <TouchableOpacity
        //   onPress={() =>
        //     router.push(
        //       "/(tabs)/customers/add"
        //     )
        //   }
        >
          <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row">
            <Ionicons name="add" size={16} color="white" />

            <Text className="text-white font-medium px-2">Add Customer</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ========================================
          SEARCH + FILTER
      ======================================== */}

      <View className="flex-row items-center px-4 mt-4 mb-2">
        {/* SEARCH */}

        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 mr-2">
          <Ionicons name="search" size={16} color="#9CA3AF" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search customer by name, phone, email..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>

        {/* FILTER */}

        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className={`bg-white border rounded-xl p-2.5 ${
            statusFilter !== "All" || groupFilter !== "All"
              ? "border-blue-500"
              : "border-gray-200"
          }`}
        >
          <Ionicons
            name="filter"
            size={16}
            color={
              statusFilter !== "All" || groupFilter !== "All"
                ? "#3B82F6"
                : "#374151"
            }
          />
        </TouchableOpacity>
      </View>

      {/* ========================================
          COUNT + SORT
      ======================================== */}

      <View className="flex-row justify-between items-center px-4 mb-2">
        <Text className="text-sm text-gray-500">
          {filteredCustomers.length} customers
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

      {/* ========================================
          CONTENT
      ======================================== */}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>

          <TouchableOpacity
            onPress={fetchCustomers}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}

          keyExtractor={(item) => item.CustomerId.toString()}

          renderItem={({ item }) => (
            <CustomerCard
              customer={item}

              onDeleted={(id) =>
                setCustomers((prev) =>
                  prev.filter((customer) => customer.CustomerId !== id),
                )
              }
            />
          )}

          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}

          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }

          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No customers found
            </Text>
          }
        />
      )}

      {!loading && !error && displayedCustomers.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          // pageSizeOptions={[5, 10, 20, 50]} // 👈 optional, this is already the default
        />
      )}

      {/* ========================================
          FILTER MODAL
      ======================================== */}

      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center px-6"
          onPress={() => setShowFilter(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-full max-w-sm p-5"
            onPress={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <Ionicons name="filter" size={20} color="#3B82F6" />

                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Filter Customers
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ==================================
                CUSTOMER GROUP
            ================================== */}

            <Text className="text-sm font-medium text-gray-700 mb-3">
              Customer Group
            </Text>

            {groups.map((group) => (
              <TouchableOpacity
                key={group}
                onPress={() => setGroupFilter(group)}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                  groupFilter === group
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={
                    groupFilter === group
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }
                >
                  {group === "All" ? "All Groups" : group}
                </Text>

                {groupFilter === group && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}

            {/* ==================================
                STATUS
            ================================== */}

            <Text className="text-sm font-medium text-gray-700 mt-3 mb-3">
              Status
            </Text>

            {(["All", "Active", "Inactive"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                  statusFilter === status
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={
                    statusFilter === status
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }
                >
                  {status === "All" ? "All Status" : status}
                </Text>

                {statusFilter === status && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}

            {/* APPLY */}

            <TouchableOpacity
              onPress={() => setShowFilter(false)}
              className="bg-blue-500 rounded-xl py-3 mt-5 items-center"
            >
              <Text className="text-white font-semibold">Apply Filter</Text>
            </TouchableOpacity>

            {/* CLEAR */}

            {(statusFilter !== "All" || groupFilter !== "All") && (
              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("All");

                  setGroupFilter("All");

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

      {/* ========================================
          SIDE MENU
      ======================================== */}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}
