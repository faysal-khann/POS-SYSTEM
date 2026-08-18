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
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import UnitCard from "../../../../components/UnitCard";
import {
  getUnitList,
  createUnit,
  updateUnit,
  Unit,
  UnitInput,
} from "../../../../services/unitApi";

const emptyForm: UnitInput = {
  UnitName: "",
  ShortName: "",
  Description: "",
  Status: "Active",
};

export default function UnitsScreen() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UnitInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUnits = useCallback(async () => {
    try {
      setError(null);
      const data = await getUnitList();
      setUnits(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load units.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnits();
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingId(unit.UnitID);
    setForm({
      UnitName: unit.UnitName,
      ShortName: unit.ShortName ?? "",
      Description: unit.Description ?? "",
      Status: unit.Status,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.UnitName.trim()) {
      Alert.alert("Missing field", "Unit Name is required.");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        const updated = await updateUnit(editingId, form);
        setUnits((prev) => prev.map((u) => (u.UnitID === editingId ? updated : u)));
      } else {
        const created = await createUnit(form);
        setUnits((prev) => [...prev, created]);
      }
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't save unit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Units</Text>
        </View>
        <TouchableOpacity
          onPress={openAddModal}
          className="bg-blue-600 px-3 py-2 rounded-lg flex-row items-center"
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-medium ml-1">Add Unit</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-4 mb-2">
        <Text className="text-sm text-gray-500">
          Showing {units.length} of {units.length} entries
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={fetchUnits} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={(item) => item.UnitID.toString()}
          renderItem={({ item, index }) => (
            <UnitCard
              unit={item}
              index={index + 1}
              onEdit={openEditModal}
              onDeleted={(id) => setUnits((prev) => prev.filter((u) => u.UnitID !== id))}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">No units found</Text>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center px-6"
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-full max-w-sm p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Unit" : "Add Unit"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Unit Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={form.UnitName}
                onChangeText={(v) => setForm((p) => ({ ...p, UnitName: v }))}
                placeholder="Enter unit name"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Short Name</Text>
              <TextInput
                value={form.ShortName}
                onChangeText={(v) => setForm((p) => ({ ...p, ShortName: v }))}
                placeholder="e.g. Pcs, Kg, Ltr"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
              <TextInput
                value={form.Description}
                onChangeText={(v) => setForm((p) => ({ ...p, Description: v }))}
                placeholder="Enter description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-sm font-medium text-gray-700">Status</Text>
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-600 mr-2">
                  {form.Status === "Active" ? "Active" : "Inactive"}
                </Text>
                <Switch
                  value={form.Status === "Active"}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, Status: v ? "Active" : "Inactive" }))
                  }
                  trackColor={{ false: "#D1D5DB", true: "#22C55E" }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">
                  {editingId ? "Update Unit" : "Save Unit"}
                </Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}