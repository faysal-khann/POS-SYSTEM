import { useState, useCallback } from "react";
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
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import SaleRow from "../../../../components/SaleRow";
import SideMenu from "../../../../components/SideMenu";
import Dropdown from "../../../../components/Dropdown";
import PaginationBar from "../../../../components/PaginationBar";
import { usePagination } from "../../../../hooks/usePagination";
import { getSales, getCashiers, deleteSale, SaleListItem } from "../../../../services/saleApi";
import { getCustomers } from "../../../../services/customerApi";

const ALL_ID = -1;
const PAYMENT_STATUS_OPTIONS = [
  { id: 0, name: "All" },
  { id: 1, name: "Paid" },
  { id: 2, name: "Due" },
  { id: 3, name: "Partial" },
];

export default function SalesHistoryScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [cashiers, setCashiers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [customerFilterId, setCustomerFilterId] = useState<number>(ALL_ID);
  const [cashierFilterId, setCashierFilterId] = useState<number>(ALL_ID);
  const [paymentStatusId, setPaymentStatusId] = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      setError(null);
      const [salesData, custData, cashierData] = await Promise.all([
        getSales({
          date_from: dateFrom ? dateFrom.toISOString().split("T")[0] : undefined,
          date_to: dateTo ? dateTo.toISOString().split("T")[0] : undefined,
          customer_id: customerFilterId !== ALL_ID ? customerFilterId : undefined,
          cashier_id: cashierFilterId !== ALL_ID ? cashierFilterId : undefined,
          payment_status:
            paymentStatusId !== 0
              ? PAYMENT_STATUS_OPTIONS.find((p) => p.id === paymentStatusId)?.name
              : undefined,
        }),
        getCustomers(),
        getCashiers(),
      ]);
      setSales(salesData);
      setCustomers(custData.map((c: any) => ({ id: c.CustomerId, name: c.CustomerName })));
      setCashiers(cashierData);
    } catch (err) {
      console.error(err);
      setError("Couldn't load sales history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFrom, dateTo, customerFilterId, cashierFilterId, paymentStatusId]);

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [fetchSales]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Sale", "Are you sure you want to delete this sale?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSale(id);
            setSales((prev) => prev.filter((s) => s.SaleID !== id));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete sale.");
          }
        },
      },
    ]);
  };

  const resetFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    setCustomerFilterId(ALL_ID);
    setCashierFilterId(ALL_ID);
    setPaymentStatusId(0);
  };

  const filteredSales = sales.filter(
    (s) =>
      s.InvoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      s.CustomerName.toLowerCase().includes(search.toLowerCase()),
  );

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(filteredSales, 8, `${search}-${customerFilterId}-${cashierFilterId}-${paymentStatusId}`);

  const hasActiveFilters =
    dateFrom !== null || dateTo !== null || customerFilterId !== ALL_ID ||
    cashierFilterId !== ALL_ID || paymentStatusId !== 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Sales History</Text>
        </View>
      </View>

      {/* Search */}
      <View className="flex-row items-center px-4 mt-4 mb-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search invoice or customer..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className={`ml-2 bg-white border rounded-xl p-2.5 ${
            hasActiveFilters ? "border-blue-500" : "border-gray-200"
          }`}
        >
          <Ionicons name="filter" size={16} color={hasActiveFilters ? "#3B82F6" : "#374151"} />
        </TouchableOpacity>
      </View>

      <View className="px-4 mb-2">
        <Text className="text-sm text-gray-500">{filteredSales.length} sales</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchSales} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.SaleID)}
          renderItem={({ item }) => <SaleRow sale={item} onDeleted={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No sales found</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {!loading && !error && filteredSales.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Filter modal */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-6" onPress={() => setShowFilter(false)}>
          <Pressable className="bg-white rounded-2xl w-full max-w-sm p-5" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <Ionicons name="filter" size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Filter Sales</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date range */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Date Range</Text>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setShowFromPicker(true)}
                    className="flex-1 mr-2 border border-gray-200 rounded-xl px-3 py-3"
                  >
                    <Text className="text-xs text-gray-700">
                      {dateFrom ? dateFrom.toISOString().split("T")[0] : "From"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowToPicker(true)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-3"
                  >
                    <Text className="text-xs text-gray-700">
                      {dateTo ? dateTo.toISOString().split("T")[0] : "To"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showFromPicker && (
                <DateTimePicker
                  value={dateFrom ?? new Date()}
                  mode="date"
                  onChange={(e, d) => {
                    setShowFromPicker(false);
                    if (e.type === "set" && d) setDateFrom(d);
                  }}
                />
              )}
              {showToPicker && (
                <DateTimePicker
                  value={dateTo ?? new Date()}
                  mode="date"
                  onChange={(e, d) => {
                    setShowToPicker(false);
                    if (e.type === "set" && d) setDateTo(d);
                  }}
                />
              )}

              <Dropdown
                label="Customer"
                placeholder="All customers"
                options={[{ id: ALL_ID, name: "All" }, ...customers]}
                selectedId={customerFilterId}
                onSelect={setCustomerFilterId}
              />
              <Dropdown
                label="Cashier"
                placeholder="All cashiers"
                options={[{ id: ALL_ID, name: "All" }, ...cashiers]}
                selectedId={cashierFilterId}
                onSelect={setCashierFilterId}
              />
              <Dropdown
                label="Payment Status"
                placeholder="All"
                options={PAYMENT_STATUS_OPTIONS}
                selectedId={paymentStatusId}
                onSelect={setPaymentStatusId}
              />

              <TouchableOpacity
                onPress={() => {
                  setShowFilter(false);
                  fetchSales();
                }}
                className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
              >
                <Text className="text-white font-semibold">Search</Text>
              </TouchableOpacity>

              {hasActiveFilters && (
                <TouchableOpacity onPress={resetFilters} className="items-center mt-3">
                  <Text className="text-gray-500 text-sm">Reset</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}