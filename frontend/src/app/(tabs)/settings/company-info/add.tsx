import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Dropdown from "../../../../components/Dropdown";
import { createCompany, uploadCompanyLogo } from "../../../../services/companyApi";
import { Lookup } from "../../../../services/purchaseApi";
import { API_URL } from "../../../../config/api";

const CURRENCY_OPTIONS: Lookup[] = [
  { id: 1, name: "BDT (৳) - Bangladeshi Taka" },
  { id: 2, name: "USD ($) - US Dollar" },
  { id: 3, name: "EUR (€) - Euro" },
  { id: 4, name: "INR (₹) - Indian Rupee" },
];

const COUNTRY_OPTIONS: Lookup[] = [
  { id: 1, name: "Bangladesh" },
  { id: 2, name: "India" },
  { id: 3, name: "United States" },
];

export default function AddCompanyScreen() {
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [countryId, setCountryId] = useState<number | undefined>();
  const [currencyId, setCurrencyId] = useState<number | undefined>();
  const [website, setWebsite] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | undefined>();

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo library access to choose a logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setLogoUri(asset.uri);

      try {
        setUploadingLogo(true);
        const path = await uploadCompanyLogo(asset.uri, asset.fileName ?? "logo.jpg");
        setLogoPath(path);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't upload logo.");
      } finally {
        setUploadingLogo(false);
      }
    }
  };
  const CURRENCY_CODE_MAP: Record<number, string> = {
  1: "BDT",
  2: "USD",
  3: "EUR",
  4: "INR",
};

  const handleSave = async () => {
    if (!companyName.trim()) {
      Alert.alert("Missing field", "Company Name is required.");
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
    if (!currencyId) {
      Alert.alert("Missing field", "Please select a Currency.");
      return;
    }

    try {
      setSaving(true);
      await createCompany({
        CompanyName: companyName,
        Phone: phone,
        Email: email || undefined,
        Address: address,
        Country: COUNTRY_OPTIONS.find((c) => c.id === countryId)?.name,
        Currency: CURRENCY_OPTIONS.find((c) => c.id === currencyId)?.name,
        Website: website || undefined,
        TaxNo: taxNo || undefined,
        LogoPath: logoPath,
        IsActive: true,
      });

      Alert.alert("Success", "Company info saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.detail || "Couldn't save company info.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">Add / Edit Company Info</Text>
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
              <Text className="text-white text-sm font-medium ml-1.5">Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Company Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter company name"
            placeholderTextColor="#9CA3AF"
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
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
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
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Address <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <Dropdown
          label="Country"
          placeholder="Select country"
          options={COUNTRY_OPTIONS}
          selectedId={countryId}
          onSelect={setCountryId}
        />

        <Dropdown
          label="Currency"
          placeholder="Select currency"
          required
          options={CURRENCY_OPTIONS}
          selectedId={currencyId}
          onSelect={setCurrencyId}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Website</Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="www.example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Tax ID / BIN</Text>
          <TextInput
            value={taxNo}
            onChangeText={setTaxNo}
            placeholder="Enter Tax ID or BIN"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        {/* Logo */}
        <Text className="text-base font-semibold text-gray-900 mb-3">Company Logo</Text>

        <View className="bg-white border border-gray-200 rounded-xl p-4 items-center mb-6">
          {logoUri ? (
            <Image source={{ uri: logoUri }} className="w-32 h-32 rounded-lg mb-3" resizeMode="contain" />
          ) : (
            <View className="w-32 h-32 rounded-lg bg-gray-100 items-center justify-center mb-3">
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}

          <TouchableOpacity
            onPress={pickLogo}
            disabled={uploadingLogo}
            className="border border-blue-500 rounded-lg px-4 py-2 flex-row items-center"
          >
            {uploadingLogo ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={16} color="#3B82F6" />
                <Text className="text-blue-600 text-sm font-medium ml-1.5">Choose File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}