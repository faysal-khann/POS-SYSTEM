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

// ============================================
// INPUT COMPONENT
// Keep this OUTSIDE SupplierDetailsScreen
// ============================================

type SupplierInputFieldProps = {
  fieldKey: keyof SupplierInput;
  label: string;
  placeholder: string;
  required?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  form: SupplierInput;
  update: (key: keyof SupplierInput, value: string | number) => void;
};

const SupplierInputField = ({
  fieldKey,
  label,
  placeholder,
  required = false,
  keyboardType = "default",
  form,
  update,
}: SupplierInputFieldProps) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>

      <TextInput
        value={String(form[fieldKey] ?? "")}
        onChangeText={(value) => update(fieldKey, value)}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
      />
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export default function SupplierDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);

  const [form, setForm] = useState<SupplierInput | null>(null);
  const [supplierCode, setSupplierCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH SUPPLIER
  // ============================================

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

  // ============================================
  // UPDATE FORM
  // ============================================

  const update = (key: keyof SupplierInput, value: string | number) => {
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  // ============================================
  // UPDATE SUPPLIER
  // ============================================

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
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error(err);

      Alert.alert("Error", "Couldn't update supplier. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // ============================================
  // ERROR
  // ============================================

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

  // ============================================
  // UI
  // ============================================

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}

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

      {/* ================= FORM ================= */}

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{
          paddingBottom: 60,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= BASIC INFORMATION ================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3">
          Basic Information
        </Text>

        {/* Supplier Code */}

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Supplier Code
          </Text>

          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-500">{supplierCode}</Text>
          </View>
        </View>

        {/* Supplier Name */}

        <SupplierInputField
          fieldKey="SupplierName"
          label="Supplier Name"
          placeholder="Enter supplier name"
          required
          form={form}
          update={update}
        />

        {/* Phone */}

        <SupplierInputField
          fieldKey="Phone"
          label="Phone"
          placeholder="Enter phone number"
          required
          keyboardType="phone-pad"
          form={form}
          update={update}
        />

        {/* Email */}

        <SupplierInputField
          fieldKey="Email"
          label="Email"
          placeholder="Enter email address"
          keyboardType="email-address"
          form={form}
          update={update}
        />

        {/* Website */}

        <SupplierInputField
          fieldKey="Website"
          label="Website"
          placeholder="Enter website"
          form={form}
          update={update}
        />

        {/* ================= ADDRESS ================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Address Information
        </Text>

        <SupplierInputField
          fieldKey="AddressLine1"
          label="Address Line 1"
          placeholder="Enter address line 1"
          required
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="AddressLine2"
          label="Address Line 2"
          placeholder="Enter address line 2"
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="City"
          label="City"
          placeholder="Enter city"
          required
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="StateDivision"
          label="State / Division"
          placeholder="Select state / division"
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="PostalCode"
          label="Postal Code"
          placeholder="Enter postal code"
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="Country"
          label="Country"
          placeholder="Bangladesh"
          form={form}
          update={update}
        />

        {/* ================= OTHER INFORMATION ================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Other Information
        </Text>

        <SupplierInputField
          fieldKey="ContactPerson"
          label="Contact Person"
          placeholder="Enter contact person"
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="ContactPersonPhone"
          label="Phone (Contact Person)"
          placeholder="Enter contact person phone"
          keyboardType="phone-pad"
          form={form}
          update={update}
        />

        <SupplierInputField
          fieldKey="TaxVatNo"
          label="Tax / VAT No."
          placeholder="Enter tax / vat number"
          form={form}
          update={update}
        />

        {/* ================= OPENING BALANCE ================= */}

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Opening Balance
          </Text>

          <TextInput
            value={String(form.OpeningBalance ?? 0)}
            onChangeText={(value) =>
              update("OpeningBalance", Number(value) || 0)
            }
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        {/* ================= CREDIT LIMIT ================= */}

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Credit Limit
          </Text>

          <TextInput
            value={String(form.CreditLimit ?? 0)}
            onChangeText={(value) => update("CreditLimit", Number(value) || 0)}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        {/* ================= NOTES ================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Notes
        </Text>

        <TextInput
          value={form.Notes ?? ""}
          onChangeText={(value) => update("Notes", value)}
          placeholder="Enter notes"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white mb-4"
        />

        {/* ================= STATUS ================= */}

        <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
          <Text className="text-sm font-medium text-gray-700">Status</Text>

          <View className="flex-row items-center">
            <Text className="text-sm text-gray-600 mr-2">
              {form.Status === "Active" ? "Active" : "Inactive"}
            </Text>

            <Switch
              value={form.Status === "Active"}
              onValueChange={(value) =>
                update("Status", value ? "Active" : "Inactive")
              }
              trackColor={{
                false: "#D1D5DB",
                true: "#22C55E",
              }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
