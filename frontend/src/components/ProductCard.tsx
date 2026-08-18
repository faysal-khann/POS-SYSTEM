import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const API_URL = "http://192.168.1.5:8000";

export default function ProductCard({ product, onDeleted }: any) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Image
        source={{
          uri: product.ImageUrl ? `${API_URL}${product.ImageUrl}` : "https://via.placeholder.com/60",
        }}
        style={styles.image}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{product.ProductName}</Text>
        <Text style={styles.subtext}>Code: {product.ProductCode}</Text>
        <Text style={styles.subtext}>{product.categoryName} · {product.brandName || "-"}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>৳{product.PurchasePrice} → ৳{product.SalePrice}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.stock}>Stock: {product.CurrentStock}</Text>
          <View style={[styles.badge, { backgroundColor: product.Status === "Active" ? "#DCFCE7" : "#FEE2E2" }]}>
            <Text style={{ color: product.Status === "Active" ? "#16A34A" : "#DC2626", fontSize: 12 }}>
              {product.Status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
        // onPress={() => router.push(`/products/${product.ProductID}`)}
        >
          <Ionicons name="create-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleted(product.ProductID)} style={{ marginTop: 10 }}>
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    alignItems: "center",
  },
  image: { width: 55, height: 55, borderRadius: 8, backgroundColor: "#f1f1f1" },
  name: { fontSize: 15, fontWeight: "600" },
  subtext: { fontSize: 12, color: "#666", marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { fontSize: 13, fontWeight: "500", color: "#111" },
  stock: { fontSize: 12, color: "#444" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  actions: { justifyContent: "center", alignItems: "center", marginLeft: 8 },
});