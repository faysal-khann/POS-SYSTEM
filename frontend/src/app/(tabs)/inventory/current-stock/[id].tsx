import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Dropdown from "../../../../components/Dropdown";
import {
  getStockDetail,
  updateStock,
  StockDetail,
} from "../../../../services/stockApi";
import { getBranches, Lookup } from "../../../../services/purchaseApi";
import { API_URL } from "../../../../config/api";

export default function StockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stockId = Number(id);

  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [branches, setBranches] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [branchId, setBranchId] = useState<number | undefined>();
  const [currentStock, setCurrentStock] = useState("0");
  const [reservedStock, setReservedStock] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");
  const [maximumLevel, setMaximumLevel] = useState("0");

  useEffect(() => {
    (async () => {
      try {
        const [d, br] = await Promise.all([getStockDetail(stockId), getBranches()]);
        setDetail(d);
        setBranches(br);
        setBranchId(d.BranchID);
        setCurrentStock(String(d.CurrentStock));
        setReservedStock(String(d.ReservedStock));
        setReorderLevel(String(d.ReorderLevel));
        setMaximumLevel(String(d.MaximumLevel));
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load stock details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [stockId]);

  const handleSave = async () => {
    if (!branchId) {
      Alert.alert("Missing field", "Please select a warehouse.");
      return;
    }
    try {
      setSaving(true);
      const updated = await updateStock(stockId, {
        BranchID: branchId,
        CurrentStock: parseInt(currentStock, 10) || 0,
        ReservedStock: parseInt(reservedStock, 10) || 0,
        ReorderLevel: parseInt(reorderLevel, 10) || 0,
        MaximumLevel: parseInt(maximumLevel, 10) || 0,
      });
      setDetail(updated);
      Alert.alert("Success", "Stock updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't update stock.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !detail) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const liveStockValue =
    (parseInt(currentStock, 10) || 0) * detail.PurchasePrice;
  const liveStatus =
    (parseInt(currentStock, 10) || 0) <= (parseInt(reorderLevel, 10) || 0)
      ? "Low Stock"
      : "In Stock";

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Current Stock - Details
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-medium ml-1.5">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Product Information (read-only) */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Product Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Product</Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700">
              {detail.ProductCode} - {detail.ProductName}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Category</Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700">{detail.CategoryName ?? "—"}</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Brand</Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700">{detail.BrandName ?? "—"}</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Unit</Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700">{detail.UnitShortName ?? "—"}</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Barcode</Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700">{detail.Barcode ?? "—"}</Text>
          </View>
        </View>

        {/* Stock Information (editable) */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Stock Information
        </Text>

        <Dropdown
          label="Warehouse"
          placeholder="Select warehouse"
          required
          options={branches}
          selectedId={branchId}
          onSelect={setBranchId}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Current Stock <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={currentStock}
            onChangeText={setCurrentStock}
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Reserved Stock</Text>
          <TextInput
            value={reservedStock}
            onChangeText={setReservedStock}
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Reorder Level</Text>
          <TextInput
            value={reorderLevel}
            onChangeText={setReorderLevel}
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Maximum Level</Text>
          <TextInput
            value={maximumLevel}
            onChangeText={setMaximumLevel}
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        {/* Stock Value (read-only, live) */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Stock Value
        </Text>

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Purchase Price</Text>
            <Text className="text-sm text-gray-900">৳ {detail.PurchasePrice.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Stock Value</Text>
            <Text className="text-sm font-semibold text-gray-900">
              ৳ {liveStockValue.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-600">Last Updated</Text>
            <Text className="text-sm text-gray-900">
              {new Date(detail.LastUpdatedAt).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Status</Text>
            <View
              className={`px-2.5 py-1 rounded-full ${
                liveStatus === "Low Stock" ? "bg-orange-100" : "bg-green-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  liveStatus === "Low Stock" ? "text-orange-600" : "text-green-600"
                }`}
              >
                {liveStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Product Image (read-only display) */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Product Image
        </Text>

        <View className="bg-white border border-gray-200 rounded-xl p-4 items-center mb-6">
          {detail.ImageUrl ? (
            <Image
              source={{ uri: `${API_URL}${detail.ImageUrl}` }}
              className="w-32 h-32 rounded-lg mb-3"
              resizeMode="contain"
            />
          ) : (
            <View className="w-32 h-32 rounded-lg bg-gray-100 items-center justify-center mb-3">
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/products/${detail.ProductID}`)}
            className="border border-blue-500 rounded-lg px-4 py-2"
          >
            <Text className="text-blue-600 text-sm font-medium">Edit in Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}