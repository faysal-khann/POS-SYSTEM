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
import { router, useLocalSearchParams } from "expo-router";
import Dropdown from "../../../../components/Dropdown";
import { getBranchDetail, updateBranch } from "../../../../services/branchApi";
import { Lookup } from "@/services/userApi";

const STATUS_OPTIONS: Lookup[] = [
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

export default function EditBranchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const branchId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [statusId, setStatusId] = useState<number>(1);

  useEffect(() => {
    (async () => {
      try {
        const detail = await getBranchDetail(branchId);
        setBranchCode(detail.BranchCode ?? "—");
        setBranchName(detail.BranchName);
        setManagerName(detail.ManagerName ?? "");
        setPhone(detail.Phone ?? "");
        setEmail(detail.Email ?? "");
        setAddress(detail.Address ?? "");
        setStatusId(detail.Status === "Inactive" ? 2 : 1);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load branch details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  const handleSave = async () => {
    if (!branchName.trim()) {
      Alert.alert("Missing field", "Branch / Outlet Name is required.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Missing field", "Phone is required.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Missing field", "Address is required.");
      return;
    }

    try {
      setSaving(true);
      await updateBranch(branchId, {
        BranchName: branchName,
        ManagerName: managerName || undefined,
        Phone: phone,
        Email: email || undefined,
        Address: address,
        Status: STATUS_OPTIONS.find((s) => s.id === statusId)?.name ?? "Active",
      });

      Alert.alert("Success", "Branch updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.detail || "Couldn't update branch.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            Add / Edit Branch / Outlet
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
              <Text className="text-white text-sm font-medium ml-1.5">Save Branch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Branch Code</Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700">{branchCode}</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Branch / Outlet Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={branchName}
            onChangeText={setBranchName}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Manager</Text>
          <TextInput
            value={managerName}
            onChangeText={setManagerName}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Phone <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Address <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
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
    </View>
  );
}