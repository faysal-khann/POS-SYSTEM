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
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StockCard from "../../../../components/StockCard";
import SideMenu from "../../../../components/SideMenu";
import Dropdown from "../../../../components/Dropdown";
import PaginationBar from "../../../../components/PaginationBar";
import { usePagination } from "../../../../hooks/usePagination";
import { getStock, StockListItem } from "../../../../services/stockApi";

const ALL_CATEGORY_ID = -1;
const ALL_BRAND_ID = -1;
const ALL_BRANCH_ID = -1;

export default function CurrentStockScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StockListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortAZ, setSortAZ] = useState(false);
  const [categoryFilterId, setCategoryFilterId] =
    useState<number>(ALL_CATEGORY_ID);
  const [brandFilterId, setBrandFilterId] = useState<number>(ALL_BRAND_ID);
  const [branchFilterId, setBranchFilterId] = useState<number>(ALL_BRANCH_ID);
  const [showFilter, setShowFilter] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fetchStock = useCallback(async () => {
    try {
      setError(null);
      const data = await getStock();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load stock. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStock();
    }, [fetchStock]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStock();
  };

  // ============================================
  // FILTER DROPDOWN OPTIONS (derived from loaded data)
  // ============================================

  const categoryDropdownOptions = [
    { id: ALL_CATEGORY_ID, name: "All Categories" },
    ...Array.from(
      new Map(
        items
          .filter((i) => i.CategoryID != null)
          .map((i) => [
            i.CategoryID,
            {
              id: i.CategoryID as number,
              name: i.CategoryName ?? `#${i.CategoryID}`,
            },
          ]),
      ).values(),
    ),
  ];

  const brandDropdownOptions = [
    { id: ALL_BRAND_ID, name: "All Brands" },
    ...Array.from(
      new Map(
        items
          .filter((i) => i.BrandID != null)
          .map((i) => [
            i.BrandID,
            { id: i.BrandID as number, name: i.BrandName ?? `#${i.BrandID}` },
          ]),
      ).values(),
    ),
  ];

  const branchDropdownOptions = [
    { id: ALL_BRANCH_ID, name: "All Warehouses" },
    ...Array.from(
      new Map(
        items.map((i) => [i.BranchID, { id: i.BranchID, name: i.BranchName }]),
      ).values(),
    ),
  ];

  // ============================================
  // FILTER + SEARCH
  // ============================================

  const filteredItems = items.filter((item) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      item.ProductName?.toLowerCase().includes(searchText) ||
      item.ProductCode?.toLowerCase().includes(searchText) ||
      item.CategoryName?.toLowerCase().includes(searchText) ||
      item.BrandName?.toLowerCase().includes(searchText);

    const matchesCategory =
      categoryFilterId === ALL_CATEGORY_ID ||
      item.CategoryID === categoryFilterId;

    const matchesBrand =
      brandFilterId === ALL_BRAND_ID || item.BrandID === brandFilterId;

    const matchesBranch =
      branchFilterId === ALL_BRANCH_ID || item.BranchID === branchFilterId;

    return matchesSearch && matchesCategory && matchesBrand && matchesBranch;
  });

  const displayedItems = sortAZ
    ? [...filteredItems].sort((a, b) =>
        a.ProductName.localeCompare(b.ProductName),
      )
    : filteredItems;

  const handleExportPDF = async () => {
    const rowsHtml = displayedItems
      .map(
        (item) => `
        <tr>
          <td>${item.ProductName}</td>
          <td>${item.ProductCode ?? "-"}</td>
          <td>${item.CategoryName ?? "-"}</td>
          <td>${item.BrandName ?? "-"}</td>
          <td>${item.BranchName ?? "-"}</td>
         <td style="text-align:right">${item.CurrentStock ?? 0}</td>
        </tr>`,
      )
      .join("");

    const filterSummary =
      [
        categoryFilterId !== ALL_CATEGORY_ID &&
          categoryDropdownOptions.find((c) => c.id === categoryFilterId)?.name,
        brandFilterId !== ALL_BRAND_ID &&
          brandDropdownOptions.find((b) => b.id === brandFilterId)?.name,
        branchFilterId !== ALL_BRANCH_ID &&
          branchDropdownOptions.find((b) => b.id === branchFilterId)?.name,
      ]
        .filter(Boolean)
        .join(", ") || "None";

    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { font-size: 12px; color: #6B7280; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #E5E7EB; padding: 8px; font-size: 12px; }
          th { background: #F3F4F6; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Current Stock Report</h1>
        <div class="meta">
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Filters:</strong> ${filterSummary}</div>
          <div><strong>Total Products:</strong> ${displayedItems.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Code</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Warehouse</th>
              <th style="text-align:right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

    try {
      setExporting(true);
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Stock Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        console.error("Sharing not available on this device");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(
    displayedItems,
    10,
    `${search}-${categoryFilterId}-${brandFilterId}-${branchFilterId}`,
  );

  const hasActiveFilters =
    categoryFilterId !== ALL_CATEGORY_ID ||
    brandFilterId !== ALL_BRAND_ID ||
    branchFilterId !== ALL_BRANCH_ID;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
  <View className="flex-row items-center">
    <TouchableOpacity onPress={() => setMenuVisible(true)}>
      <Ionicons name="menu" size={24} color="#111827" />
    </TouchableOpacity>
    <Text className="text-lg font-semibold text-gray-900 ml-3">
      Current Stock
    </Text>
  </View>

  <TouchableOpacity
    onPress={handleExportPDF}
    disabled={exporting || loading || displayedItems.length === 0}
    className="bg-gray-100 px-3 py-2 rounded-lg flex-row items-center"
  >
    {exporting ? (
      <ActivityIndicator size="small" color="#374151" />
    ) : (
      <>
        <Ionicons name="download-outline" size={14} color="#374151" />
        <Text className="text-gray-700 text-sm font-medium ml-1.5">
          Export
        </Text>
      </>
    )}
  </TouchableOpacity>
</View>

      {/* Search */}
      <View className="flex-row items-center px-4 mt-4 mb-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search product..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className={`bg-white border rounded-xl p-2.5 ml-2 ${
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
          {displayedItems.length} products
        </Text>
        <TouchableOpacity
          onPress={() => setSortAZ((prev) => !prev)}
          className="flex-row items-center"
        >
          <Text
            className={`text-sm mr-1 ${sortAZ ? "text-blue-500 font-semibold" : "text-gray-500"}`}
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
            onPress={fetchStock}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.ProductStockID)}
          renderItem={({ item }) => <StockCard item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No stock records found
            </Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {!loading && !error && displayedItems.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
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
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <Ionicons name="filter" size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Filter Stock
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Dropdown
                label="Category"
                placeholder="Select category"
                options={categoryDropdownOptions}
                selectedId={categoryFilterId}
                onSelect={setCategoryFilterId}
              />
              <Dropdown
                label="Brand"
                placeholder="Select brand"
                options={brandDropdownOptions}
                selectedId={brandFilterId}
                onSelect={setBrandFilterId}
              />
              <Dropdown
                label="Warehouse"
                placeholder="Select warehouse"
                options={branchDropdownOptions}
                selectedId={branchFilterId}
                onSelect={setBranchFilterId}
              />

              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>

              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={() => {
                    setCategoryFilterId(ALL_CATEGORY_ID);
                    setBrandFilterId(ALL_BRAND_ID);
                    setBranchFilterId(ALL_BRANCH_ID);
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
