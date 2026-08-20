import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import {
  getProducts,
  getCategories,
  getBrands,
  Product,
  Lookup,
  updateProductPrice,
} from "../../../services/productApi";

export default function PriceUpdateScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [brands, setBrands] = useState<Lookup[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "All">("All");
  const [brandFilter, setBrandFilter] = useState<number | "All">("All");

  const [filterModal, setFilterModal] = useState<"category" | "brand" | null>(
    null,
  );

  // ---- Multi-select state (always on, no toggle) ----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkEditVisible, setBulkEditVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [prods, cats, brs] = await Promise.all([
        getProducts(),
        getCategories(),
        getBrands(),
      ]);

      setProducts(prods);
      setCategories(cats);
      setBrands(brs);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Search + filters
  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchText ||
        product.ProductName?.toLowerCase().includes(searchText) ||
        product.ProductCode?.toLowerCase().includes(searchText) ||
        product.Barcode?.toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "All" || product.CategoryID === categoryFilter;

      const matchesBrand =
        brandFilter === "All" || product.BrandID === brandFilter;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, search, categoryFilter, brandFilter]);

  const categoryName = (id: number) => {
    return categories.find((item) => item.id === id)?.name ?? "All";
  };

  const brandName = (id: number) => {
    return brands.find((item) => item.id === id)?.name ?? "All";
  };

  // ---- Selection helpers ----

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.ProductID));

  const toggleSelectProduct = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        // deselect only the currently visible ones
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.ProductID));
        return next;
      }

      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(p.ProductID));
      return next;
    });
  };

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.has(p.ProductID)),
    [products, selectedIds],
  );

  const handleCardPress = (product: Product) => {
    toggleSelectProduct(product.ProductID);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16A34A" />

        <Text className="text-gray-500 mt-3">Loading products...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={23} color="#111827" />
          </TouchableOpacity>

          <View>
            <Text className="text-xl font-bold text-gray-900">
              Price Update
            </Text>

            <Text className="text-xs text-gray-500 mt-1">
              Update product prices individually
            </Text>
          </View>
        </View>
      </View>

      {/* SEARCH */}
      <View className="px-4 pt-4">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search product, code or barcode..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-3 py-3 text-gray-900"
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTERS */}
      <View className="flex-row px-4 pt-3 pb-3">
        {/* Category */}
        <TouchableOpacity
          onPress={() => setFilterModal("category")}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-3 mr-2"
        >
          <Text className="text-xs text-gray-400">Category</Text>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm text-gray-800" numberOfLines={1}>
              {categoryFilter === "All"
                ? "All Categories"
                : categoryName(categoryFilter)}
            </Text>

            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>

        {/* Brand */}
        <TouchableOpacity
          onPress={() => setFilterModal("brand")}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-3 ml-2"
        >
          <Text className="text-xs text-gray-400">Brand</Text>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm text-gray-800" numberOfLines={1}>
              {brandFilter === "All" ? "All Brands" : brandName(brandFilter)}
            </Text>

            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View>

      {/* RESULT COUNT / SELECT ALL */}
      <View className="px-4 pb-2 flex-row items-center justify-between">
        <Text className="text-xs text-gray-500">
          {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""}
          {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
        </Text>

        {filteredProducts.length > 0 && (
          <TouchableOpacity
            onPress={toggleSelectAll}
            className="flex-row items-center"
          >
            <Ionicons
              name={allFilteredSelected ? "checkbox" : "square-outline"}
              size={18}
              color={allFilteredSelected ? "#16A34A" : "#9CA3AF"}
            />

            <Text className="text-xs font-semibold text-gray-700 ml-1.5">
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PRODUCT LIST */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.ProductID)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: selectedIds.size > 0 ? 110 : 40,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.ProductID);

          return (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => handleCardPress(item)}
              className={`bg-white rounded-2xl border p-4 mb-3 ${
                isSelected ? "border-green-500 bg-green-50" : "border-gray-100"
              }`}
            >
              {/* Product top */}
              <View className="flex-row justify-between">
                <View className="flex-row flex-1 pr-3">
                  <View className="mr-3 pt-0.5">
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={22}
                      color={isSelected ? "#16A34A" : "#9CA3AF"}
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-gray-900"
                      numberOfLines={2}
                    >
                      {item.ProductName}
                    </Text>

                    <Text className="text-xs text-gray-500 mt-1">
                      Code: {item.ProductCode}
                    </Text>

                    {item.Barcode && (
                      <Text className="text-xs text-gray-400 mt-1">
                        Barcode: {item.Barcode}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Price */}
              <View className="mt-4 pt-3 border-t border-gray-100 flex-row justify-between items-center">
                <View>
                  <Text className="text-xs text-gray-500">
                    Current Sale Price
                  </Text>

                  <Text className="text-xl font-bold text-gray-900 mt-1">
                    ৳{Number(item.SalePrice ?? 0).toFixed(2)}
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Text className="text-xs text-gray-400">Category</Text>

                  <Text className="text-xs font-medium text-gray-700 mt-1">
                    {categoryName(item.CategoryID)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="pricetag-outline" size={45} color="#D1D5DB" />

            <Text className="text-gray-500 mt-3">No products found</Text>

            <Text className="text-gray-400 text-xs mt-1">
              Try changing your search or filters
            </Text>
          </View>
        }
      />

      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-8">
          <TouchableOpacity
            onPress={() => setBulkEditVisible(true)}
            className="bg-green-600 rounded-xl py-3.5 items-center flex-row justify-center"
          >
            <Ionicons name="pricetag" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              Edit Price ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BULK EDIT PRICE MODAL */}
      <BulkEditPriceModal
        visible={bulkEditVisible}
        products={selectedProducts}
        onClose={() => setBulkEditVisible(false)}
        onUpdated={() => {
          setBulkEditVisible(false);
          setSelectedIds(new Set());
          fetchData();
        }}
      />

      {/* FILTER MODAL */}
      <Modal
        visible={filterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModal(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setFilterModal(null)}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-5"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Select {filterModal === "category" ? "Category" : "Brand"}
              </Text>

              <TouchableOpacity onPress={() => setFilterModal(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (filterModal === "category") {
                  setCategoryFilter("All");
                } else {
                  setBrandFilter("All");
                }

                setFilterModal(null);
              }}
              className="py-4 border-b border-gray-100"
            >
              <Text className="text-gray-900 font-medium">
                All {filterModal === "category" ? "Categories" : "Brands"}
              </Text>
            </TouchableOpacity>

            {filterModal === "category"
              ? categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => {
                      setCategoryFilter(category.id);
                      setFilterModal(null);
                    }}
                    className="py-4 border-b border-gray-100"
                  >
                    <Text className="text-gray-800">{category.name}</Text>
                  </TouchableOpacity>
                ))
              : brands.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    onPress={() => {
                      setBrandFilter(brand.id);
                      setFilterModal(null);
                    }}
                    className="py-4 border-b border-gray-100"
                  >
                    <Text className="text-gray-800">{brand.name}</Text>
                  </TouchableOpacity>
                ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ============================================================
   BULK EDIT PRICE MODAL (multiple selected products)
============================================================ */

type BulkEditPriceModalProps = {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onUpdated: () => void;
};

function BulkEditPriceModal({
  visible,
  products,
  onClose,
  onUpdated,
}: BulkEditPriceModalProps) {
  // Map of ProductID -> new price string being edited
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  // Re-seed drafts whenever the modal opens with a new selection
  useEffect(() => {
    if (visible) {
      const seeded: Record<number, string> = {};
      products.forEach((p) => {
        seeded[p.ProductID] = String(Number(p.SalePrice ?? 0));
      });
      setPriceDrafts(seeded);
    }
  }, [visible, products]);

  const handleChangePrice = (productId: number, value: string) => {
    setPriceDrafts((prev) => ({ ...prev, [productId]: value }));
  };

  const getRowInfo = (product: Product) => {
    const oldPrice = Number(product.SalePrice ?? 0);
    const rawValue = priceDrafts[product.ProductID] ?? "";
    const newPrice = Number(rawValue);
    const validNumber =
      rawValue.trim() !== "" && !isNaN(newPrice) && newPrice >= 0;
    const difference = validNumber ? newPrice - oldPrice : 0;
    const percentage =
      validNumber && oldPrice > 0 ? (difference / oldPrice) * 100 : 0;
    const changed = validNumber && newPrice !== oldPrice;

    return {
      oldPrice,
      newPrice,
      rawValue,
      validNumber,
      difference,
      percentage,
      changed,
    };
  };

  const changedCount = products.reduce((count, p) => {
    const { changed } = getRowInfo(p);
    return count + (changed ? 1 : 0);
  }, 0);

  const hasInvalidEntry = products.some((p) => {
    const { rawValue, validNumber } = getRowInfo(p);
    return rawValue.trim() !== "" && !validNumber;
  });

  const handleUpdateAll = async () => {
    if (hasInvalidEntry) {
      Alert.alert(
        "Invalid Price",
        "Please fix the highlighted prices before continuing.",
      );
      return;
    }

    const toUpdate = products.filter((p) => getRowInfo(p).changed);

    if (toUpdate.length === 0) {
      Alert.alert("No Changes", "You haven't changed any prices yet.");
      return;
    }

    try {
      setSaving(true);

      const results = await Promise.allSettled(
        toUpdate.map((p) => {
          const { newPrice } = getRowInfo(p);
          return updateProductPrice(p.ProductID, newPrice);
        }),
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;

      Alert.alert(
        failed === 0 ? "Success" : "Partially Updated",
        failed === 0
          ? `${succeeded} product${succeeded !== 1 ? "s" : ""} updated successfully.`
          : `${succeeded} updated, ${failed} failed. Please try again for the failed items.`,
      );

      onUpdated();
    } catch (error) {
      console.error("Bulk price update error:", error);
      Alert.alert("Error", "Couldn't update product prices.");
    } finally {
      setSaving(false);
    }
  };
    return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-3xl px-5 pt-5"
            style={{ maxHeight: "88%" }}
          >
            {/* HEADER */}
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xl font-bold text-gray-900">
                  Update Prices
                </Text>

                <Text className="text-xs text-gray-500 mt-1">
                  {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                  selected
                  {changedCount > 0 ? ` · ${changedCount} changed` : ""}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} disabled={saving}>
                <Ionicons
                  name="close-circle-outline"
                  size={27}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* PRODUCT LIST */}
            <FlatList
              data={products}
              keyExtractor={(item) => String(item.ProductID)}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
              renderItem={({ item }) => {
                const {
                  oldPrice,
                  rawValue,
                  validNumber,
                  difference,
                  percentage,
                  changed,
                } = getRowInfo(item);
                const isIncrease = difference > 0;
                const isDecrease = difference < 0;
                const showError = rawValue.trim() !== "" && !validNumber;

                return (
                  <View className="border border-gray-200 rounded-2xl p-4 mb-3">
                    <Text
                      className="text-sm font-semibold text-gray-900"
                      numberOfLines={2}
                    >
                      {item.ProductName}
                    </Text>

                    <Text className="text-xs text-gray-500 mt-1 mb-3">
                      {item.ProductCode}
                    </Text>

                    <View className="flex-row items-center">
                      {/* Old price */}
                      <View className="flex-1 mr-2">
                        <Text className="text-xs text-gray-400 mb-1">
                          Old Price
                        </Text>

                        <View className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <Text className="text-sm font-semibold text-gray-700">
                            ৳{oldPrice.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#9CA3AF"
                        style={{ marginHorizontal: 4, marginTop: 14 }}
                      />

                      {/* New price */}
                      <View className="flex-1 ml-2">
                        <Text className="text-xs text-gray-400 mb-1">
                          New Price
                        </Text>

                        <View
                          className={`flex-row items-center border rounded-xl px-3 ${
                            showError ? "border-red-400" : "border-gray-200"
                          }`}
                        >
                          <Text className="text-sm text-gray-500 mr-1">৳</Text>

                          <TextInput
                            value={rawValue}
                            onChangeText={(value) =>
                              handleChangePrice(item.ProductID, value)
                            }
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 py-2.5 text-sm text-gray-900"
                            editable={!saving}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Diff row */}
                    {changed && (
                      <View className="flex-row justify-end mt-2">
                        <Text
                          className={`text-xs font-bold ${
                            isIncrease
                              ? "text-green-600"
                              : isDecrease
                                ? "text-red-600"
                                : "text-gray-500"
                          }`}
                        >
                          {difference >= 0 ? "+" : ""}৳{difference.toFixed(2)} (
                          {percentage >= 0 ? "+" : ""}
                          {percentage.toFixed(2)}%)
                        </Text>
                      </View>
                    )}

                    {showError && (
                      <Text className="text-xs text-red-500 mt-2">
                        Enter a valid price
                      </Text>
                    )}
                  </View>
                );
              }}
            />

            {/* BUTTONS */}
            <View className="flex-row pb-8 pt-2">
              <TouchableOpacity
                onPress={onClose}
                disabled={saving}
                className="flex-1 border border-gray-200 rounded-xl py-3.5 mr-2 items-center"
              >
                <Text className="text-gray-600 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateAll}
                disabled={saving || changedCount === 0}
                className={`flex-1 rounded-xl py-3.5 ml-2 items-center ${
                  saving || changedCount === 0
                    ? "bg-green-300"
                    : "bg-green-600"
                }`}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">
                    Update {changedCount > 0 ? `${changedCount} ` : ""}Price
                    {changedCount !== 1 ? "s" : ""}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

}