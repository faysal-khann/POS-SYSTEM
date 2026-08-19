import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getProductByBarcode, Product } from "../../../services/productApi";

export default function ScanBarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const lockRef = useRef(false);

  const handleScan = async ({ data }: { data: string }) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setScanned(true);
    setLoading(true);

    try {
      const found = await getProductByBarcode(data);
      setProduct(found);
    } catch (err) {
      Alert.alert("Not found", `No product matches barcode: ${data}`, [
        { text: "Scan again", onPress: resetScan },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setProduct(null);
    lockRef.current = false;
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-white text-center mb-4">
          Camera access is needed to scan barcodes.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {/* Header */}
      <View className="absolute top-14 left-0 right-0 flex-row items-center px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black/50 rounded-full p-2"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white font-semibold text-base ml-3">Scan Barcode</Text>
      </View>

      {/* Scan frame */}
      {!scanned && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-64 h-40 border-2 border-white rounded-xl" />
          <Text className="text-white text-xs mt-4">
            Align barcode within the frame
          </Text>
        </View>
      )}

      {/* Result card */}
      {scanned && (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5">
          {loading ? (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 text-sm mt-3">Looking up product...</Text>
            </View>
          ) : product ? (
            <View>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                  {product.ProductName}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    product.Status === "Active" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      product.Status === "Active" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {product.Status}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-500 mb-1">
                {product.ProductCode} · Barcode: {product.Barcode}
              </Text>
              <Text className="text-sm text-gray-500 mb-3">
                Stock: {product.CurrentStock}
              </Text>

              <View className="flex-row justify-between items-center border-t border-gray-100 pt-3 mb-4">
                <Text className="text-xs text-gray-400">Sale Price</Text>
                <Text className="text-xl font-bold text-blue-600">
                  ৳ {Number(product.SalePrice ?? 0).toFixed(2)}
                </Text>
              </View>

              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={resetScan}
                  className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-700 font-medium">Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/products/${product.ProductID}`)}
                  className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-medium">View / Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}