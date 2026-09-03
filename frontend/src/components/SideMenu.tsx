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
  Alert,
} from "react-native";
import { logout, getStoredPermissions } from "../services/authApi";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.75;

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

// ============================================
// SUB-ITEM LISTS
// ============================================
const productSubItems = [
  "Product List", "Add Product", "Categories", "Brands", "Units",
  "Barcode Labels", "Price Update", "Bulk Price Update",
];
const inventorySubItems = [
  "Current Stock", "Stock In", "Stock Out", "Stock Adjustment", "Low Stock Alert", "Stock Count",
];
const purchaseSubItems = ["Purchase List", "New Purchase", "Purchase Returns", "Supplier Dues"];
const supplierSubItems = ["Supplier List", "Add Supplier", "Supplier Ledger"];
const customerSubItems = ["Customer List", "Add Customer", "Customer Ledger", "Loyalty Points"];
const usersRolesSubItems = ["Users", "Roles", "Permissions", "Activity Log"];
const settingsSubItems = ["Company Info", "Branch / Outlet", "Tax & VAT", "Invoice Template", "Backup & Restore"];

// ============================================
// ROUTES
// ============================================
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
const inventoryRoutes: Record<string, string> = {
  "Current Stock": "/inventory/current-stock",
  "Stock In": "/inventory/stock-in",
  "Stock Out": "/inventory/stock-out",
  "Stock Adjustment": "/inventory/stock-adjustment",
  "Low Stock Alert": "/inventory/low-stock",
  "Stock Count": "/inventory/stock-count",
};
const purchaseRoutes: Record<string, string> = {
  "Purchase List": "/purchases",
  "New Purchase": "/purchases/add",
  "Purchase Returns": "/purchases/returns",
  "Supplier Dues": "/purchases/supplier-dues",
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
const usersRolesRoutes: Record<string, string> = {
  Users: "/users",
  Roles: "/users/roles",
  Permissions: "/users/permissions",
  "Activity Log": "/users-roles/activity-log",
};
const settingsRoutes: Record<string, string> = {
  "Company Info": "/settings/company-info",
  "Branch / Outlet": "/settings/branches",
  "Tax & VAT": "/settings/tax-vat",
  "Invoice Template": "/settings/invoice-template",
  "Backup & Restore": "/settings/backup-restore",
};

// ============================================
// PERMISSION KEY MAPS — exact key required per sub-item
// ============================================
const productSubItemPermissions: Record<string, string> = {
  "Product List": "products.list",
  "Add Product": "products.add",
  Categories: "products.categories",
  Brands: "products.brands",
  Units: "products.units",
  "Barcode Labels": "products.barcode_labels",
  "Price Update": "products.price_update",
  "Bulk Price Update": "products.bulk_price_update",
};
const inventorySubItemPermissions: Record<string, string> = {
  "Current Stock": "inventory.current_stock",
  "Stock In": "inventory.stock_in",
  "Stock Out": "inventory.stock_out",
  "Stock Adjustment": "inventory.stock_adjustment",
  "Low Stock Alert": "inventory.low_stock_alert",
  "Stock Count": "inventory.stock_count",
};
const purchaseSubItemPermissions: Record<string, string> = {
  "Purchase List": "purchase.list",
  "New Purchase": "purchase.new",
  "Purchase Returns": "purchase.returns",
  "Supplier Dues": "purchase.supplier_dues",
};
const supplierSubItemPermissions: Record<string, string> = {
  "Supplier List": "suppliers.list",
  "Add Supplier": "suppliers.add",
  "Supplier Ledger": "suppliers.ledger",
};
const customerSubItemPermissions: Record<string, string> = {
  "Customer List": "customers.list",
  "Add Customer": "customers.add",
  "Customer Ledger": "customers.ledger",
  "Loyalty Points": "customers.loyalty",
};
const usersRolesSubItemPermissions: Record<string, string> = {
  Users: "users_roles.users",
  Roles: "users_roles.roles",
  Permissions: "users_roles.permissions",
  "Activity Log": "users_roles.activity_log",
};
const settingsSubItemPermissions: Record<string, string> = {
  "Company Info": "settings.company_info",
  "Branch / Outlet": "settings.branches",
  "Tax & VAT": "settings.tax_vat",
  "Invoice Template": "settings.invoice_template",
  "Backup & Restore": "settings.backup_restore",
};

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const translateX = useRef(new Animated.Value(MENU_WIDTH)).current;
  const [productsOpen, setProductsOpen] = useState(true);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [usersRolesOpen, setUsersRolesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      (async () => {
        const perms = await getStoredPermissions();
        setPermissions(perms);
      })();
    }
  }, [visible]);

  const hasPermission = (key: string) => permissions.includes(key);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          onClose();
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : MENU_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  // Reusable renderer for an expandable section, filtered by exact permission keys
  const renderSection = (
    title: string,
    icon: string,
    isOpen: boolean,
    setOpen: (v: boolean) => void,
    subItems: string[],
    permMap: Record<string, string>,
    routeMap: Record<string, string>,
  ) => {
    const visibleItems = subItems.filter((sub) => hasPermission(permMap[sub]));
    if (visibleItems.length === 0) return null;

    return (
      <>
        <TouchableOpacity
          onPress={() => setOpen(!isOpen)}
          className={`flex-row items-center justify-between py-3 px-2 rounded-lg mb-1 ${
            isOpen ? "bg-blue-600" : ""
          }`}
        >
          <View className="flex-row items-center">
            <Ionicons name={icon as any} size={18} color="#fff" />
            <Text className="text-white ml-3 text-sm font-medium">{title}</Text>
          </View>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={14} color="#fff" />
        </TouchableOpacity>

        {isOpen &&
          visibleItems.map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => {
                onClose();
                const route = routeMap[sub];
                if (route) router.push(route as any);
              }}
              className="py-2.5 pl-10 pr-2 rounded-lg mb-1"
            >
              <Text className="text-gray-400 text-sm">{sub}</Text>
            </TouchableOpacity>
          ))}
      </>
    );
  };

  return (
    <SafeAreaView className="absolute pt-5 inset-0 flex-row z-50">
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <Animated.View
        style={{ width: MENU_WIDTH, transform: [{ translateX }] }}
        className="bg-[#0F1B2D] h-full py-6 px-4"
      >
        <View className="flex-row items-center mb-8 px-2">
          <Ionicons name="storefront-outline" size={22} color="#3B82F6" />
          <Text className="text-white font-bold text-lg ml-2">POS SYSTEM</Text>
        </View>
        <ScrollView>
          {hasPermission("dashboard.view") && (
            <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg mb-1">
              <Ionicons name="home-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-300 ml-3 text-sm">Dashboard</Text>
            </TouchableOpacity>
          )}

          {permissions.some((p) => p.startsWith("pos.")) && (
            <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg mb-1">
              <Ionicons name="card-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-300 ml-3 text-sm">POS</Text>
            </TouchableOpacity>
          )}

          {renderSection("Products", "cube-outline", productsOpen, setProductsOpen, productSubItems, productSubItemPermissions, productRoutes)}
          {renderSection("Inventory", "layers-outline", inventoryOpen, setInventoryOpen, inventorySubItems, inventorySubItemPermissions, inventoryRoutes)}
          {renderSection("Purchase", "cart-outline", purchaseOpen, setPurchaseOpen, purchaseSubItems, purchaseSubItemPermissions, purchaseRoutes)}
          {renderSection("Suppliers", "people-circle-outline", suppliersOpen, setSuppliersOpen, supplierSubItems, supplierSubItemPermissions, supplierRoutes)}
          {renderSection("Customers", "people-circle-outline", customersOpen, setCustomersOpen, customerSubItems, customerSubItemPermissions, customerRoutes)}
          {renderSection("Users & Roles", "person-outline", usersRolesOpen, setUsersRolesOpen, usersRolesSubItems, usersRolesSubItemPermissions, usersRolesRoutes)}

          {hasPermission("reports.view") && (
            <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg mb-1">
              <Ionicons name="document-text-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-300 ml-3 text-sm">Reports</Text>
            </TouchableOpacity>
          )}

          {hasPermission("expenses.view") && (
            <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg mb-1">
              <Ionicons name="wallet-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-300 ml-3 text-sm">Expenses</Text>
            </TouchableOpacity>
          )}

          {renderSection("Settings", "settings-outline", settingsOpen, setSettingsOpen, settingsSubItems, settingsSubItemPermissions, settingsRoutes)}

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center py-3 px-2 rounded-lg mb-1 mt-2"
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text className="text-red-400 ml-3 text-sm font-medium">Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}