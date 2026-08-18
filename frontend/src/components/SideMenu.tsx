import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.75;

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

const menuItems = [
  { label: "Dashboard", icon: "home-outline" },
  { label: "POS", icon: "card-outline" },
  { label: "Inventory", icon: "layers-outline" },
  { label: "Purchase", icon: "bag-outline" },
];

const productSubItems = [
  "Product List",
  "Add Product",
  "Categories",
  "Brands",
  "Units",
  "Barcode Labels",
  "Price Update",
];
const supplierSubItems = ["Supplier List", "Add Supplier", "Supplier Ledger"];
const customerSubItems = ["Customer List", "Add Customer", "Customer Ledger", "Loyalty Points"];

const productRoutes: Record<string, string> = {
  "Product List": "/products",
  "Add Product": "/products/add",
  "Categories": "/products/categories",
  "Brands": "/products/brands",
  "Units": "/products/units",
  "Barcode Labels": "/products/barcode-labels",
  "Price Update": "/products/price-update",
};
const supplierRoutes: Record<string, string> = {
  "Supplier List": "/suppliers",
  "Add Supplier": "/suppliers/add",
  "Supplier Ledger": "/suppliers/ledger",
};
const customerRoutes: Record<string, string> = {
  "Customer List": "/customers",
  "Add Customer": "/customers/add",
  "Customer Ledger": "/customers/ledger",
  "Loyalty Points": "/customers/loyalty",
};
const bottomItems = [
  { label: "Reports", icon: "document-text-outline" },
  { label: "Expenses", icon: "wallet-outline" },
  { label: "Users & Roles", icon: "person-outline" },
  { label: "Settings", icon: "settings-outline" },
];

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const translateX = useRef(new Animated.Value(MENU_WIDTH)).current;
  const [productsOpen, setProductsOpen] = useState(true);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : MENU_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <SafeAreaView className="absolute pt-5 inset-0 flex-row z-50">
      {/* Overlay */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      {/* Slide panel */}
      <Animated.View
        style={{ width: MENU_WIDTH, transform: [{ translateX }] }}
        className="bg-[#0F1B2D] h-full py-6 px-4"
      >
        <View className="flex-row items-center mb-8 px-2">
          <Ionicons name="storefront-outline" size={22} color="#3B82F6" />
          <Text className="text-white font-bold text-lg ml-2">POS SYSTEM</Text>
        </View>

        {/* Dashboard, POS */}
        {menuItems.slice(0, 2).map((item) => (
          <TouchableOpacity
            key={item.label}
            className="flex-row items-center py-3 px-2 rounded-lg mb-1"
          >
            <Ionicons name={item.icon as any} size={18} color="#9CA3AF" />
            <Text className="text-gray-300 ml-3 text-sm">{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Products - expandable */}
        <TouchableOpacity
          onPress={() => setProductsOpen(!productsOpen)}
          className="flex-row items-center justify-between py-3 px-2 rounded-lg bg-blue-600 mb-1"
        >
          <View className="flex-row items-center">
            <Ionicons name="cube-outline" size={18} color="#fff" />
            <Text className="text-white ml-3 text-sm font-medium">
              Products
            </Text>
          </View>
          <Ionicons
            name={productsOpen ? "chevron-up" : "chevron-down"}
            size={14}
            color="#fff"
          />
        </TouchableOpacity>

        {productsOpen &&
          productSubItems.map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => {
                onClose();
                const route = productRoutes[sub];
                if (route) {
                  router.push(route as any);
                }
              }}
              className="py-2.5 pl-10 pr-2 rounded-lg mb-1"
            >
              <Text className="text-gray-400 text-sm">{sub}</Text>
            </TouchableOpacity>
          ))}

        {/* Inventory, Purchase */}
        {menuItems.slice(2).map((item) => (
          <TouchableOpacity
            key={item.label}
            className="flex-row items-center py-3 px-2 rounded-lg mb-1"
          >
            <Ionicons name={item.icon as any} size={18} color="#9CA3AF" />
            <Text className="text-gray-300 ml-3 text-sm">{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Suppliers - expandable */}
        <TouchableOpacity
          onPress={() => setSuppliersOpen(!suppliersOpen)}
          className="flex-row items-center justify-between py-3 px-2 rounded-lg bg-blue-600 mb-1"
        >
          <View className="flex-row items-center">
            <Ionicons name="people-circle-outline" size={18} color="#fff" />
            <Text className="text-white ml-3 text-sm font-medium">
              Suppliers
            </Text>
          </View>
          <Ionicons
            name={suppliersOpen ? "chevron-up" : "chevron-down"}
            size={14}
            color="#fff"
          />
        </TouchableOpacity>

        {suppliersOpen &&
          supplierSubItems.map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => {
                onClose();
                const route = supplierRoutes[sub];
                if (route) {
                  router.push(route as any);
                }
              }}
              className="py-2.5 pl-10 pr-2 rounded-lg mb-1"
            >
              <Text className="text-gray-400 text-sm">{sub}</Text>
            </TouchableOpacity>
          ))}

        {/* Customers - expandable */}
        <TouchableOpacity
          onPress={() => setCustomersOpen(!customersOpen)}
          className="flex-row items-center justify-between py-3 px-2 rounded-lg bg-blue-600 mb-1"
        >
          <View className="flex-row items-center">
            <Ionicons name="people-circle-outline" size={18} color="#fff" />
            <Text className="text-white ml-3 text-sm font-medium">
              Customers
            </Text>
          </View>
          <Ionicons
            name={customersOpen ? "chevron-up" : "chevron-down"}
            size={14}
            color="#fff"
          />
        </TouchableOpacity>

        {customersOpen &&
          customerSubItems.map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => {
                onClose();
                const route = customerRoutes[sub];
                if (route) {
                  router.push(route as any);
                }
              }}
              className="py-2.5 pl-10 pr-2 rounded-lg mb-1"
            >
              <Text className="text-gray-400 text-sm">{sub}</Text>
            </TouchableOpacity>
          ))}

        {bottomItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            className="flex-row items-center py-3 px-2 rounded-lg mb-1"
          >
            <Ionicons name={item.icon as any} size={18} color="#9CA3AF" />
            <Text className="text-gray-300 ml-3 text-sm">{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </SafeAreaView>
  );
}