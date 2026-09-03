import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Dropdown from "../../../components/Dropdown";
import {
  createProduct,
  getCategories,
  getBrands,
  getUnits,
  getNextProductCode,
  Lookup,
  ProductInput,
  uploadProductImage,
} from "../../../services/productApi";

import Barcode from "react-native-barcode-svg";
import { generateEAN13 } from "../../../utils/barcode";
import { getFullImageUrl } from "../../../services/productApi";

// ---- Moved outside the screen component so it has a stable identity ----
type InputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  required?: boolean;
};

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  required,
}: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
      />
    </View>
  );
}

export default function AddProductScreen() {
  const [productCode, setProductCode] = useState("");
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [brands, setBrands] = useState<Lookup[]>([]);
  const [units, setUnits] = useState<Lookup[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [form, setForm] = useState<ProductInput>({
    ProductName: "",
    Barcode: "",
    CategoryID: 0,
    BrandID: undefined,
    UnitID: 0,
    PurchasePrice: 0,
    SalePrice: 0,
    TaxPercent: 0,
    OpeningStock: 0,
    ReorderLevel: 0,
    Status: "Active",
    Description: "",
    ImageUrl: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [cats, brs, uns, code] = await Promise.all([
          getCategories(),
          getBrands(),
          getUnits(),
          getNextProductCode(),
        ]);
        setCategories(cats);
        setBrands(brs);
        setUnits(uns);
        setProductCode(code);
        update("Barcode", generateEAN13()); // ← auto-generate barcode
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load categories/brands/units.");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const update = (key: keyof ProductInput, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access to add a product image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setImageUri(localUri); // show local preview immediately

      try {
        setUploading(true);
        const uploadedUrl = await uploadProductImage(localUri);
        update("ImageUrl", uploadedUrl); // real server URL saved into form
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Upload failed",
          "Couldn't upload image. Please try again.",
        );
        setImageUri(null);
        update("ImageUrl", "");
      } finally {
        setUploading(false);
      }
    }
  };

  const removeImage = () => {
    setImageUri(null);
    update("ImageUrl", "");
  };

  const handleSave = async () => {
    if (!form.ProductName.trim()) {
      Alert.alert("Missing field", "Product Name is required.");
      return;
    }
    if (!form.CategoryID) {
      Alert.alert("Missing field", "Please select a Category.");
      return;
    }
    if (!form.UnitID) {
      Alert.alert("Missing field", "Please select a Unit.");
      return;
    }

    try {
      setSaving(true);
      await createProduct(form);
      Alert.alert("Success", "Product saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't save product.");
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
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Add Product
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
              <Text className="text-white text-sm font-medium ml-1.5">
                Save
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Basic Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Product Code
          </Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-500">{productCode}</Text>
          </View>
        </View>

        <Input
          label="Product Name"
          required
          value={form.ProductName}
          onChangeText={(v) => update("ProductName", v)}
          placeholder="Enter product name"
        />
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-sm font-medium text-gray-700">Barcode</Text>
            <TouchableOpacity
              onPress={() => update("Barcode", generateEAN13())}
            >
              <Text className="text-xs text-blue-600 font-medium">
                Regenerate
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={form.Barcode ?? ""}
            onChangeText={(v) => update("Barcode", v)}
            placeholder="Auto-generated"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white mb-3"
          />

          {form.Barcode && /^\d{13}$/.test(form.Barcode) ? (
            <View className="items-center bg-white border border-gray-200 rounded-xl py-3">
              <Barcode
                value={form.Barcode}
                format="EAN13"
                singleBarWidth={2}
                height={60}
                maxWidth={220}
                lineColor="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
          ) : (
            <View className="items-center bg-gray-50 border border-gray-200 rounded-xl py-6">
              <Text className="text-xs text-gray-400">
                Barcode preview will appear here
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-start">
          <View className="flex-1 mr-2">
            <Dropdown
              label="Category"
              placeholder="Select category"
              required
              options={categories}
              selectedId={form.CategoryID || undefined}
              onSelect={(id) => update("CategoryID", id)}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/products/categories")}
            className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mt-[24px]"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Dropdown
          label="Brand"
          placeholder="Select brand"
          options={brands}
          selectedId={form.BrandID}
          onSelect={(id) => update("BrandID", id)}
        />
        <Dropdown
          label="Unit"
          placeholder="Select unit"
          required
          options={units}
          selectedId={form.UnitID || undefined}
          onSelect={(id) => update("UnitID", id)}
        />

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          Pricing & Stock
        </Text>

        <Input
          label="Purchase Price"
          value={String(form.PurchasePrice ?? 0)}
          onChangeText={(v) => update("PurchasePrice", Number(v) || 0)}
          placeholder="0.00"
          keyboardType="numeric"
        />
        <Input
          label="Sale Price"
          value={String(form.SalePrice ?? 0)}
          onChangeText={(v) => update("SalePrice", Number(v) || 0)}
          placeholder="0.00"
          keyboardType="numeric"
        />
        <Input
          label="Tax %"
          value={String(form.TaxPercent ?? 0)}
          onChangeText={(v) => update("TaxPercent", Number(v) || 0)}
          placeholder="0"
          keyboardType="numeric"
        />
        <Input
          label="Opening Stock"
          value={String(form.OpeningStock ?? 0)}
          onChangeText={(v) => update("OpeningStock", Number(v) || 0)}
          placeholder="0"
          keyboardType="numeric"
        />
        <Input
          label="Reorder Level"
          value={String(form.ReorderLevel ?? 0)}
          onChangeText={(v) => update("ReorderLevel", Number(v) || 0)}
          placeholder="0"
          keyboardType="numeric"
        />

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-4">
          More Information
        </Text>

        {/* Product Image */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Product Image
          </Text>

          {imageUri ? (
            <View className="relative w-28 h-28">
              <Image
                source={{ uri: imageUri }}
                className="w-28 h-28 rounded-xl"
              />
              {uploading && (
                <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <TouchableOpacity
                onPress={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-white"
            >
              <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 mt-1">Add photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          value={form.Description}
          onChangeText={(v) => update("Description", v)}
          placeholder="Enter description"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white mb-4"
        />

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
