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
import UserRow from "../../../components/UserRow";
import SideMenu from "../../../components/SideMenu";
import Dropdown from "../../../components/Dropdown";
import PaginationBar from "../../../components/PaginationBar";
import { usePagination } from "../../../hooks/usePagination";
import {
  getUsers,
  getRoles,
  deleteUser,
  UserListItem,
  Lookup,
} from "../../../services/userApi";

const ALL_ROLE_ID = -1;
const STATUS_ALL = 0;
const STATUS_ACTIVE = 1;
const STATUS_INACTIVE = 2;

const statusIdToValue: Record<number, "All" | "Active" | "Inactive"> = {
  [STATUS_ALL]: "All",
  [STATUS_ACTIVE]: "Active",
  [STATUS_INACTIVE]: "Inactive",
};

export default function UsersListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roleFilterId, setRoleFilterId] = useState<number>(ALL_ROLE_ID);
  const [statusFilterId, setStatusFilterId] = useState<number>(STATUS_ALL);
  const [showFilter, setShowFilter] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [u, r] = await Promise.all([getUsers(), getRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      console.error(err);
      setError("Couldn't load users. Check your connection.");
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
    Alert.alert("Delete User", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUser(id);
            setUsers((prev) => prev.filter((u) => u.UserID !== id));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete user.");
          }
        },
      },
    ]);
  };

  const roleDropdownOptions = [{ id: ALL_ROLE_ID, name: "All Roles" }, ...roles];
  const statusDropdownOptions = [
    { id: STATUS_ALL, name: "All Status" },
    { id: STATUS_ACTIVE, name: "Active" },
    { id: STATUS_INACTIVE, name: "Inactive" },
  ];

  const statusFilterValue = statusIdToValue[statusFilterId];

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();
    const matchesSearch =
      user.FullName.toLowerCase().includes(searchText) ||
      user.Username.toLowerCase().includes(searchText) ||
      user.Email.toLowerCase().includes(searchText);

    const matchesRole =
      roleFilterId === ALL_ROLE_ID || user.RoleName === roles.find((r) => r.id === roleFilterId)?.name;

    const matchesStatus = statusFilterValue === "All" || user.Status === statusFilterValue;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(filteredUsers, 10, `${search}-${roleFilterId}-${statusFilterId}`);

  const hasActiveFilters = roleFilterId !== ALL_ROLE_ID || statusFilterId !== STATUS_ALL;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Users</Text>
        </View>
        <TouchableOpacity 
        onPress={() => router.push("/(tabs)/users/add")}
        >
          <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium px-2">Add User</Text>
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
            placeholder="Search by name, email or username..."
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
        <Text className="text-sm text-gray-500">{filteredUsers.length} users</Text>
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
          keyExtractor={(item) => String(item.UserID)}
          renderItem={({ item }) => <UserRow user={item} onDeleted={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No users found</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {!loading && !error && filteredUsers.length > 0 && (
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
                <Text className="text-lg font-semibold text-gray-900 ml-2">Filter Users</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Dropdown
                label="Role"
                placeholder="Select role"
                options={roleDropdownOptions}
                selectedId={roleFilterId}
                onSelect={setRoleFilterId}
              />
              <Dropdown
                label="Status"
                placeholder="Select status"
                options={statusDropdownOptions}
                selectedId={statusFilterId}
                onSelect={setStatusFilterId}
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
                    setRoleFilterId(ALL_ROLE_ID);
                    setStatusFilterId(STATUS_ALL);
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