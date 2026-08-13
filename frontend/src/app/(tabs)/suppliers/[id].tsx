import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  getSupplierById,
  updateSupplier,
  SupplierInput,
} from "../../../services/supplierApi";


export default function SupplierDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);

  const [form, setForm] = useState<SupplierInput | null>(null);
  const [supplierCode, setSupplierCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplier = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getSupplierById(supplierId);
      setSupplierCode(data.SupplierCode);
      setForm({
        SupplierName: data.SupplierName,
        Phone: data.Phone,
        Email: data.Email,
        Website: data.Website,
        AddressLine1: data.AddressLine1,
        AddressLine2: data.AddressLine2,
        City: data.City,
        StateDivision: data.StateDivision,
        PostalCode: data.PostalCode,
        Country: data.Country,
        ContactPerson: data.ContactPerson,
        ContactPersonPhone: data.ContactPersonPhone,
        TaxVatNo: data.TaxVatNo,
        OpeningBalance: data.OpeningBalance,
        CreditLimit: data.CreditLimit,
        Notes: data.Notes,
        Status: data.Status,
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't load supplier details.");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  const update = (key: keyof SupplierInput, value: string | number) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleUpdate = async () => {
    if (!form) return;

    if (!form.SupplierName?.trim()) {
      Alert.alert("Missing field", "Supplier Name is required.");
      return;
    }
    if (!form.Phone?.trim()) {
      Alert.alert("Missing field", "Phone is required.");
      return;
    }
    if (!form.AddressLine1?.trim()) {
      Alert.alert("Missing field", "Address Line 1 is required.");
      return;
    }
    if (!form.City?.trim()) {
      Alert.alert("Missing field", "City is required.");
      return;
    }

    try {
      setSaving(true);
      await updateSupplier(supplierId, form);
      Alert.alert("Success", "Supplier updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't update supplier. Check your connection.");
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

  if (error || !form) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-red-500 text-center mb-3">{error}</Text>
        <TouchableOpacity
          onPress={fetchSupplier}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Input = ({
    fieldKey,
    label,
    placeholder,
    required,
    keyboardType = "default",
  }: {
    fieldKey: keyof SupplierInput;
    label: string;
    placeholder: string;
    required?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TextInput
        value={String(form[fieldKey] ?? "")}
        onChangeText={(v) => update(fieldKey, v)}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Supplier Details
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={saving}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-medium ml-1.5">
                Update
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Basic Information */}
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Basic Information
        </Text>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Supplier Code
          </Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-500">{supplierCode}</Text>
          </View>
        </View>
        <Input fieldKey="SupplierName" label="Supplier Name" placeholder="Enter supplier name" required />
        <Input fieldKey="Phone" label="Phone" placeholder="Enter phone number" required keyboardType="phone-pad" />
        <Input fieldKey="Email" label="Email" placeholder="Enter email address" keyboardType="email-address" />
        <Input fieldKey="Website" label="Website" placeholder="Enter website" />

        {/* Address Information */}
        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Address Information
        </Text>
        <Input fieldKey="AddressLine1" label="Address Line 1" placeholder="Enter address line 1" required />
        <Input fieldKey="AddressLine2" label="Address Line 2" placeholder="Enter address line 2" />
        <Input fieldKey="City" label="City" placeholder="Enter city" required />
        <Input fieldKey="StateDivision" label="State / Division" placeholder="Select state / division" />
        <Input fieldKey="PostalCode" label="Postal Code" placeholder="Enter postal code" />
        <Input fieldKey="Country" label="Country" placeholder="Bangladesh" />

        {/* Other Information */}
        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Other Information
        </Text>
        <Input fieldKey="ContactPerson" label="Contact Person" placeholder="Enter contact person" />
        <Input fieldKey="ContactPersonPhone" label="Phone (Contact Person)" placeholder="Enter contact person phone" keyboardType="phone-pad" />
        <Input fieldKey="TaxVatNo" label="Tax / VAT No." placeholder="Enter tax / vat number" />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Opening Balance
          </Text>
          <TextInput
            value={String(form.OpeningBalance ?? 0)}
            onChangeText={(v) => update("OpeningBalance", Number(v) || 0)}
            placeholder="0.00"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Credit Limit
          </Text>
          <TextInput
            value={String(form.CreditLimit ?? 0)}
            onChangeText={(v) => update("CreditLimit", Number(v) || 0)}
            placeholder="0.00"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        {/* Notes */}
        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Notes
        </Text>
        <TextInput
          value={form.Notes}
          onChangeText={(v) => update("Notes", v)}
          placeholder="Enter notes"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white mb-4"
        />

        {/* Status */}
        <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
          <Text className="text-sm font-medium text-gray-700">Status</Text>
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-600 mr-2">
              {form.Status === "Active" ? "Active" : "Inactive"}
            </Text>
            <Switch
              value={form.Status === "Active"}
              onValueChange={(v) => update("Status", v ? "Active" : "Inactive")}
              trackColor={{ false: "#D1D5DB", true: "#22C55E" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}