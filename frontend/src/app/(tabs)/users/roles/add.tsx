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
import PermissionTree from "../../../../components/PermissionTree";
import { createRole } from "../../../../services/roleApi";
import { getPermissionTree, PermissionNode, Lookup } from "../../../../services/userApi";

const STATUS_OPTIONS: Lookup[] = [
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

export default function AddRoleScreen() {
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<number>(1);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const tree = await getPermissionTree();
        setPermissionTree(tree);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load permissions.");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!roleName.trim()) {
      Alert.alert("Missing field", "Role Name is required.");
      return;
    }

    try {
      setSaving(true);
      await createRole({
        RoleName: roleName,
        Description: description || undefined,
        Status: STATUS_OPTIONS.find((s) => s.id === statusId)?.name ?? "Active",
        PermissionIDs: Array.from(selectedPermissions),
      });

      Alert.alert("Success", "Role created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.detail || "Couldn't create role.";
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
          <Text className="text-lg font-semibold text-gray-900 ml-3">Add Role</Text>
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
              <Text className="text-white text-sm font-medium ml-1.5">Save Role</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <Text className="text-base font-semibold text-gray-900 mb-3">Role Information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Role Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={roleName}
            onChangeText={setRoleName}
            placeholder="Enter role name"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter role description"
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

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-2">Permissions</Text>

        <View className="border border-gray-200 rounded-xl p-3 bg-white mb-6">
          <PermissionTree
            tree={permissionTree}
            selected={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </View>
      </ScrollView>
    </View>
  );
}