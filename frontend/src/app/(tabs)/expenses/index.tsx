import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ExpenseRow from "../../../components/ExpenseRow";
import SideMenu from "../../../components/SideMenu";
import Dropdown from "../../../components/Dropdown";
import ExpenseDonutChart from "../../../components/ExpenseDonutChart";
import {
  getExpenses,
  getExpenseSummary,
  getExpenseCategories,
  getExpenseByCategory,
  deleteExpense,
  ExpenseListItem,
  ExpenseSummary,
  ExpenseByCategory,
  Lookup,
} from "../../../services/expenseApi";

const ALL_ID = -1;
const PAYMENT_METHODS = [
  { id: 0, name: "All" },
  { id: 1, name: "Cash" },
  { id: 2, name: "Bank Transfer" },
  { id: 3, name: "Credit Card" },
];

export default function ExpensesListScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilterId, setCategoryFilterId] = useState<number>(ALL_ID);
  const [paymentFilterId, setPaymentFilterId] = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);
  const [breakdown, setBreakdown] = useState<ExpenseByCategory[]>([]);

  const buildFilters = () => ({
    category_id: categoryFilterId !== ALL_ID ? categoryFilterId : undefined,
    payment_method:
      paymentFilterId !== 0
        ? PAYMENT_METHODS.find((p) => p.id === paymentFilterId)?.name
        : undefined,
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const filters = buildFilters();
      const [expData, summaryData, catData, breakdownData] = await Promise.all([
        getExpenses(filters),
        getExpenseSummary(filters),
        getExpenseCategories(),
        getExpenseByCategory(),
      ]);

      setExpenses(expData);
      setSummary(summaryData);
      setCategories(catData);
      setBreakdown(breakdownData);
    } catch (err) {
      console.error(err);
      setError("Couldn't load expenses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilterId, paymentFilterId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(id);
              setExpenses((prev) => prev.filter((e) => e.ExpenseID !== id));
              fetchData();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete expense.");
            }
          },
        },
      ],
    );
  };

  const hasActiveFilters = categoryFilterId !== ALL_ID || paymentFilterId !== 0;

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
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Expenses List
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/expenses/add")}>
          <View className="bg-blue-600 rounded-xl px-3 py-2 flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-medium ml-1">
              Add Expense
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      {summary && (
        <View className="px-4 pt-3">
          <View className="flex-row flex-wrap justify-between">
            <View className="bg-purple-50 rounded-xl p-3 mb-3 w-[48%]">
              <Ionicons name="cash-outline" size={18} color="#7C3AED" />
              <Text className="text-xs text-gray-500 mt-1.5">
                Total Expenses
              </Text>
              <Text className="text-base font-bold text-gray-900">
                ৳ {summary.TotalExpenses.toFixed(2)}
              </Text>
            </View>

            <View className="bg-green-50 rounded-xl p-3 mb-3 w-[48%]">
              <Ionicons name="receipt-outline" size={18} color="#16A34A" />
              <Text className="text-xs text-gray-500 mt-1.5">Transactions</Text>
              <Text className="text-base font-bold text-gray-900">
                {summary.TotalTransactions}
              </Text>
            </View>

            <View className="bg-orange-50 rounded-xl p-3 mb-3 w-[48%]">
              <Ionicons name="calculator-outline" size={18} color="#F59E0B" />
              <Text className="text-xs text-gray-500 mt-1.5">Average</Text>
              <Text className="text-base font-bold text-gray-900">
                ৳ {summary.AverageExpense.toFixed(2)}
              </Text>
            </View>

            <View className="bg-red-50 rounded-xl p-3 mb-3 w-[48%]">
              <Ionicons name="flame-outline" size={18} color="#EF4444" />
              <Text className="text-xs text-gray-500 mt-1.5">Highest</Text>
              <Text className="text-base font-bold text-gray-900">
                ৳ {summary.HighestExpenseAmount.toFixed(2)}
              </Text>
              {summary.HighestExpenseCategory && (
                <Text className="text-xs text-gray-400">
                  {summary.HighestExpenseCategory}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity
            onPress={fetchData}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.ExpenseID)}
          renderItem={({ item }) => (
            <ExpenseRow expense={item} onDeleted={handleDelete} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              {breakdown.length > 0 && (
                <View className="mt-1 mb-2">
                  <ExpenseDonutChart
                    data={breakdown}
                    total={breakdown.reduce(
                      (sum, item) => sum + Number(item.Amount),
                      0,
                    )}
                  />
                </View>
              )}

              <View className="flex-row items-center justify-between mt-1 mb-2">
                <Text className="text-sm text-gray-500">
                  {expenses.length} expenses
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowFilter(true)}
                  className={`flex-row items-center border rounded-lg px-3 py-1.5 ${
                    hasActiveFilters ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <Ionicons
                    name="filter"
                    size={14}
                    color={hasActiveFilters ? "#3B82F6" : "#374151"}
                  />
                  <Text
                    className={`text-xs ml-1 ${hasActiveFilters ? "text-blue-600" : "text-gray-600"}`}
                  >
                    Filter
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No expenses found
            </Text>
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
        />
      )}

      {/* Filter modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-6"
          onPress={() => setShowFilter(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-full max-w-sm p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-semibold text-gray-900">
                Filter Expenses
              </Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Dropdown
              label="Category"
              placeholder="All categories"
              options={[{ id: ALL_ID, name: "All" }, ...categories]}
              selectedId={categoryFilterId}
              onSelect={setCategoryFilterId}
            />
            <Dropdown
              label="Payment Method"
              placeholder="All"
              options={PAYMENT_METHODS}
              selectedId={paymentFilterId}
              onSelect={setPaymentFilterId}
            />

            <TouchableOpacity
              onPress={() => {
                setShowFilter(false);
                fetchData();
              }}
              className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
            >
              <Text className="text-white font-semibold">Apply Filter</Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={() => {
                  setCategoryFilterId(ALL_ID);
                  setPaymentFilterId(0);
                }}
                className="items-center mt-3"
              >
                <Text className="text-gray-500 text-sm">Clear Filter</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}
