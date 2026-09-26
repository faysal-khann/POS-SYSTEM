import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SideMenu from "../../../../components/SideMenu";
import Dropdown from "../../../../components/Dropdown";
import PaginationBar from "../../../../components/PaginationBar";
import { usePagination } from "../../../../hooks/usePagination";
import {
  getLoyaltySummary,
  LoyaltySummaryItem,
} from "../../../../services/loyaltyApi";

const ALL_ID = 0;
const STATUS_OPTIONS = [
  { id: 0, name: "All Status" },
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function LoyaltyPointsScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [rows, setRows] = useState<LoyaltySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters: what's picked in the dropdowns vs. what's applied by the Filter button
  const [customerPick, setCustomerPick] = useState<number>(ALL_ID);
  const [statusPick, setStatusPick] = useState<number>(0);
  const [applied, setApplied] = useState({ customerId: ALL_ID, statusId: 0 });

  const fetchRows = useCallback(async () => {
    try {
      setError(null);
      setRows(await getLoyaltySummary());
    } catch (err) {
      console.error(err);
      setError("Couldn't load loyalty points.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch every time the screen is opened (e.g. after adjusting points)
  useFocusEffect(
    useCallback(() => {
      fetchRows();
    }, [fetchRows]),
  );

  const customerOptions = useMemo(
    () => [
      { id: ALL_ID, name: "All Customers" },
      ...rows.map((r) => ({
        id: r.CustomerId,
        name: `${r.CustomerCode} - ${r.CustomerName}`,
      })),
    ],
    [rows],
  );

  const filtered = useMemo(() => {
    const statusName = STATUS_OPTIONS.find((s) => s.id === applied.statusId)?.name;
    return rows.filter(
      (r) =>
        (applied.customerId === ALL_ID || r.CustomerId === applied.customerId) &&
        (applied.statusId === 0 || r.Status === statusName),
    );
  }, [rows, applied]);

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
    setCurrentPage,
  } = usePagination(filtered, 10, `${applied.customerId}-${applied.statusId}`);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, setCurrentPage]);

  const applyFilters = () => setApplied({ customerId: customerPick, statusId: statusPick });

  const resetFilters = () => {
    setCustomerPick(ALL_ID);
    setStatusPick(0);
    setApplied({ customerId: ALL_ID, statusId: 0 });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRows();
  };

  // Exports whatever the current filter shows (all pages) as CSV text
  const handleExport = async () => {
    if (filtered.length === 0) {
      Alert.alert("Nothing to export", "There are no rows for the current filter.");
      return;
    }
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = [
      "Customer Code",
      "Customer Name",
      "Total Points",
      "Used Points",
      "Available Points",
      "Status",
    ];
    const lines = [
      header.map(esc).join(","),
      ...filtered.map((r) =>
        [r.CustomerCode, r.CustomerName, r.TotalPoints, r.UsedPoints, r.AvailablePoints, r.Status]
          .map(esc)
          .join(","),
      ),
    ];
    try {
      await Share.share({ title: "Loyalty Points", message: lines.join("\n") });
    } catch (err) {
      console.error(err);
    }
  };

  // Opens the Adjust / History screen for this customer
  const openCustomer = (id: number) => {
    router.push(`/customers/loyalty/${id}` as any);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filtered.length);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">Loyalty Points</Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchRows} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.CustomerId)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          ListHeaderComponent={
            <View>
              {/* Filters */}
              <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <Dropdown
                  label="Customer"
                  placeholder="All Customers"
                  options={customerOptions}
                  selectedId={customerPick}
                  onSelect={setCustomerPick}
                />
                <Dropdown
                  label="Status"
                  placeholder="All Status"
                  options={STATUS_OPTIONS}
                  selectedId={statusPick}
                  onSelect={setStatusPick}
                />
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={applyFilters}
                    className="flex-1 mr-2 flex-row items-center justify-center bg-blue-600 rounded-xl py-3"
                  >
                    <Ionicons name="funnel-outline" size={15} color="#fff" />
                    <Text className="text-white text-sm font-medium ml-2">Filter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={resetFilters}
                    className="flex-1 flex-row items-center justify-center border border-gray-300 rounded-xl py-3"
                  >
                    <Ionicons name="refresh-outline" size={15} color="#4B5563" />
                    <Text className="text-gray-600 text-sm font-medium ml-2">Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Count + Export */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-gray-500">
                  Showing {startIndex} to {endIndex} of {filtered.length} entries
                </Text>
                <TouchableOpacity
                  onPress={handleExport}
                  className="flex-row items-center bg-blue-600 rounded-lg px-3 py-2"
                >
                  <Ionicons name="download-outline" size={14} color="#fff" />
                  <Text className="text-white text-xs font-medium ml-1.5">Export</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No customers found</Text>
          }
          renderItem={({ item, index }) => (
            <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              {/* # / code / status */}
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2">
                    <Text className="text-xs text-gray-600">{startIndex + index}</Text>
                  </View>
                  <Text className="text-xs text-gray-400">{item.CustomerCode}</Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    item.Status === "Active" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      item.Status === "Active" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {item.Status}
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-semibold text-gray-900 mb-3">
                {item.CustomerName}
              </Text>

              {/* Points */}
              <View className="flex-row border-t border-gray-100 pt-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-0.5">Total</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {fmt(item.TotalPoints)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-0.5">Used</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {fmt(item.UsedPoints)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-0.5">Available</Text>
                  <Text className="text-sm font-bold text-green-600">
                    {fmt(item.AvailablePoints)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openCustomer(item.CustomerId)}
                  className="self-center flex-row items-center pl-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="eye-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {!error && filtered.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}