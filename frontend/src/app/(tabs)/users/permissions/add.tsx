import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Dropdown from "../../../../components/Dropdown";
import { createModule } from "../../../../services/permissionApi";
import {
  createPermission,
  getModules,
  Lookup,
} from "../../../../services/permissionApi";

const STATUS_OPTIONS: Lookup[] = [
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

export default function AddPermissionScreen() {
  const [modules, setModules] = useState<Lookup[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  const [permissionName, setPermissionName] = useState("");
  const [moduleId, setModuleId] = useState<number | undefined>();
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<number>(1);

  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [savingModule, setSavingModule] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const m = await getModules();
        setModules(m);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load modules.");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const handleAddModule = async () => {
    if (!newModuleName.trim()) {
      Alert.alert("Missing field", "Module Name is required.");
      return;
    }

    try {
      setSavingModule(true);
      const created = await createModule(newModuleName);
      setModules((prev) => [...prev, created]);
      setModuleId(created.id);
      setShowAddModule(false);
      setNewModuleName("");
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.detail || "Couldn't create module.";
      Alert.alert("Error", message);
    } finally {
      setSavingModule(false);
    }
  };

  const handleSave = async () => {
    if (!permissionName.trim()) {
      Alert.alert("Missing field", "Permission Name is required.");
      return;
    }
    if (!moduleId) {
      Alert.alert("Missing field", "Please select a Module.");
      return;
    }

    try {
      setSaving(true);
      await createPermission({
        PermissionName: permissionName,
        ParentPermissionID: moduleId,
        Description: description || undefined,
        Status: STATUS_OPTIONS.find((s) => s.id === statusId)?.name ?? "Active",
      });

      Alert.alert("Success", "Permission created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.detail || "Couldn't create permission.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingLookups) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Add Permission
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-medium ml-1.5">
                Save
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Permission Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Permission Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={permissionName}
            onChangeText={setPermissionName}
            placeholder="Enter permission name"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="flex-row items-start">
          <View className="flex-1 mr-2">
            <Dropdown
              label="Module"
              placeholder="Select module"
              required
              options={modules}
              selectedId={moduleId}
              onSelect={setModuleId}
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowAddModule(true)}
            className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mt-[24px]"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter permission description"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <Dropdown
          label="Status"
          placeholder="Select status"
          required
          options={STATUS_OPTIONS}
          selectedId={statusId}
          onSelect={setStatusId}
        />
      </ScrollView>

      {showAddModule && (
  <View className="absolute inset-0 bg-black/40 justify-center items-center px-6">
    <View className="bg-white rounded-2xl w-full max-w-sm p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">Add Module</Text>
        <TouchableOpacity onPress={() => setShowAddModule(false)}>
          <Ionicons name="close" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View className="mb-5">
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Module Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={newModuleName}
          onChangeText={setNewModuleName}
          placeholder="Enter module name"
          placeholderTextColor="#9CA3AF"
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
        />
      </View>

      <TouchableOpacity
        onPress={handleAddModule}
        disabled={savingModule}
        className="bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
      >
        {savingModule ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Save Module</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
)}
    </View>
  );
}
