import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { getUserDetail, UserDetail } from "../../../../services/userApi";

export default function UserViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getUserDetail(userId);
        setDetail(d);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load user details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading || !detail) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const Field = ({ label, value }: { label: string; value: string }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
        <Text className="text-sm text-gray-700">{value}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">User Details</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <Text className="text-base font-semibold text-gray-900 mb-3">Basic Information</Text>
        <Field label="Full Name" value={detail.FullName} />
        <Field label="Username" value={detail.Username} />
        <Field label="Email" value={detail.Email} />
        <Field label="Phone" value={detail.Phone ?? "—"} />
        <Field label="Status" value={detail.Status} />

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-2">Role & Access</Text>
        <Field label="Role" value={detail.RoleName} />
        <Field label="Primary Branch / Outlet" value={detail.BranchName} />
        <Field label="Permissions Assigned" value={String(detail.PermissionIDs.length)} />

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-2">Additional Information</Text>
        <Field label="Employee ID" value={detail.EmployeeID ?? "—"} />
        <Field label="Designation" value={detail.Designation ?? "—"} />
        <Field label="Address" value={detail.Address ?? "—"} />
        <Field label="Notes" value={detail.Notes ?? "—"} />
        <Field
          label="Last Login"
          value={detail.LastLoginAt ? new Date(detail.LastLoginAt).toLocaleString() : "Never logged in"}
        />

        <TouchableOpacity
        //   onPress={() => router.push(`/users-roles/users/${detail.UserID}`)}
          className="bg-blue-600 rounded-xl py-3 items-center mt-4"
        >
          <Text className="text-white font-semibold">Edit User</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}