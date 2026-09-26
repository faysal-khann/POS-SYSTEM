import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SideMenu from "../../../../components/SideMenu";
import PaginationBar from "../../../../components/PaginationBar";
import { usePagination } from "../../../../hooks/usePagination";
import {
  getDrafts,
  getDraftDetail,
  deleteSale,
  DraftListItem,
  DraftDetail,
} from "../../../../services/saleApi";

const pad = (n: number) => String(n).padStart(2, "0");

// 06/05/2025 11:35 AM
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(h)}:${pad(
    d.getMinutes(),
  )} ${ampm}`;
};

const money = (n: number) => `৳ ${n.toFixed(2)}`;

export default function DraftInvoicesScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewing, setViewing] = useState<DraftDetail | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<number | null>(null);

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
    setCurrentPage,
  } = usePagination(drafts, 10);

  // Keep the page valid after deleting the last row on the last page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, setCurrentPage]);

  const fetchDrafts = useCallback(async () => {
    try {
      setError(null);
      setDrafts(await getDrafts());
    } catch (err) {
      console.error(err);
      setError("Couldn't load draft invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDrafts();
    }, [fetchDrafts]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrafts();
  };

  const handleView = async (id: number) => {
    try {
      setViewLoadingId(id);
      setViewing(await getDraftDetail(id));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't load this draft.");
    } finally {
      setViewLoadingId(null);
    }
  };

  // Opens the draft in POS; saving there replaces the draft
  const handleEdit = (id: number) => {
    setViewing(null);
    router.push({
      pathname: "/pos",
      params: { resumeSaleId: String(id), resumeType: "draft" },
    } as any);
  };

  const handleDelete = (item: DraftListItem) => {
    Alert.alert("Delete Draft", `Are you sure you want to delete ${item.DraftNo}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSale(item.SaleID);
            setDrafts((prev) => prev.filter((d) => d.SaleID !== item.SaleID));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const startIndex = drafts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, drafts.length);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">Draft Invoices</Text>
      </View>

      <View className="px-4 mt-4 mb-2">
        <Text className="text-sm text-gray-500">
          Showing {startIndex} to {endIndex} of {drafts.length} entries
        </Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchDrafts} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.SaleID)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No draft invoices</Text>
          }
          renderItem={({ item, index }) => (
            <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2">
                    <Text className="text-xs text-gray-600">{startIndex + index}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{item.DraftNo}</Text>
                    <Text className="text-xs text-gray-400">{formatDateTime(item.SaleDate)}</Text>
                  </View>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  {money(item.GrandTotal)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Customer</Text>
                <Text className="text-xs text-gray-700">{item.CustomerName}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Items</Text>
                <Text className="text-xs text-gray-700">{item.TotalItems}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-xs text-gray-500">Created By</Text>
                <Text className="text-xs text-gray-700">{item.CashierName}</Text>
              </View>

              <View className="flex-row justify-end border-t border-gray-100 pt-2">
                <TouchableOpacity
                  onPress={() => handleView(item.SaleID)}
                  disabled={viewLoadingId === item.SaleID}
                  className="flex-row items-center mr-5"
                >
                  {viewLoadingId === item.SaleID ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Ionicons name="eye-outline" size={18} color="#3B82F6" />
                  )}
                  <Text className="text-xs text-blue-600 ml-1">View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEdit(item.SaleID)}
                  className="flex-row items-center mr-5"
                >
                  <Ionicons name="create-outline" size={18} color="#F59E0B" />
                  <Text className="text-xs text-amber-600 ml-1">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  className="flex-row items-center"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text className="text-xs text-red-500 ml-1">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {!error && drafts.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* View details modal */}
      <Modal
        visible={!!viewing}
        transparent
        animationType="slide"
        onRequestClose={() => setViewing(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          {viewing && (
            <View className="bg-white rounded-t-2xl max-h-[85%]">
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <View>
                  <Text className="text-base font-semibold text-gray-900">{viewing.DraftNo}</Text>
                  <Text className="text-xs text-gray-400">{formatDateTime(viewing.SaleDate)}</Text>
                </View>
                <TouchableOpacity onPress={() => setViewing(null)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView className="px-4 pt-3" contentContainerStyle={{ paddingBottom: 16 }}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-500">Customer</Text>
                  <Text className="text-xs text-gray-700">{viewing.CustomerName}</Text>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-xs text-gray-500">Created By</Text>
                  <Text className="text-xs text-gray-700">{viewing.CashierName}</Text>
                </View>

                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Items ({viewing.items.length})
                </Text>
                {viewing.items.map((i, idx) => (
                  <View
                    key={`${i.ProductID}-${idx}`}
                    className="flex-row justify-between items-start py-2 border-b border-gray-100"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm text-gray-900">{i.ProductName}</Text>
                      <Text className="text-xs text-gray-400">
                        {i.Qty} × {money(i.UnitPrice)}
                        {i.DiscountPercent > 0 ? ` · ${i.DiscountPercent}% off` : ""}
                      </Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-900">{money(i.LineTotal)}</Text>
                  </View>
                ))}

                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-gray-600">Sub Total</Text>
                    <Text className="text-sm text-gray-900">{money(viewing.SubTotal)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-gray-600">Discount</Text>
                    <Text className="text-sm text-gray-900">- {money(viewing.DiscountAmount)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-gray-600">Tax</Text>
                    <Text className="text-sm text-gray-900">{money(viewing.TaxAmount)}</Text>
                  </View>
                  <View className="flex-row justify-between border-t border-gray-100 pt-2">
                    <Text className="text-base font-semibold text-gray-900">Grand Total</Text>
                    <Text className="text-lg font-bold text-blue-600">
                      {money(viewing.GrandTotal)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row px-4 pb-8 pt-2">
                <TouchableOpacity
                  onPress={() => setViewing(null)}
                  className="flex-1 mr-2 border border-gray-300 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-gray-600 font-medium">Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEdit(viewing.SaleID)}
                  className="flex-[2] bg-green-600 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-white font-semibold">Edit in POS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}