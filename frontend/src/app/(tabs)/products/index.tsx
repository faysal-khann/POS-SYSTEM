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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ProductCard from "../../../components/ProductCard";
import SideMenu from "../../../components/SideMenu";
import {
  getProducts,
  Product,
  deleteProduct,
} from "../../../services/productApi";
import PaginationBar from "../../../components/PaginationBar";

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

  type StatusFilter = "All" | "Active" | "Inactive";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [brandFilter, setBrandFilter] = useState<string>("All");

  const [showFilter, setShowFilter] = useState(false);

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id);

      setProducts((prev) => prev.filter((p) => p.ProductID !== id));
    } catch (err) {
      console.error("Delete product error:", err);
      setError("Failed to delete product.");
    }
  };

  // ============================================
  // CATEGORIES & BRANDS
  // ============================================

  const categories = [
    "All",
    ...Array.from(
      new Set(products.map((product) => product.categoryName).filter(Boolean)),
    ),
  ];

  const brands = [
    "All",
    ...Array.from(
      new Set(products.map((product) => product.brandName).filter(Boolean)),
    ),
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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // ============================================
  // FILTER PRODUCTS
  // ============================================

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      product.ProductName?.toLowerCase().includes(searchText) ||
      product.ProductCode?.toLowerCase().includes(searchText) ||
      product.categoryName?.toLowerCase().includes(searchText) ||
      product.brandName?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || product.Status === statusFilter;

    const matchesCategory =
      categoryFilter === "All" || product.categoryName === categoryFilter;

    const matchesBrand =
      brandFilter === "All" || product.brandName === brandFilter;

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

  const categoryOptions = categories.filter(
    (category): category is string => !!category,
  );

  const brandOptions = brands.filter((brand): brand is string => !!brand);
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
         
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/products/add")}
          >
            <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row">
              <Ionicons name="add" size={16} color="white" />

              <Text className="text-white font-medium px-2">Add Product</Text>
            </View>
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
            statusFilter !== "All" ||
            categoryFilter !== "All" ||
            brandFilter !== "All"
              ? "border-blue-500"
              : "border-gray-200"
          }`}
        >
          <Ionicons
            name="filter"
            size={16}
            color={
              statusFilter !== "All" ||
              categoryFilter !== "All" ||
              brandFilter !== "All"
                ? "#3B82F6"
                : "#374151"
            }
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
          data={displayedProducts}
          keyExtractor={(item) => item.ProductID.toString()}
          renderItem={({ item }) => (
            <ProductCard product={item} onDeleted={handleDelete} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No products found
            </Text>
          }
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
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Category
              </Text>

              <View className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                <Picker
                  selectedValue={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                >
                  {categories.map((category) => (
                    <Picker.Item
                      key={category ?? "All"}
                      label={
                        category === "All"
                          ? "All Categories"
                          : (category ?? "Unknown")
                      }
                      value={category ?? "All"}
                      color="#111827"
                    />
                  ))}
                </Picker>
              </View>

              {/* BRAND */}
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Brand
              </Text>

              <View className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                <Picker
                  selectedValue={brandFilter}
                  onValueChange={(value) => setBrandFilter(value)}
                >
                  {brands.map((brand) => (
                    <Picker.Item
                      key={brand ?? "All"}
                      label={
                        brand === "All" ? "All Brands" : (brand ?? "Unknown")
                      }
                      value={brand ?? "All"}
                      color="#111827"
                    />
                  ))}
                </Picker>
              </View>

              {/* STATUS */}
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Status
              </Text>

              <View className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                <Picker
                  selectedValue={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <Picker.Item label="All Status" value="All" color="#111827" />
                  <Picker.Item label="Active" value="Active" color="#111827" />
                  <Picker.Item
                    label="Inactive"
                    value="Inactive"
                    color="#111827"
                  />
                </Picker>
              </View>

              {/* APPLY */}
              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>

              {/* CLEAR */}
              {(statusFilter !== "All" ||
                categoryFilter !== "All" ||
                brandFilter !== "All") && (
                <TouchableOpacity
                  onPress={() => {
                    setStatusFilter("All");
                    setCategoryFilter("All");
                    setBrandFilter("All");
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
