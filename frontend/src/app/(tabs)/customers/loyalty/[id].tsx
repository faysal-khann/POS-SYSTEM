import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import Dropdown from "../../../../components/Dropdown";
import { usePagination } from "../../../../hooks/usePagination";
import {
  getLoyaltySummary,
  getLoyaltyHistory,
  adjustLoyaltyPoints,
  LoyaltySummaryItem,
  LoyaltyHistoryItem,
} from "../../../../services/loyaltyApi";
import { getStoredUser } from "../../../../services/authApi";

const ACTION_TYPES = [
  { id: 1, name: "Earn" },
  { id: 2, name: "Redeem" },
  { id: 3, name: "Adjust" },
];

const fmt = (n: number) => String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const badgeColor = (type: string) => {
  if (type === "Earn") return "bg-green-100 text-green-700";
  if (type === "Redeem") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
};

export default function LoyaltyAdjustHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [customers, setCustomers] = useState<LoyaltySummaryItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(Number(id));
  const [history, setHistory] = useState<LoyaltyHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionType, setActionType] = useState<number>(1);
  const [points, setPoints] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async (customerId: number) => {
    try {
      setError(null);
      const [summary, hist] = await Promise.all([
        getLoyaltySummary(),
        getLoyaltyHistory(customerId),
      ]);
      setCustomers(summary);
      setHistory(hist);
    } catch (err) {
      console.error(err);
      setError("Couldn't load loyalty details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll(selectedCustomerId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomerId]),
  );

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        id: c.CustomerId,
        name: `${c.CustomerCode} - ${c.CustomerName}`,
      })),
    [customers],
  );

  const activeCustomer = useMemo(
    () => customers.find((c) => c.CustomerId === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  const {
    currentPage,
    totalPages,
    pageSize,
    paginatedData,
    nextPage,
    prevPage,
  } = usePagination(history, 5, selectedCustomerId);

  const startIndex = history.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, history.length);

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setLoading(true);
    fetchAll(customerId);
  };

  const handleSave = async () => {
    const pointsValue = Number(points);

    if (!selectedCustomerId) {
      Alert.alert("Missing field", "Please select a customer.");
      return;
    }
    if (!points.trim() || Number.isNaN(pointsValue) || pointsValue <= 0) {
      Alert.alert("Missing field", "Enter a valid points value.");
      return;
    }

    const actionName = ACTION_TYPES.find((a) => a.id === actionType)?.name as
      | "Earn"
      | "Redeem"
      | "Adjust";

    try {
      setSaving(true);
      const user = await getStoredUser();

      await adjustLoyaltyPoints({
        CustomerID: selectedCustomerId,
        ActionType: actionName,
        Points: pointsValue,
        Description: description.trim() || undefined,
        CreatedByUserID: user?.UserID,
      });

      setPoints("");
      setDescription("");
      await fetchAll(selectedCustomerId);

      Alert.alert("Success", "Points saved successfully.");
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.detail || "Couldn't save points. Check your connection.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
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
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Adjust / History
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="list-outline" size={14} color="#3B82F6" />
          <Text className="text-blue-600 text-sm font-medium ml-1.5">Back to List</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-3">{error}</Text>
          <TouchableOpacity
            onPress={() => fetchAll(selectedCustomerId)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Adjust Points
            </Text>

            <Dropdown
              label="Customer"
              placeholder="Select customer"
              options={customerOptions}
              selectedId={selectedCustomerId}
              onSelect={handleSelectCustomer}
              required
            />

            <View className="mb-4 bg-green-50 border border-green-100 rounded-xl px-3 py-3 flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Available Points</Text>
              <Text className="text-lg font-bold text-green-600">
                {fmt(activeCustomer?.AvailablePoints ?? 0)}
              </Text>
            </View>

            <Dropdown
              label="Action Type"
              placeholder="Select action"
              options={ACTION_TYPES}
              selectedId={actionType}
              onSelect={setActionType}
              required
            />

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Points <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={points}
                onChangeText={setPoints}
                placeholder="Enter points"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-green-600 rounded-xl py-3 flex-row items-center justify-center"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text className="text-white text-sm font-semibold ml-2">Save Points</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Points History
            </Text>

            {history.length === 0 ? (
              <Text className="text-center text-gray-400 py-6">No transactions yet</Text>
            ) : (
              <>
                <Text className="text-xs text-gray-500 mb-3">
                  Showing {startIndex} to {endIndex} of {history.length} entries
                </Text>

                {paginatedData.map((t) => (
                  <View key={t.LoyaltyTransactionID} className="border border-gray-100 rounded-xl p-3 mb-2">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-xs text-gray-400">
                        {new Date(t.Date).toLocaleDateString()}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${badgeColor(t.TransactionType).split(" ")[0]}`}>
                        <Text className={`text-xs font-medium ${badgeColor(t.TransactionType).split(" ")[1]}`}>
                          {t.TransactionType}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-gray-400">{t.RefNo}</Text>
                      <Text
                        className={`text-sm font-bold ${
                          t.Points >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.Points >= 0 ? "+" : "-"}
                        {fmt(t.Points)}
                      </Text>
                    </View>

                    {t.Description ? (
                      <Text className="text-sm text-gray-700 mb-1">{t.Description}</Text>
                    ) : null}

                    <Text className="text-xs text-gray-400">By {t.By || "—"}</Text>
                  </View>
                ))}

                {totalPages > 1 && (
                  <View className="flex-row items-center justify-between mt-2">
                    <TouchableOpacity
                      onPress={prevPage}
                      disabled={currentPage === 1}
                      className={`flex-row items-center px-3 py-2 rounded-lg border ${
                        currentPage === 1 ? "border-gray-100" : "border-gray-300"
                      }`}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={14}
                        color={currentPage === 1 ? "#D1D5DB" : "#4B5563"}
                      />
                      <Text
                        className={`text-xs font-medium ml-1 ${
                          currentPage === 1 ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Prev
                      </Text>
                    </TouchableOpacity>

                    <Text className="text-xs text-gray-500">
                      Page {currentPage} of {totalPages}
                    </Text>

                    <TouchableOpacity
                      onPress={nextPage}
                      disabled={currentPage === totalPages}
                      className={`flex-row items-center px-3 py-2 rounded-lg border ${
                        currentPage === totalPages ? "border-gray-100" : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium mr-1 ${
                          currentPage === totalPages ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Next
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={currentPage === totalPages ? "#D1D5DB" : "#4B5563"}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}