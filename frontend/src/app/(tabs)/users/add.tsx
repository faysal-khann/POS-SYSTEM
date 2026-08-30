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
import Dropdown from "../../../components/Dropdown";
import PermissionTree from "../../../components/PermissionTree";
import {
  createUser,
  getRoles,
  getPermissionTree,
  getRolePermissionIds,
  Lookup,
  PermissionNode,
} from "../../../services/userApi";
import { getBranches } from "../../../services/purchaseApi";

const STATUS_OPTIONS: Lookup[] = [
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

export default function AddUserScreen() {
  const [roles, setRoles] = useState<Lookup[]>([]);
  const [branches, setBranches] = useState<Lookup[]>([]);
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusId, setStatusId] = useState<number>(1);

  const [roleId, setRoleId] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<number | undefined>();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [r, br, tree] = await Promise.all([
          getRoles(),
          getBranches(),
          getPermissionTree(),
        ]);
        setRoles(r);
        setBranches(br);
        setPermissionTree(tree);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load roles/branches/permissions.");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  // When role changes, pre-check that role's default permissions
  useEffect(() => {
    if (!roleId) return;
    (async () => {
      try {
        const ids = await getRolePermissionIds(roleId);
        setSelectedPermissions(new Set(ids));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [roleId]);

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      Alert.alert("Missing fields", "Full Name, Username and Email are required.");
      return;
    }
    if (!password || !confirmPassword) {
      Alert.alert("Missing fields", "Password and Confirm Password are required.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Password and Confirm Password do not match.");
      return;
    }
    if (!roleId) {
      Alert.alert("Missing field", "Please select a Role.");
      return;
    }
    if (!branchId) {
      Alert.alert("Missing field", "Please select a Primary Branch / Outlet.");
      return;
    }

    try {
      setSaving(true);
      await createUser({
        FullName: fullName,
        Username: username,
        Email: email,
        Phone: phone || undefined,
        Password: password,
        ConfirmPassword: confirmPassword,
        RoleID: roleId,
        PrimaryBranchID: branchId,
        EmployeeID: employeeId || undefined,
        Designation: designation || undefined,
        Address: address || undefined,
        Notes: notes || undefined,
        Status: STATUS_OPTIONS.find((s) => s.id === statusId)?.name ?? "Active",
        PermissionIDs: Array.from(selectedPermissions),
      });

      Alert.alert("Success", "User created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.detail || "Couldn't create user.";
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
          <Text className="text-lg font-semibold text-gray-900 ml-3">Add User</Text>
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
              <Text className="text-white text-sm font-medium ml-1.5">Save User</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Basic Information */}
        <Text className="text-base font-semibold text-gray-900 mb-3">Basic Information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Full Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Username <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Email <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Password <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 text-sm text-gray-800"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 py-3 text-sm text-gray-800"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <Dropdown
          label="Status"
          placeholder="Select status"
          required
          options={STATUS_OPTIONS}
          selectedId={statusId}
          onSelect={setStatusId}
        />

        {/* Role & Access */}
        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">Role & Access</Text>

        <Dropdown
          label="Role"
          placeholder="Select Role"
          required
          options={roles}
          selectedId={roleId}
          onSelect={setRoleId}
        />

        <Dropdown
          label="Primary Branch / Outlet"
          placeholder="Select Branch / Outlet"
          required
          options={branches}
          selectedId={branchId}
          onSelect={setBranchId}
        />

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Permissions</Text>
          <View className="border border-gray-200 rounded-xl p-3 bg-white">
            <PermissionTree
              tree={permissionTree}
              selected={selectedPermissions}
              onChange={setSelectedPermissions}
            />
          </View>
        </View>

        {/* Additional Information */}
        <Text className="text-base font-semibold text-gray-900 mb-3">Additional Information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Employee ID</Text>
          <TextInput
            value={employeeId}
            onChangeText={setEmployeeId}
            placeholder="Enter employee ID"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Designation</Text>
          <TextInput
            value={designation}
            onChangeText={setDesignation}
            placeholder="Enter designation"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter notes"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>
      </ScrollView>
    </View>
  );
}