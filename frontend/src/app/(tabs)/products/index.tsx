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
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ProductCard from "../../../components/ProductCard";
import SideMenu from "../../../components/SideMenu";
import {
  getProducts,
  Product,
  deleteProduct,
} from "../../../services/productApi";
import { usePagination } from "../../../hooks/usePagination";
import PaginationBar from "../../../components/PaginationBar";
import Dropdown from "../../../components/Dropdown";

// Sentinel ids used for the "All ..." option in each dropdown
const ALL_CATEGORY_ID = -1;
const ALL_BRAND_ID = -1;

const STATUS_ALL = 0;
const STATUS_ACTIVE = 1;
const STATUS_INACTIVE = 2;

const statusIdToValue: Record<number, "All" | "Active" | "Inactive"> = {
  [STATUS_ALL]: "All",
  [STATUS_ACTIVE]: "Active",
  [STATUS_INACTIVE]: "Inactive",
};

export default function ProductListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
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

  const [statusFilterId, setStatusFilterId] = useState<number>(STATUS_ALL);

  const [categoryFilterId, setCategoryFilterId] =
    useState<number>(ALL_CATEGORY_ID);

  const [brandFilterId, setBrandFilterId] = useState<number>(ALL_BRAND_ID);

  const [showFilter, setShowFilter] = useState(false);

  const handleDelete = async (id: number) => {
  Alert.alert(
    "Delete Product",
    "Are you sure you want to delete this product?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(id);

            setProducts((prev) =>
              prev.filter((p) => p.ProductID !== id)
            );
          } catch (err) {
            console.error("Delete product error:", err);
            setError("Failed to delete product.");
          }
        },
      },
    ]
  );
};

  // ============================================
  // CATEGORIES & BRANDS (unique id + name pairs from loaded products)
  // ============================================

  const categoryDropdownOptions = [
    { id: ALL_CATEGORY_ID, name: "All Categories" },
    ...Array.from(
      new Map(
        products
          .filter((p) => p.CategoryID != null)
          .map((p) => [
            p.CategoryID,
            { id: p.CategoryID, name: p.categoryName ?? `#${p.CategoryID}` },
          ]),
      ).values(),
    ),
  ];

  const brandDropdownOptions = [
    { id: ALL_BRAND_ID, name: "All Brands" },
    ...Array.from(
      new Map(
        products
          .filter((p) => p.BrandID != null)
          .map((p) => [
            p.BrandID,
            { id: p.BrandID as number, name: p.brandName ?? `#${p.BrandID}` },
          ]),
      ).values(),
    ),
  ];

  const statusDropdownOptions = [
    { id: STATUS_ALL, name: "All Status" },
    { id: STATUS_ACTIVE, name: "Active" },
    { id: STATUS_INACTIVE, name: "Inactive" },
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load products. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

useFocusEffect(
  useCallback(() => {
    fetchProducts();
  }, [fetchProducts]) // ✅
);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // ============================================
  // FILTER PRODUCTS
  // ============================================

  const statusFilterValue = statusIdToValue[statusFilterId];

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      product.ProductName?.toLowerCase().includes(searchText) ||
      product.ProductCode?.toLowerCase().includes(searchText) ||
      product.categoryName?.toLowerCase().includes(searchText) ||
      product.brandName?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilterValue === "All" || product.Status === statusFilterValue;

    const matchesCategory =
      categoryFilterId === ALL_CATEGORY_ID ||
      product.CategoryID === categoryFilterId;

    const matchesBrand =
      brandFilterId === ALL_BRAND_ID || product.BrandID === brandFilterId;

    return matchesSearch && matchesStatus && matchesCategory && matchesBrand;
  });

  // ============================================
  // SORT
  // ============================================

  const displayedProducts = sortAZ
    ? [...filteredProducts].sort((a, b) =>
        a.ProductName.localeCompare(b.ProductName),
      )
    : filteredProducts;

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(displayedProducts, 10, `${search}-${statusFilterId}`);

  const hasActiveFilters =
    statusFilterId !== STATUS_ALL ||
    categoryFilterId !== ALL_CATEGORY_ID ||
    brandFilterId !== ALL_BRAND_ID;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Product List
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push("/(tabs)/products/add")}>
            <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row">
              <Ionicons name="add" size={16} color="white" />

              <Text className="text-white font-medium px-2">Add Product</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/products/scan")}
            className="bg-gray-100 px-3 py-2 rounded-lg mr-3"
          >
            <Ionicons name="barcode-outline" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="flex-row items-center px-4 mt-4 mb-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, code or barcode..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className={`bg-white border rounded-xl p-2.5 ${
            hasActiveFilters ? "border-blue-500" : "border-gray-200"
          }`}
        >
          <Ionicons
            name="filter"
            size={16}
            color={hasActiveFilters ? "#3B82F6" : "#374151"}
          />
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between items-center px-4 mb-2">
        <Text className="text-sm text-gray-500">
          {displayedProducts.length} products
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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity
            onPress={fetchProducts}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => item.ProductID.toString()}
          renderItem={({ item }) => (
            <ProductCard product={item} onDeleted={handleDelete} />
          )}

          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No products found
            </Text>
          }

          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
        />
      )}

      {!loading && !error && displayedProducts.length > 0 && (
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

      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-6"
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
                  Filter Products
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* CATEGORY */}
              <Dropdown
                label="Category"
                placeholder="Select category"
                options={categoryDropdownOptions}
                selectedId={categoryFilterId}
                onSelect={setCategoryFilterId}
              />

              {/* BRAND */}
              <Dropdown
                label="Brand"
                placeholder="Select brand"
                options={brandDropdownOptions}
                selectedId={brandFilterId}
                onSelect={setBrandFilterId}
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

              {/* CLEAR */}
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilterId(STATUS_ALL);
                    setCategoryFilterId(ALL_CATEGORY_ID);
                    setBrandFilterId(ALL_BRAND_ID);
                  }}
                  className="items-center mt-3"
                >
                  <Text className="text-gray-500 text-sm">Clear Filter</Text>
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