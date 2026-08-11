import { useState } from "react";
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
import { router } from "expo-router";
import {
  createSupplier,
  SupplierInput,
} from "../../../services/supplierApi";


// =====================================================
// INPUT COMPONENT
// IMPORTANT: Keep this OUTSIDE AddSupplierScreen
// =====================================================

type InputProps = {
  fieldKey: keyof SupplierInput;
  label: string;
  placeholder: string;
  required?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  form: SupplierInput;
  update: (key: keyof SupplierInput, value: string | number) => void;
};

const Input = ({
  fieldKey,
  label,
  placeholder,
  required,
  keyboardType = "default",
  form,
  update,
}: InputProps) => {
  return (
    <View className="mb-4">

      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label}{" "}
        {required && (
          <Text className="text-red-500">*</Text>
        )}
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


// =====================================================
// ADD SUPPLIER SCREEN
// =====================================================

export default function AddSupplierScreen() {

  const [form, setForm] = useState<SupplierInput>({
    SupplierName: "",
    Phone: "",
    Email: "",
    Website: "",
    AddressLine1: "",
    AddressLine2: "",
    City: "",
    StateDivision: "",
    PostalCode: "",
    Country: "Bangladesh",
    ContactPerson: "",
    ContactPersonPhone: "",
    TaxVatNo: "",
    OpeningBalance: 0,
    CreditLimit: 0,
    Notes: "",
    Status: "Active",
  });

  const [saving, setSaving] = useState(false);


  // =====================================================
  // UPDATE FORM
  // =====================================================

  const update = (
    key: keyof SupplierInput,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };


  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {

    if (!form.SupplierName?.trim()) {
      Alert.alert(
        "Missing field",
        "Supplier Name is required."
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

      await createSupplier(form);

      Alert.alert(
        "Success",
        "Supplier saved successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

    } catch (err) {

      console.error(err);

      Alert.alert(
        "Error",
        "Couldn't save supplier. Check your connection."
      );

    } finally {

      setSaving(false);

    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <View className="flex-1 bg-gray-50">


      {/* =================================================
          HEADER
      ================================================= */}

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
            Add Supplier
          </Text>

        </View>


        {/* SAVE BUTTON */}

        <TouchableOpacity
          onPress={handleSave}
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
                Save
              </Text>
            </>

          )}

        </TouchableOpacity>

      </View>


      {/* =================================================
          SCROLL VIEW
      ================================================= */}

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
      >


        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3">
          Basic Information
        </Text>


        {/* SUPPLIER CODE */}

        <View className="mb-2">

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Supplier Code
          </Text>

          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">

            <Text className="text-sm text-gray-500">
              Auto-generated on save
            </Text>

          </View>

        </View>


        <Input
          form={form}
          update={update}
          fieldKey="SupplierName"
          label="Supplier Name"
          placeholder="Enter supplier name"
          required
        />


        <Input
          form={form}
          update={update}
          fieldKey="Phone"
          label="Phone"
          placeholder="Enter phone number"
          required
          keyboardType="phone-pad"
        />


        <Input
          form={form}
          update={update}
          fieldKey="Email"
          label="Email"
          placeholder="Enter email address"
          keyboardType="email-address"
        />


        <Input
          form={form}
          update={update}
          fieldKey="Website"
          label="Website"
          placeholder="Enter website"
        />


        {/* =================================================
            ADDRESS INFORMATION
        ================================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Address Information
        </Text>


        <Input
          form={form}
          update={update}
          fieldKey="AddressLine1"
          label="Address Line 1"
          placeholder="Enter address line 1"
          required
        />


        <Input
          form={form}
          update={update}
          fieldKey="AddressLine2"
          label="Address Line 2"
          placeholder="Enter address line 2"
        />


        <Input
          form={form}
          update={update}
          fieldKey="City"
          label="City"
          placeholder="Enter city"
          required
        />


        <Input
          form={form}
          update={update}
          fieldKey="StateDivision"
          label="State / Division"
          placeholder="Select state / division"
        />


        <Input
          form={form}
          update={update}
          fieldKey="PostalCode"
          label="Postal Code"
          placeholder="Enter postal code"
        />


        <Input
          form={form}
          update={update}
          fieldKey="Country"
          label="Country"
          placeholder="Bangladesh"
        />


        {/* =================================================
            OTHER INFORMATION
        ================================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Other Information
        </Text>


        <Input
          form={form}
          update={update}
          fieldKey="ContactPerson"
          label="Contact Person"
          placeholder="Enter contact person"
        />


        <Input
          form={form}
          update={update}
          fieldKey="ContactPersonPhone"
          label="Phone (Contact Person)"
          placeholder="Enter contact person phone"
          keyboardType="phone-pad"
        />


        <Input
          form={form}
          update={update}
          fieldKey="TaxVatNo"
          label="Tax / VAT No."
          placeholder="Enter tax / vat number"
        />


        {/* =================================================
            OPENING BALANCE
        ================================================= */}

        <View className="mb-4">

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Opening Balance
          </Text>

          <TextInput
            value={String(form.OpeningBalance ?? 0)}
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


        {/* =================================================
            CREDIT LIMIT
        ================================================= */}

        <View className="mb-4">

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Credit Limit
          </Text>

          <TextInput
            value={String(form.CreditLimit ?? 0)}
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


        {/* =================================================
            NOTES
        ================================================= */}

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Notes
        </Text>


        <TextInput
          value={form.Notes}
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


        {/* =================================================
            STATUS
        ================================================= */}

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
              value={form.Status === "Active"}
              onValueChange={(value) =>
                update(
                  "Status",
                  value ? "Active" : "Inactive"
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