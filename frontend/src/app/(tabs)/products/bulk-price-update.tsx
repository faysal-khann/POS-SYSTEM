import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  getProducts,
  getCategories,
  getBrands,
  bulkPriceUpdate,
  Product,
  Lookup,
} from "../../../services/productApi";

type UpdateType = "percentage" | "fixed";

export default function PriceUpdateScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [brands, setBrands] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<number | "All">("All");
  const [brandFilter, setBrandFilter] = useState<number | "All">("All");
  const [updateType, setUpdateType] = useState<UpdateType>("percentage");
  const [value, setValue] = useState("5");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterModal, setFilterModal] = useState<"category" | "brand" | "type" | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [prods, cats, brs] = await Promise.all([
          getProducts(),
          getCategories(),
          getBrands(),
        ]);
        setProducts(prods);
        setCategories(cats);
        setBrands(brs);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const numericValue = parseFloat(value) || 0;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = categoryFilter === "All" || p.CategoryID === categoryFilter;
      const matchesBrand = brandFilter === "All" || p.BrandID === brandFilter;
      return matchesCategory && matchesBrand;
    });
  }, [products, categoryFilter, brandFilter]);

  const computeNewPrice = (currentPrice: number) => {
    if (updateType === "percentage") {
      return currentPrice * (1 + numericValue / 100);
    }
    return currentPrice + numericValue;
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.ProductID)));
    }
  };

  const handleApply = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("No products selected", "Select at least one product to update.");
      return;
    }
    if (numericValue === 0) {
      Alert.alert("Invalid value", "Enter a non-zero value.");
      return;
    }

    Alert.alert(
      "Apply Price Update",
      `Update price for ${selectedIds.size} product(s) by ${
        updateType === "percentage" ? `${numericValue}%` : `৳${numericValue}`
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            try {
              setApplying(true);
              const results = await bulkPriceUpdate(
                Array.from(selectedIds),
                updateType,
                numericValue,
                "SalePrice"
              );
              setProducts((prev) =>
                prev.map((p) => {
                  const updated = results.find((r) => r.ProductID === p.ProductID);
                  return updated ? { ...p, SalePrice: updated.NewPrice } : p;
                })
              );
              setSelectedIds(new Set());
              Alert.alert("Success", `Updated ${results.length} product(s).`);
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Couldn't apply price update.");
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "—";

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Price Update</Text>
        </View>
        <TouchableOpacity
          onPress={handleApply}
          disabled={applying}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-sm font-medium">Apply Update</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="px-4 pt-4">
        <View className="flex-row mb-3">
          <TouchableOpacity
            onPress={() => setFilterModal("category")}
            className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 bg-white mr-2"
          >
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {categoryFilter === "All"
                ? "All Categories"
                : categoryName(categoryFilter as number)}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModal("brand")}
            className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 bg-white"
          >
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {brandFilter === "All"
                ? "All Brands"
                : brands.find((b) => b.id === brandFilter)?.name ?? "—"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View className="flex-row mb-4">
          <TouchableOpacity
            onPress={() => setFilterModal("type")}
            className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 bg-white mr-2"
          >
            <Text className="text-xs text-gray-600">
              {updateType === "percentage" ? "Percentage (%)" : "Fixed Amount (৳)"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="0"
              className="flex-1 text-sm text-gray-800"
            />
            <Text className="text-xs text-gray-400">
              {updateType === "percentage" ? "%" : "৳"}
            </Text>
          </View>
        </View>
      </View>

      {/* Select all + count */}
      <View className="flex-row items-center justify-between px-4 mb-2">
        <TouchableOpacity onPress={toggleSelectAll} className="flex-row items-center">
          <Ionicons
            name={
              selectedIds.size === filteredProducts.length && filteredProducts.length > 0
                ? "checkbox"
                : "square-outline"
            }
            size={18}
            color="#3B82F6"
          />
          <Text className="text-sm text-gray-600 ml-2">Select all</Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-400">
          {filteredProducts.length} products · {selectedIds.size} selected
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.ProductID.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.ProductID);
          const currentPrice = Number(item.SalePrice ?? 0);
          const newPrice = computeNewPrice(currentPrice);
          const changed = isSelected && numericValue !== 0;

          return (
            <TouchableOpacity
              onPress={() => toggleSelect(item.ProductID)}
              className={`flex-row items-center bg-white border rounded-xl p-3 mb-2 ${
                isSelected ? "border-blue-400" : "border-gray-200"
              }`}
            >
              <Ionicons
                name={isSelected ? "checkbox" : "square-outline"}
                size={20}
                color={isSelected ? "#3B82F6" : "#D1D5DB"}
              />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-gray-900">{item.ProductName}</Text>
                <Text className="text-xs text-gray-400">
                  {item.ProductCode} · {categoryName(item.CategoryID)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-400">৳{currentPrice.toFixed(2)}</Text>
                <Text
                  className={`text-sm font-semibold ${
                    changed ? "text-green-600" : "text-gray-800"
                  }`}
                >
                  ৳{(changed ? newPrice : currentPrice).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-10">No products found</Text>
        }
      />

      {/* Filter modals */}
      <Modal
        visible={filterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModal(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center px-6"
          onPress={() => setFilterModal(null)}
        >
          <Pressable
            className="bg-white rounded-2xl w-full max-w-sm max-h-[70%] p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {filterModal === "category"
                  ? "Filter by Category"
                  : filterModal === "brand"
                  ? "Filter by Brand"
                  : "Update Type"}
              </Text>
              <TouchableOpacity onPress={() => setFilterModal(null)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {filterModal === "category" && (
              <FlatList
                data={[{ id: "All" as any, name: "All Categories" }, ...categories]}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCategoryFilter(item.id as any);
                      setFilterModal(null);
                    }}
                    className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                      categoryFilter === item.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={
                        categoryFilter === item.id
                          ? "text-blue-600 font-semibold"
                          : "text-gray-700"
                      }
                    >
                      {item.name}
                    </Text>
                    {categoryFilter === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {filterModal === "brand" && (
              <FlatList
                data={[{ id: "All" as any, name: "All Brands" }, ...brands]}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setBrandFilter(item.id as any);
                      setFilterModal(null);
                    }}
                    className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                      brandFilter === item.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={
                        brandFilter === item.id
                          ? "text-blue-600 font-semibold"
                          : "text-gray-700"
                      }
                    >
                      {item.name}
                    </Text>
                    {brandFilter === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {filterModal === "type" && (
              <View>
                {(
                  [
                    { key: "percentage", label: "Percentage (%)" },
                    { key: "fixed", label: "Fixed Amount (৳)" },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => {
                      setUpdateType(opt.key);
                      setFilterModal(null);
                    }}
                    className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                      updateType === opt.key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={
                        updateType === opt.key
                          ? "text-blue-600 font-semibold"
                          : "text-gray-700"
                      }
                    >
                      {opt.label}
                    </Text>
                    {updateType === opt.key && (
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}