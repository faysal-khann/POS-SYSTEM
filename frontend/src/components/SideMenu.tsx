import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  Dimensions,
  ScrollView,
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
];

const productSubItems = [
  "Product List",
  "Add Product",
  "Categories",
  "Brands",
  "Units",
  "Barcode Labels",
  "Price Update",
  "Bulk Price Update",
];

const purchaseSubItems = [
  "Purchase List",
  "New Purchase",
  "Purchase Returns",
  "Supplier Dues",
];
const supplierSubItems = ["Supplier List", "Add Supplier", "Supplier Ledger"];
const customerSubItems = [
  "Customer List",
  "Add Customer",
  "Customer Ledger",
  "Loyalty Points",
];

const inventorySubItems = [
  "Current Stock",
  "Stock In",
  "Stock Out",
  "Stock Adjustment",
  "Low Stock Alert",
  "Stock Count",
];

const inventoryRoutes: Record<string, string> = {
  "Current Stock": "/inventory/current-stock",
  "Stock In": "/inventory/stock-in",
  "Stock Out": "/inventory/stock-out",
  "Stock Adjustment": "/inventory/stock-adjustment",
  "Low Stock Alert": "/inventory/low-stock",
  "Stock Count": "/inventory/stock-count",
};

const productRoutes: Record<string, string> = {
  "Product List": "/products",
  "Add Product": "/products/add",
  Categories: "/products/categories",
  Brands: "/products/brands",
  Units: "/products/units",
  "Barcode Labels": "/products/barcode-labels",
  "Price Update": "/products/price-update",
  "Bulk Price Update": "/products/bulk-price-update",
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

const purchaseRoutes: Record<string, string> = {
  "Purchase List": "/purchases",
  "New Purchase": "/purchases/add",
  "Purchase Returns": "/purchases/returns",
  "Supplier Dues": "/purchases/supplier-dues",
};

const bottomItems = [
  { label: "Reports", icon: "document-text-outline" },
  { label: "Expenses", icon: "wallet-outline" },
  { label: "Users & Roles", icon: "person-outline" },
  { label: "Settings", icon: "settings-outline" },
];
const usersRolesSubItems = ["Users", "Roles", "Permissions", "Activity Log"];

const usersRolesRoutes: Record<string, string> = {
  Users: "/users",
  Roles: "/users-roles/roles",
  Permissions: "/users-roles/permissions",
  "Activity Log": "/users-roles/activity-log",
};
export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const translateX = useRef(new Animated.Value(MENU_WIDTH)).current;
  const [productsOpen, setProductsOpen] = useState(true);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [usersRolesOpen, setUsersRolesOpen] = useState(false);
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
        <ScrollView>
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
            className={`flex-row items-center justify-between py-3 px-2 rounded-lg  mb-1 ${
              productsOpen ? "bg-blue-600" : ""
            }`}
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

          {/* Inventory - expandable */}
          <TouchableOpacity
            onPress={() => setInventoryOpen(!inventoryOpen)}
            className={`flex-row items-center justify-between py-3 px-2 rounded-lg mb-1 ${
              inventoryOpen ? "bg-blue-600" : ""
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons name="layers-outline" size={18} color="#fff" />
              <Text className="text-white ml-3 text-sm font-medium">
                Inventory
              </Text>
            </View>

            <Ionicons
              name={inventoryOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color="#fff"
            />
          </TouchableOpacity>

          {inventoryOpen &&
            inventorySubItems.map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => {
                  onClose();

                  const route = inventoryRoutes[sub];

                  if (route) {
                    router.push(route as any);
                  }
                }}
                className="py-2.5 pl-10 pr-2 rounded-lg mb-1"
              >
                <Text className="text-gray-400 text-sm">{sub}</Text>
              </TouchableOpacity>
            ))}

          {/* Purchase - expandable */}
          <TouchableOpacity
            onPress={() => setPurchaseOpen(!purchaseOpen)}
            className={`flex-row items-center justify-between py-3 px-2 rounded-lg mb-1 ${
              purchaseOpen ? "bg-blue-600" : ""
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text className="text-white ml-3 text-sm font-medium">
                Purchase
              </Text>
            </View>
            <Ionicons
              name={purchaseOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color="#fff"
            />
          </TouchableOpacity>

          {purchaseOpen &&
            purchaseSubItems.map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => {
                  onClose();
                  const route = purchaseRoutes[sub];
                  if (route) {
                    router.push(route as any);
                  }
                }}
                className="py-2.5 pl-10 pr-2 rounded-lg mb-1"
              >
                <Text className="text-gray-400 text-sm">{sub}</Text>
              </TouchableOpacity>
            ))}

          {/* Suppliers - expandable */}
          <TouchableOpacity
            onPress={() => setSuppliersOpen(!suppliersOpen)}
            className={`flex-row items-center justify-between py-3 px-2 rounded-lg mb-1 ${
              suppliersOpen ? "bg-blue-600" : ""
            }`}
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
            className={`flex-row items-center justify-between py-3 px-2 rounded-lg mb-1 ${
              customersOpen ? "bg-blue-600" : ""
            }`}
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

          {/* Users & Roles - expandable */}
          <TouchableOpacity
            onPress={() => setUsersRolesOpen(!usersRolesOpen)}
            className={`flex-row items-center justify-between py-3 px-2 rounded-lg mb-1 ${
              usersRolesOpen ? "bg-blue-600" : ""
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={18} color="#fff" />
              <Text className="text-white ml-3 text-sm font-medium">
                Users & Roles
              </Text>
            </View>
            <Ionicons
              name={usersRolesOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color="#fff"
            />
          </TouchableOpacity>

          {usersRolesOpen &&
            usersRolesSubItems.map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => {
                  onClose();
                  const route = usersRolesRoutes[sub];
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
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
