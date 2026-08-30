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
import Dropdown from "../../../components/Dropdown";
import PermissionTree from "../../../components/PermissionTree";
import {
  getUserDetail,
  updateUser,
  getRoles,
  getPermissionTree,
  Lookup,
  PermissionNode,
} from "../../../services/userApi";
import { getBranches } from "../../../services/purchaseApi";

const STATUS_OPTIONS: Lookup[] = [
  { id: 1, name: "Active" },
  { id: 2, name: "Inactive" },
];

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [roles, setRoles] = useState<Lookup[]>([]);
  const [branches, setBranches] = useState<Lookup[]>([]);
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [loading, setLoading] = useState(true);
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
        const [detail, r, br, tree] = await Promise.all([
          getUserDetail(userId),
          getRoles(),
          getBranches(),
          getPermissionTree(),
        ]);
        setFullName(detail.FullName);
        setUsername(detail.Username);
        setEmail(detail.Email);
        setPhone(detail.Phone ?? "");
        setStatusId(detail.Status === "Inactive" ? 2 : 1);
        setRoleId(detail.RoleID);
        setBranchId(detail.PrimaryBranchID);
        setEmployeeId(detail.EmployeeID ?? "");
        setDesignation(detail.Designation ?? "");
        setAddress(detail.Address ?? "");
        setNotes(detail.Notes ?? "");
        setSelectedPermissions(new Set(detail.PermissionIDs));
        setRoles(r);
        setBranches(br);
        setPermissionTree(tree);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load user details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      Alert.alert("Missing fields", "Full Name, Username and Email are required.");
      return;
    }
    if (password && password !== confirmPassword) {
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
      await updateUser(userId, {
        FullName: fullName,
        Username: username,
        Email: email,
        Phone: phone || undefined,
        Password: password || undefined,
        ConfirmPassword: confirmPassword || undefined,
        RoleID: roleId,
        PrimaryBranchID: branchId,
        EmployeeID: employeeId || undefined,
        Designation: designation || undefined,
        Address: address || undefined,
        Notes: notes || undefined,
        Status: STATUS_OPTIONS.find((s) => s.id === statusId)?.name ?? "Active",
        PermissionIDs: Array.from(selectedPermissions),
      });

      Alert.alert("Success", "User updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.detail || "Couldn't update user.";
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
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Edit User</Text>
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
              <Text className="text-white text-sm font-medium ml-1.5">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <Text className="text-base font-semibold text-gray-900 mb-3">Basic Information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Full Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
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
            keyboardType="phone-pad"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Password <Text className="text-xs text-gray-400">(leave blank to keep current)</Text>
          </Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 text-sm text-gray-800"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {password.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Confirm Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 py-3 text-sm text-gray-800"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Dropdown
          label="Status"
          placeholder="Select status"
          required
          options={STATUS_OPTIONS}
          selectedId={statusId}
          onSelect={setStatusId}
        />

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

        <Text className="text-base font-semibold text-gray-900 mb-3">Additional Information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Employee ID</Text>
          <TextInput
            value={employeeId}
            onChangeText={setEmployeeId}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Designation</Text>
          <TextInput
            value={designation}
            onChangeText={setDesignation}
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
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