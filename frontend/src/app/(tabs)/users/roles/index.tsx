import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RoleRow from "../../../../components/RoleRow";
import SideMenu from "../../../../components/SideMenu";
import PaginationBar from "../../../../components/PaginationBar";
import { usePagination } from "../../../../hooks/usePagination";
import { getRoles, deleteRole, RoleListItem } from "../../../../services/roleApi";

export default function RolesListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setError(null);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load roles. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRoles();
    }, [fetchRoles]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoles();
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Role", "Are you sure you want to delete this role?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRole(id);
            setRoles((prev) => prev.filter((r) => r.RoleID !== id));
          } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.detail || "Failed to delete role.";
            Alert.alert("Error", message);
          }
        },
      },
    ]);
  };

  const filteredRoles = roles.filter((r) =>
    r.RoleName.toLowerCase().includes(search.toLowerCase()),
  );

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(filteredRoles, 10, search);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Roles</Text>
        </View>
        <TouchableOpacity 
        onPress={() => router.push("./roles/add")}
        >
          <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium px-2">Add Role</Text>
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
            placeholder="Search roles..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
      </View>

      <View className="px-4 mb-2">
        <Text className="text-sm text-gray-500">{filteredRoles.length} roles</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchRoles} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.RoleID)}
          renderItem={({ item }) => <RoleRow role={item} onDeleted={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No roles found</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {!loading && !error && filteredRoles.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}