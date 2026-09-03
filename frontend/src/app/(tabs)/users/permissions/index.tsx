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
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PermissionRow from "../../../../components/PermissionRow";
import SideMenu from "../../../../components/SideMenu";
import Dropdown from "../../../../components/Dropdown";
import PaginationBar from "../../../../components/PaginationBar";
import { usePagination } from "../../../../hooks/usePagination";
import {
  getPermissions,
  getModules,
  deletePermission,
  PermissionListItem,
  Lookup,
} from "../../../../services/permissionApi";

const ALL_MODULE_ID = -1;

export default function PermissionsListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
  const [modules, setModules] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [moduleFilterId, setModuleFilterId] = useState<number>(ALL_MODULE_ID);
  const [showFilter, setShowFilter] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [p, m] = await Promise.all([getPermissions(), getModules()]);
      setPermissions(p);
      setModules(m);
    } catch (err) {
      console.error(err);
      setError("Couldn't load permissions. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Permission", "Are you sure you want to delete this permission?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePermission(id);
            setPermissions((prev) => prev.filter((p) => p.PermissionID !== id));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete permission.");
          }
        },
      },
    ]);
  };

  const moduleDropdownOptions = [{ id: ALL_MODULE_ID, name: "All Modules" }, ...modules];

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch = p.PermissionName.toLowerCase().includes(search.toLowerCase());
    const matchesModule =
      moduleFilterId === ALL_MODULE_ID ||
      p.Module === modules.find((m) => m.id === moduleFilterId)?.name;
    return matchesSearch && matchesModule;
  });

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(filteredPermissions, 6, `${search}-${moduleFilterId}`);

  const hasActiveFilters = moduleFilterId !== ALL_MODULE_ID;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Permissions</Text>
        </View>
        <TouchableOpacity 
        onPress={() => router.push("/users/permissions/add")}
            >
          <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium px-2">Add Permission</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="flex-row items-center px-4 mt-4 mb-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search permissions..."
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
        <Text className="text-sm text-gray-500">{filteredPermissions.length} permissions</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchData} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.PermissionID)}
          renderItem={({ item }) => <PermissionRow permission={item} onDeleted={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No permissions found</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {!loading && !error && filteredPermissions.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-6" onPress={() => setShowFilter(false)}>
          <Pressable className="bg-white rounded-2xl w-full max-w-sm p-5" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <Ionicons name="filter" size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Filter Permissions</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Dropdown
                label="Module"
                placeholder="Select module"
                options={moduleDropdownOptions}
                selectedId={moduleFilterId}
                onSelect={setModuleFilterId}
              />

              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>

              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={() => setModuleFilterId(ALL_MODULE_ID)}
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