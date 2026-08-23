import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import PurchaseCard from "../../../components/PurchaseCard";
import { getPurchases, PurchaseListItem } from "../../../services/purchaseApi";
import { getSuppliers, Supplier } from "../../../services/supplierApi";
import Dropdown from "../../../components/Dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";

const STATUS_ALL = 0;
const STATUS_COMPLETED = 1;
const STATUS_PENDING = 2;
const STATUS_CANCELLED = 3;

const statusIdToValue: Record<
  number,
  "All" | "Completed" | "Pending" | "Cancelled"
> = {
  [STATUS_ALL]: "All",
  [STATUS_COMPLETED]: "Completed",
  [STATUS_PENDING]: "Pending",
  [STATUS_CANCELLED]: "Cancelled",
};

export default function PurchaseListScreen() {
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const ALL_SUPPLIER_ID = -1;

  const [supplierFilter, setSupplierFilter] = useState<number>(ALL_SUPPLIER_ID);

  const [statusFilterId, setStatusFilterId] = useState<number>(STATUS_ALL);
  const [showFilter, setShowFilter] = useState(false);

  const supplierDropdownOptions = [
    { id: ALL_SUPPLIER_ID, name: "All Suppliers" },
    ...suppliers.map((s) => ({
      id: s.SupplierId,
      name: s.SupplierName,
    })),
  ];

  const statusDropdownOptions = [
    { id: STATUS_ALL, name: "All Status" },
    { id: STATUS_COMPLETED, name: "Completed" },
    { id: STATUS_PENDING, name: "Pending" },
    { id: STATUS_CANCELLED, name: "Cancelled" },
  ];
  const fetchPurchases = useCallback(async () => {
    try {
      setError(null);

      const [data, supplierList] = await Promise.all([
        getPurchases({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,

          supplier_id:
            supplierFilter !== ALL_SUPPLIER_ID ? supplierFilter : undefined,

          status:
            statusFilterId !== STATUS_ALL
              ? statusIdToValue[statusFilterId]
              : undefined,
        }),

        suppliers.length === 0 ? getSuppliers() : Promise.resolve(suppliers),
      ]);

      setPurchases(data);

      if (suppliers.length === 0) {
        setSuppliers(supplierList);
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't load purchases. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFrom, dateTo, supplierFilter, statusFilterId, suppliers]);
  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
    }, [fetchPurchases]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchases();
  };

  const activeFilterCount =
    (dateFrom || dateTo ? 1 : 0) +
    (supplierFilter !== ALL_SUPPLIER_ID ? 1 : 0) +
    (statusFilterId !== STATUS_ALL ? 1 : 0);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Purchase List
          </Text>
        </View>
        <TouchableOpacity
          //   onPress={() => router.push("/purchases/add")}
          className="bg-blue-600 px-3 py-2 rounded-lg flex-row items-center"
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-medium ml-1">
            New Purchase
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter bar */}
      <View className="flex-row items-center justify-between px-4 pt-4 mb-2">
        <Text className="text-sm text-gray-500">
          {purchases.length} purchases
        </Text>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className={`flex-row items-center border rounded-xl px-3 py-2 ${
            activeFilterCount > 0
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <Ionicons
            name="filter"
            size={14}
            color={activeFilterCount > 0 ? "#3B82F6" : "#374151"}
          />
          <Text
            className={`text-xs font-medium ml-1.5 ${
              activeFilterCount > 0 ? "text-blue-600" : "text-gray-700"
            }`}
          >
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity
            onPress={fetchPurchases}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.PurchaseID.toString()}
          renderItem={({ item }) => (
            <PurchaseCard
              purchase={item}
              onDeleted={(id) =>
                setPurchases((prev) => prev.filter((p) => p.PurchaseID !== id))
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No purchases found
            </Text>
          }
        />
      )}

      {/* Filter modal */}
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
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Filter Purchases
              </Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* DATE RANGE */}
              {/* DATE RANGE */}
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Date Range
              </Text>

              <View className="flex-row mb-4">
                {/* FROM DATE */}
                <TouchableOpacity
                  onPress={() => setShowFromPicker(true)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-3 bg-white mr-2"
                >
                  <Text className="text-xs text-gray-500">
                    {dateFrom || "From date"}
                  </Text>
                </TouchableOpacity>

                {/* TO DATE */}
                <TouchableOpacity
                  onPress={() => setShowToPicker(true)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-3 bg-white"
                >
                  <Text className="text-xs text-gray-500">
                    {dateTo || "To date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FROM DATE PICKER */}
              {showFromPicker && (
                <DateTimePicker
                  value={dateFrom ? new Date(dateFrom) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowFromPicker(false);

                    if (selectedDate) {
                      const formattedDate = selectedDate
                        .toISOString()
                        .split("T")[0];

                      setDateFrom(formattedDate);
                    }
                  }}
                />
              )}

              {/* TO DATE PICKER */}
              {showToPicker && (
                <DateTimePicker
                  value={dateTo ? new Date(dateTo) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowToPicker(false);

                    if (selectedDate) {
                      const formattedDate = selectedDate
                        .toISOString()
                        .split("T")[0];

                      setDateTo(formattedDate);
                    }
                  }}
                />
              )}

              {/* SUPPLIER */}
              <Dropdown
                label="Supplier"
                placeholder="Select supplier"
                options={supplierDropdownOptions}
                selectedId={supplierFilter}
                onSelect={setSupplierFilter}
              />

              {/* STATUS */}
              <Dropdown
                label="Status"
                placeholder="Select status"
                options={statusDropdownOptions}
                selectedId={statusFilterId}
                onSelect={setStatusFilterId}
              />

              {/* APPLY */}
              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>

              {/* RESET */}
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setDateFrom("");
                    setDateTo("");
                    setSupplierFilter(ALL_SUPPLIER_ID);
                    setStatusFilterId(STATUS_ALL);
                    setShowFilter(false);
                  }}
                  className="items-center mt-3"
                >
                  <Text className="text-gray-500 text-sm">Reset Filter</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
