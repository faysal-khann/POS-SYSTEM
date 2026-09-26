import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SideMenu from "../../../../components/SideMenu";
import {
  getHeldSales,
  deleteSale,
  HeldSaleListItem,
} from "../../../../services/saleApi";

export default function HeldSalesScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [sales, setSales] = useState<HeldSaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeld = useCallback(async () => {
    try {
      setError(null);
      const data = await getHeldSales();
      setSales(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load held sales.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHeld();
    }, [fetchHeld]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHeld();
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Parked Sale",
      "Are you sure you want to delete this parked sale?",
      [
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
              Alert.alert("Error", "Failed to delete.");
            }
          },
        },
      ],
    );
  };

  const handleResume = (id: number) => {
  router.push({
    pathname: "./pos",
    params: { resumeSaleId: String(id) },
  });
};

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">
          Hold / Park Sales
        </Text>
      </View>

      <View className="px-4 mt-4 mb-2">
        <Text className="text-sm text-gray-500">
          Showing 1 to {sales.length} of {sales.length} entries
        </Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity
            onPress={fetchHeld}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => String(item.SaleID)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No parked sales
            </Text>
          }
          renderItem={({ item }) => (
            <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-900">
                    {item.ParkName ?? `Park #${item.SaleID}`}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(item.SaleDate).toLocaleString()}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  ৳ {item.GrandTotal.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Customer</Text>
                <Text className="text-xs text-gray-700">
                  {item.CustomerName}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Cashier</Text>
                <Text className="text-xs text-gray-700">
                  {item.CashierName}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-gray-500">Items</Text>
                <Text className="text-xs text-gray-700">{item.TotalItems}</Text>
              </View>

              <View className="flex-row justify-end border-t border-gray-100 pt-2">
                <TouchableOpacity
                  onPress={() => handleResume(item.SaleID)}
                  className="mr-4"
                >
                  <Ionicons
                    name="play-forward-outline"
                    size={18}
                    color="#16A34A"
                  />
                </TouchableOpacity>
                <TouchableOpacity className="mr-4">
                  <Ionicons name="create-outline" size={18} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.SaleID)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}
