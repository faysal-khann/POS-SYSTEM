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
import CompanyRow from "../../../../components/CompanyRow";
import SideMenu from "../../../../components/SideMenu";
import { getCompanies, deleteCompany, CompanyListItem } from "../../../../services/companyApi";

export default function CompanyInfoListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setError(null);
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load company info. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [fetchCompanies]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Company", "Are you sure you want to delete this company?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCompany(id);
            setCompanies((prev) => prev.filter((c) => c.CompanyID !== id));
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete company.");
          }
        },
      },
    ]);
  };

  const filteredCompanies = companies.filter((c) =>
    c.CompanyName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Company Info List</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings/company-info/add")}>
          <View className="bg-[#3B82F6] rounded-2xl p-2 flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium px-2">Add Company Info</Text>
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
            placeholder="Search company info..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-sm text-gray-800"
          />
        </View>
      </View>

      <View className="px-4 mb-2">
        <Text className="text-sm text-gray-500">
          Showing 1 to {filteredCompanies.length} of {filteredCompanies.length} entries
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchCompanies} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item) => String(item.CompanyID)}
          renderItem={({ item }) => <CompanyRow company={item} onDeleted={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No company info found</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}