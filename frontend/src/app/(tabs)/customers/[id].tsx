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
  getCustomerById,
  updateCustomer,
  CustomerInput,
} from "../../../services/customerApi";

// ============================================
// INPUT COMPONENT
// ============================================

type CustomerInputFieldProps = {
  fieldKey: keyof CustomerInput;
  label: string;
  placeholder: string;
  required?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  form: CustomerInput;
  update: (key: keyof CustomerInput, value: string | number) => void;
};

const CustomerInputField = ({
  fieldKey,
  label,
  placeholder,
  required = false,
  keyboardType = "default",
  form,
  update,
}: CustomerInputFieldProps) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label}{" "}
        {required && <Text className="text-red-500">*</Text>}
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

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);

  const [form, setForm] = useState<CustomerInput | null>(null);
  const [customerCode, setCustomerCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH CUSTOMER
  // ============================================

  const fetchCustomer = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const data = await getCustomerById(customerId);

      setCustomerCode(data.CustomerCode);

      setForm({
        CustomerName: data.CustomerName,
        Phone: data.Phone,
        Email: data.Email,

        CustomerGroup: data.CustomerGroup,

        DateOfBirth: data.DateOfBirth,
        NationalIdTaxId: data.NationalIdTaxId,

        AddressLine1: data.AddressLine1,
        AddressLine2: data.AddressLine2,
        City: data.City,
        StateDivision: data.StateDivision,
        PostalCode: data.PostalCode,
        Country: data.Country,

        OpeningBalance: data.OpeningBalance,
        CreditLimit: data.CreditLimit,

        Notes: data.Notes,
        Status: data.Status,
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't load customer details.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // ============================================
  // UPDATE FORM
  // ============================================

  const update = (
    key: keyof CustomerInput,
    value: string | number
  ) => {
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  // ============================================
  // UPDATE CUSTOMER
  // ============================================

  const handleUpdate = async () => {
    if (!form) return;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!form.CustomerName?.trim()) {
      Alert.alert(
        "Missing field",
        "Customer Name is required."
      );
      return;
    }

    if (!form.Phone?.trim()) {
      Alert.alert(
        "Missing field",
        "Phone is required."
      );
      return;
    }

    if (!form.CustomerGroup?.trim()) {
      Alert.alert(
        "Missing field",
        "Customer Group is required."
      );
      return;
    }

    if (!form.AddressLine1?.trim()) {
      Alert.alert(
        "Missing field",
        "Address Line 1 is required."
      );
      return;
    }

    if (!form.City?.trim()) {
      Alert.alert(
        "Missing field",
        "City is required."
      );
      return;
    }

    try {
      setSaving(true);

      // Prevent empty DateOfBirth from causing
      // Pydantic date validation error.
      const customerData: CustomerInput = {
        ...form,
        DateOfBirth: form.DateOfBirth
          ? form.DateOfBirth
          : undefined,
      };

      await updateCustomer(
        customerId,
        customerData
      );

      Alert.alert(
        "Success",
        "Customer updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error(err);

      console.log(
        "Update customer error:",
        err.response?.data
      );

      Alert.alert(
        "Error",
        "Couldn't update customer. Check your connection."
      );
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
        <ActivityIndicator
          size="large"
          color="#3B82F6"
        />
      </View>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error || !form) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-red-500 text-center mb-3">
          {error}
        </Text>

        <TouchableOpacity
          onPress={fetchCustomer}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <View className="flex-1 bg-gray-50">

      {/* =========================================
          HEADER
      ========================================= */}

      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">

        <View className="flex-row items-center">

          <TouchableOpacity
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#111827"
            />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Customer Details
          </Text>

        </View>

        {/* UPDATE BUTTON */}

        <TouchableOpacity
          onPress={handleUpdate}
          disabled={saving}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >

          {saving ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={14}
                color="#fff"
              />

              <Text className="text-white text-sm font-medium ml-1.5">
                Update
              </Text>
            </>
          )}

        </TouchableOpacity>

      </View>

      {/* =========================================
          FORM
      ========================================= */}

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{
          paddingBottom: 60,
        }}
        keyboardShouldPersistTaps="handled"
      >

        {/* =========================================
            BASIC INFORMATION
        ========================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3">
          Basic Information
        </Text>

        {/* CUSTOMER CODE */}

        <View className="mb-4">

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Customer Code
          </Text>

          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">

            <Text className="text-sm text-gray-500">
              {customerCode}
            </Text>

          </View>

        </View>

        {/* CUSTOMER NAME */}

        <CustomerInputField
          fieldKey="CustomerName"
          label="Customer Name"
          placeholder="Enter customer name"
          required
          form={form}
          update={update}
        />

        {/* PHONE */}

        <CustomerInputField
          fieldKey="Phone"
          label="Phone"
          placeholder="Enter phone number"
          required
          keyboardType="phone-pad"
          form={form}
          update={update}
        />

        {/* EMAIL */}

        <CustomerInputField
          fieldKey="Email"
          label="Email"
          placeholder="Enter email address"
          keyboardType="email-address"
          form={form}
          update={update}
        />

        {/* =========================================
            CUSTOMER GROUP
        ========================================= */}

        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Customer Group{" "}
          <Text className="text-red-500">*</Text>
        </Text>

        <View className="flex-row mb-4">

          {(
            ["Retail", "Wholesale", "VIP"] as const
          ).map((group) => (

            <TouchableOpacity
              key={group}
              onPress={() =>
                update(
                  "CustomerGroup",
                  group
                )
              }
              className={`flex-1 border rounded-xl py-3 mx-1 items-center ${
                form.CustomerGroup === group
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >

              <Text
                className={
                  form.CustomerGroup === group
                    ? "text-blue-600 font-semibold"
                    : "text-gray-700"
                }
              >
                {group}
              </Text>

            </TouchableOpacity>

          ))}

        </View>

        {/* =========================================
            PERSONAL INFORMATION
        ========================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Personal Information
        </Text>

        {/* DATE OF BIRTH */}

        <CustomerInputField
          fieldKey="DateOfBirth"
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
          form={form}
          update={update}
        />

        {/* NATIONAL ID / TAX ID */}

        <CustomerInputField
          fieldKey="NationalIdTaxId"
          label="National ID / Tax ID"
          placeholder="Enter National ID / Tax ID"
          form={form}
          update={update}
        />

        {/* =========================================
            ADDRESS INFORMATION
        ========================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Address Information
        </Text>

        <CustomerInputField
          fieldKey="AddressLine1"
          label="Address Line 1"
          placeholder="Enter address line 1"
          required
          form={form}
          update={update}
        />

        <CustomerInputField
          fieldKey="AddressLine2"
          label="Address Line 2"
          placeholder="Enter address line 2"
          form={form}
          update={update}
        />

        <CustomerInputField
          fieldKey="City"
          label="City"
          placeholder="Enter city"
          required
          form={form}
          update={update}
        />

        <CustomerInputField
          fieldKey="StateDivision"
          label="State / Division"
          placeholder="Enter state / division"
          form={form}
          update={update}
        />

        <CustomerInputField
          fieldKey="PostalCode"
          label="Postal Code"
          placeholder="Enter postal code"
          form={form}
          update={update}
        />

        <CustomerInputField
          fieldKey="Country"
          label="Country"
          placeholder="Bangladesh"
          form={form}
          update={update}
        />

        {/* =========================================
            FINANCIAL INFORMATION
        ========================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Financial Information
        </Text>

        {/* OPENING BALANCE */}

        <View className="mb-4">

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Opening Balance
          </Text>

          <TextInput
            value={String(
              form.OpeningBalance ?? 0
            )}
            onChangeText={(value) =>
              update(
                "OpeningBalance",
                Number(value) || 0
              )
            }
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />

        </View>

        {/* CREDIT LIMIT */}

        <View className="mb-4">

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Credit Limit
          </Text>

          <TextInput
            value={String(
              form.CreditLimit ?? 0
            )}
            onChangeText={(value) =>
              update(
                "CreditLimit",
                Number(value) || 0
              )
            }
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />

        </View>

        {/* =========================================
            NOTES
        ========================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Notes
        </Text>

        <TextInput
          value={form.Notes ?? ""}
          onChangeText={(value) =>
            update("Notes", value)
          }
          placeholder="Enter notes"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white mb-4"
        />

        {/* =========================================
            STATUS
        ========================================= */}

        <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">

          <Text className="text-sm font-medium text-gray-700">
            Status
          </Text>

          <View className="flex-row items-center">

            <Text className="text-sm text-gray-600 mr-2">
              {form.Status === "Active"
                ? "Active"
                : "Inactive"}
            </Text>

            <Switch
              value={
                form.Status === "Active"
              }
              onValueChange={(value) =>
                update(
                  "Status",
                  value
                    ? "Active"
                    : "Inactive"
                )
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