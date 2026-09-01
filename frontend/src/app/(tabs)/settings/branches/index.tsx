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
import BranchRow from "../../../../components/BranchRow";
import SideMenu from "../../../../components/SideMenu";
import { getBranches, deleteBranch, BranchListItem } from "../../../../services/branchApi";

export default function BranchListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      setError(null);
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load branches. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBranches();
    }, [fetchBranches]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBranches();
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Branch", "Are you sure you want to delete this branch?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBranch(id);
            setBranches((prev) => prev.filter((b) => b.BranchID !== id));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete branch.");
          }
        },
      },
    ]);
  };

  const filteredBranches = branches.filter((b) =>
    b.BranchName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Branch / Outlet List</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings/branches/add")}>
          <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium px-2">Add Branch</Text>
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
            placeholder="Search branch..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
      </View>

      <View className="px-4 mb-2">
        <Text className="text-sm text-gray-500">
          Showing 1 to {filteredBranches.length} of {filteredBranches.length} entries
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchBranches} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBranches}
          keyExtractor={(item) => String(item.BranchID)}
          renderItem={({ item }) => <BranchRow branch={item} onDeleted={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No branches found</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}