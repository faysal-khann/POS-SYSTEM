import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import Dropdown from "../../../components/Dropdown";
import ExpenseDonutChart from "../../../components/ExpenseDonutChart";
import {
  createExpense,
  createExpenseCategory,
  getExpenseCategories,
  getExpenseByCategory,
  Lookup,
  ExpenseByCategory,
  getNextExpenseNo,
} from "../../../services/expenseApi";
import { getSuppliers, Supplier } from "../../../services/supplierApi";
import { getStoredUser } from "../../../services/authApi";

const PAYMENT_METHODS: Lookup[] = [
  { id: 1, name: "Cash" },
  { id: 2, name: "Bank Transfer" },
  { id: 3, name: "Credit Card" },
  { id: 4, name: "Mobile Banking" },
];

export default function AddExpenseScreen() {
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [breakdown, setBreakdown] = useState<ExpenseByCategory[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [amount, setAmount] = useState("0");
  const [paymentMethodId, setPaymentMethodId] = useState<number | undefined>();
  const [referenceNo, setReferenceNo] = useState("");
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const STATUS_OPTIONS: Lookup[] = [
    { id: 1, name: "Paid" },
    { id: 2, name: "Incomplete" },
  ];
  const [statusId, setStatusId] = useState<number>(1);
  const [expenseNoPreview, setExpenseNoPreview] = useState(
    "Auto-generated on save",
  );
  useEffect(() => {
    getNextExpenseNo(expenseDate.toISOString().split("T")[0])
      .then(setExpenseNoPreview)
      .catch(() => setExpenseNoPreview("Auto-generated on save"));
  }, [expenseDate]);
  useEffect(() => {
    (async () => { 
      try {
        const [cat, sup, bd] = await Promise.all([
          getExpenseCategories(),
          getSuppliers(),
          getExpenseByCategory(),
        ]);
        setCategories(cat);
        setSuppliers(sup);
        setBreakdown(bd);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load categories/suppliers.");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Missing field", "Category name is required.");
      return;
    }
    try {
      setSavingCategory(true);
      const created = await createExpenseCategory(newCategoryName);
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.id);
      setShowAddCategory(false);
      setNewCategoryName("");
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.response?.data?.detail || "Couldn't create category.",
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!categoryId) {
      Alert.alert("Missing field", "Please select a Category.");
      return;
    }
    const amountVal = parseFloat(amount);
    if (!amountVal || amountVal <= 0) {
      Alert.alert("Missing field", "Please enter a valid Expense Amount.");
      return;
    }
    if (!paymentMethodId) {
      Alert.alert("Missing field", "Please select a Payment Method.");
      return;
    }

    const session = await getStoredUser();
    if (!session) {
      Alert.alert("Session error", "Please log in again.");
      return;
    }

    try {
      setSaving(true);
      await createExpense(
        {
          ExpenseDate: expenseDate.toISOString().split("T")[0],
          CategoryID: categoryId,
          Amount: amountVal,
          PaymentMethod:
            PAYMENT_METHODS.find((p) => p.id === paymentMethodId)?.name ??
            "Cash",
          ReferenceNo: referenceNo || undefined,
          SupplierID: supplierId,
          Description: description || undefined,
          Note: note || undefined,
          IsRecurring: isRecurring,
          Status: STATUS_OPTIONS.find((s) => s.id === statusId)?.name ?? "Paid",
        },
        session.CompanyID,
        session.PrimaryBranchID,
        session.UserID,
      );

      Alert.alert("Success", "Expense saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.response?.data?.detail || "Couldn't save expense.",
      );
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

  const breakdownTotal = breakdown.reduce((s, d) => s + d.Amount, 0);
  const supplierOptions: Lookup[] = suppliers.map((s) => ({
    id: s.SupplierId,
    name: s.SupplierName,
  }));

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Add Expense
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-medium ml-1.5">
                Save Expense
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Expense Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Date <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-white"
          >
            <Text className="text-sm text-gray-800">
              {expenseDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (e.type === "set" && d) setExpenseDate(d);
              }}
            />
          )}
        </View>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Expense No
          </Text>
          <View className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-100">
            <Text className="text-sm text-gray-700 font-medium">
              {expenseNoPreview}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="flex-1 mr-2">
            <Dropdown
              label="Category"
              placeholder="Select Category"
              required
              options={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowAddCategory(true)}
            className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mt-[24px]"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Expense Amount (৳) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <Dropdown
          label="Payment Method"
          placeholder="Select Payment Method"
          required
          options={PAYMENT_METHODS}
          selectedId={paymentMethodId}
          onSelect={setPaymentMethodId}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter expense description"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <Text className="text-base font-semibold text-gray-900 mb-3 mt-2">
          Other Information
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Reference No
          </Text>
          <TextInput
            value={referenceNo}
            onChangeText={setReferenceNo}
            placeholder="Enter reference number"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <Dropdown
          label="Supplier (Optional)"
          placeholder="Select supplier"
          options={supplierOptions}
          selectedId={supplierId}
          onSelect={setSupplierId}
        />

        <Dropdown
          label="Status"
          placeholder="Select status"
          required
          options={STATUS_OPTIONS}
          selectedId={statusId}
          onSelect={setStatusId}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Enter notes (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <TouchableOpacity
          onPress={() => setIsRecurring(!isRecurring)}
          className="flex-row items-center mb-6"
        >
          <Ionicons
            name={isRecurring ? "checkbox" : "square-outline"}
            size={20}
            color={isRecurring ? "#3B82F6" : "#9CA3AF"}
          />
          <Text className="text-sm text-gray-700 ml-2">Recurring Expense</Text>
        </TouchableOpacity>

        {breakdown.length > 0 && (
          <ExpenseDonutChart data={breakdown} total={breakdownTotal} />
        )}
      </ScrollView>

      {showAddCategory && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Add Category
              </Text>
              <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Category Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Enter category name"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddCategory}
              disabled={savingCategory}
              className="bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
            >
              {savingCategory ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Save Category</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
