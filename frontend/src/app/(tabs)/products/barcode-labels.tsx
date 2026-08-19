import { useState, useEffect, useRef } from "react";
import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Barcode from "react-native-barcode-svg";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Dropdown from "../../../components/Dropdown";
import { getProducts, Product } from "../../../services/productApi";

const LABEL_SIZES = [
  { id: 1, name: "40mm x 30mm" },
  { id: 2, name: "50mm x 25mm" },
  { id: 3, name: "60mm x 40mm" },
];

const FONT_SIZES = [
  { id: 1, name: "Small" },
  { id: 2, name: "Medium" },
  { id: 3, name: "Large" },
];

export default function BarcodeLabelsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [labelSize, setLabelSize] = useState(1);
  const [fontSize, setFontSize] = useState(2);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showCode, setShowCode] = useState(true);

  const [exporting, setExporting] = useState(false);
  const viewShotRefs = useRef<
    Record<number, React.ElementRef<typeof ViewShot> | null>
  >({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        setProducts(data.filter((p) => p.Barcode));
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.ProductID)));
    }
  };

  const fontClass =
    fontSize === 1 ? "text-[10px]" : fontSize === 3 ? "text-sm" : "text-xs";

  const handleDownloadPdf = async () => {
    const selected = products.filter((p) => selectedIds.has(p.ProductID));
    if (selected.length === 0) {
      Alert.alert(
        "No products selected",
        "Select at least one product to print.",
      );
      return;
    }

    try {
      setExporting(true);

      // Capture each label as an image
      const labelImages: string[] = [];
      for (const product of selected) {
        const ref = viewShotRefs.current[product.ProductID];
        if (ref) {
          const uri = await ref.capture!();
          labelImages.push(uri);
        }
      }

      const html = generateLabelsHtml(labelImages);
      const { uri } = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Barcode Labels",
        });
      } else {
        Alert.alert("Saved", `PDF saved to: ${uri}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Couldn't generate labels PDF.");
    } finally {
      setExporting(false);
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
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Barcode Labels
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDownloadPdf}
          disabled={exporting}
          className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-medium ml-1.5">PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Label Settings */}
        <View className="px-4 pt-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Label Settings
          </Text>

          <Dropdown
            label="Label Size"
            placeholder="Select size"
            options={LABEL_SIZES}
            selectedId={labelSize}
            onSelect={setLabelSize}
          />
          <Dropdown
            label="Font Size"
            placeholder="Select font size"
            options={FONT_SIZES}
            selectedId={fontSize}
            onSelect={setFontSize}
          />

          {[
            { label: "Show Product Name", value: showName, set: setShowName },
            { label: "Show Price", value: showPrice, set: setShowPrice },
            { label: "Show Barcode", value: showBarcode, set: setShowBarcode },
            { label: "Show Code", value: showCode, set: setShowCode },
          ].map((row) => (
            <View
              key={row.label}
              className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2"
            >
              <Text className="text-sm text-gray-700">{row.label}</Text>
              <Switch
                value={row.value}
                onValueChange={row.set}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Select products */}
        <View className="flex-row items-center justify-between px-4 mt-4 mb-2">
          <TouchableOpacity
            onPress={selectAll}
            className="flex-row items-center"
          >
            <Ionicons
              name={
                selectedIds.size === products.length && products.length > 0
                  ? "checkbox"
                  : "square-outline"
              }
              size={18}
              color="#3B82F6"
            />
            <Text className="text-sm text-gray-600 ml-2">Select all</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400">
            {selectedIds.size} of {products.length} selected
          </Text>
        </View>

        {/* Preview */}
        <Text className="text-base font-semibold text-gray-900 px-4 mt-2 mb-3">
          Preview
        </Text>

        <View className="px-4 flex-row flex-wrap justify-between">
          {products.map((product) => {
            const isSelected = selectedIds.has(product.ProductID);
            return (
              <TouchableOpacity
                key={product.ProductID}
                onPress={() => toggleSelect(product.ProductID)}
                className={`w-[48%] mb-3 border rounded-xl overflow-hidden ${
                  isSelected ? "border-blue-400" : "border-gray-200"
                }`}
              >
                <ViewShot
                  ref={(r) => {
                    viewShotRefs.current[product.ProductID] = r;
                  }}
                  options={{ format: "png", quality: 1 }}
                >
                  <View className="bg-white items-center py-3 px-2">
                    {showName && (
                      <Text
                        className={`${fontClass} font-semibold text-gray-900 text-center`}
                        numberOfLines={1}
                      >
                        {product.ProductName}
                      </Text>
                    )}
                    {showCode && (
                      <Text className={`${fontClass} text-gray-400`}>
                        {product.ProductCode}
                      </Text>
                    )}
                    {showBarcode &&
                    product.Barcode &&
                    /^\d{13}$/.test(product.Barcode) ? (
                      <View className="my-1">
                        <Barcode
                          key={product.Barcode}
                          value={product.Barcode}
                          format="EAN13"
                          singleBarWidth={2}
                          height={40}
                          maxWidth={140}
                          lineColor="#000000"
                          backgroundColor="#FFFFFF"
                        />
                      </View>
                    ) : showBarcode ? (
                      <Text className="text-[10px] text-gray-400 my-1">
                        No barcode
                      </Text>
                    ) : null}
                    {showPrice && (
                      <Text
                        className={`${fontClass} font-semibold text-gray-800`}
                      >
                        ৳ {Number(product.SalePrice ?? 0).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </ViewShot>
                {isSelected && (
                  <View className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function generateLabelsHtml(images: string[]) {
  const cells = images
    .map(
      (img) => `
      <div style="display:inline-block; width:45%; margin:1%; border:1px solid #E5E7EB; border-radius:8px; overflow:hidden;">
        <img src="${img}" style="width:100%; height:auto;" />
      </div>`,
    )
    .join("");

  return `
    <html>
      <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 12px; text-align:center;">
        ${cells}
      </body>
    </html>
  `;
}
