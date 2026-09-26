import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import SideMenu from "../../../../components/SideMenu";
import Dropdown from "../../../../components/Dropdown";
import { getAllCashiers } from "../../../../services/saleApi";
import { getStoredUser } from "../../../../services/authApi";
import {
  getShiftSummary,
  closeShift,
  ShiftSummary,
} from "../../../../services/cashierShiftApi";

const SHIFTS = [
  { id: 1, label: "Morning Shift", name: "Morning Shift (08:00 AM - 04:00 PM)", startHour: 8, endHour: 16 },
  { id: 2, label: "Evening Shift", name: "Evening Shift (04:00 PM - 12:00 AM)", startHour: 16, endHour: 24 },
  { id: 3, label: "Full Day", name: "Full Day (12:00 AM - 12:00 AM)", startHour: 0, endHour: 24 },
];

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const money = (n: number) => `৳ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const EMPTY_SUMMARY: ShiftSummary = {
  TotalSales: 0,
  TotalReturns: 0,
  NetSales: 0,
  TotalReceived: 0,
  CashSales: 0,
  CashRefunds: 0,
};

export default function CashierShiftScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Shift information
  const [cashiers, setCashiers] = useState<{ id: number; name: string }[]>([]);
  const [cashierId, setCashierId] = useState<number | undefined>();
  const [shiftDate, setShiftDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shiftId, setShiftId] = useState<number>(1);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [note, setNote] = useState("");

  // Summary + closing
  const [summary, setSummary] = useState<ShiftSummary>(EMPTY_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // null = "not typed yet", so the field follows the calculated balance
  const [actualInput, setActualInput] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const requestId = useRef(0);
  const shift = SHIFTS.find((s) => s.id === shiftId)!;

  // Shift window as UTC timestamps (sales are stored in UTC)
  const getWindow = useCallback(() => {
    const y = shiftDate.getFullYear();
    const m = shiftDate.getMonth();
    const d = shiftDate.getDate();
    const s = SHIFTS.find((x) => x.id === shiftId)!;
    return {
      start: new Date(y, m, d, s.startHour, 0, 0, 0).toISOString(),
      end: new Date(y, m, d, s.endHour, 0, 0, 0).toISOString(), // hour 24 rolls to next midnight
    };
  }, [shiftDate, shiftId]);

  // Initial load: logged-in user + cashier list
  useEffect(() => {
    (async () => {
      try {
        const [user, list] = await Promise.all([getStoredUser(), getAllCashiers()]);
        setSession(user);
        setCashiers(list);
        if (user) setCashierId(user.UserID);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load cashier data.");
      }
    })();
  }, []);

  const loadSummary = useCallback(
    async (isRefresh = false) => {
      if (!session || !cashierId) return;
      const myRequest = ++requestId.current;
      try {
        isRefresh ? setRefreshing(true) : setLoadingSummary(true);
        setSummaryError(null);
        const { start, end } = getWindow();
        const data = await getShiftSummary({
          user_id: cashierId,
          branch_id: session.PrimaryBranchID,
          start,
          end,
        });
        if (myRequest === requestId.current) setSummary(data);
      } catch (err) {
        console.error(err);
        if (myRequest === requestId.current) {
          setSummaryError("Couldn't load the shift summary.");
        }
      } finally {
        if (myRequest === requestId.current) {
          setLoadingSummary(false);
          setRefreshing(false);
        }
      }
    },
    [session, cashierId, getWindow],
  );

  // Reload whenever cashier / date / shift changes; typed closing amount is reset
  useEffect(() => {
    setActualInput(null);
    loadSummary();
  }, [loadSummary]);

  const opening = parseFloat(openingBalance) || 0;
  const calculated = useMemo(
    () => Math.round((opening + summary.CashSales - summary.CashRefunds) * 100) / 100,
    [opening, summary],
  );
  const actualText = actualInput ?? calculated.toFixed(2);
  const actual = parseFloat(actualText) || 0;
  const difference = Math.round((actual - calculated) * 100) / 100;

  const diffState =
    difference === 0
      ? { text: "text-green-600", box: "bg-green-50 border-green-200", note: "" }
      : difference < 0
        ? { text: "text-red-600", box: "bg-red-50 border-red-200", note: "Short" }
        : { text: "text-amber-600", box: "bg-amber-50 border-amber-200", note: "Over" };

  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/pos" as any);
  };

  const submitClose = async () => {
    if (!session || !cashierId) return;
    try {
      setSaving(true);
      const { start, end } = getWindow();
      const result = await closeShift({
        CompanyID: session.CompanyID,
        BranchID: session.PrimaryBranchID,
        UserID: cashierId,
        ClosedByUserID: session.UserID,
        ShiftName: shift.label,
        ShiftDate: toYmd(shiftDate),
        WindowStart: start,
        WindowEnd: end,
        OpeningBalance: opening,
        ActualClosing: actual,
        Note: note.trim() || undefined,
      });
      Alert.alert(
        "Shift Closed",
        `Expected: ${money(result.CalculatedClosing)}\nCounted: ${money(result.ActualClosing)}\nDifference: ${money(result.Difference)}`,
        [{ text: "OK", onPress: () => router.replace("/pos" as any) }],
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.detail || "Couldn't close the shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!cashierId) {
      Alert.alert("Select cashier", "Please choose a cashier.");
      return;
    }
    if (summaryError || loadingSummary) {
      Alert.alert("Not ready", "Wait for the shift summary to load first.");
      return;
    }
    const diffLine =
      difference === 0
        ? "No difference."
        : `${diffState.note} by ${money(Math.abs(difference))}.`;
    Alert.alert(
      "Close Shift",
      `${shift.label} · ${formatDate(shiftDate)}\nExpected ${money(calculated)}, counted ${money(actual)}.\n${diffLine}\n\nThis can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Close Shift", style: "destructive", onPress: submitClose },
      ],
    );
  };

  const SummaryRow = ({
    label,
    value,
    bold,
    valueClass,
  }: {
    label: string;
    value: string;
    bold?: boolean;
    valueClass?: string;
  }) => (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <Text className={`text-sm ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
        {label}
      </Text>
      <Text className={`text-sm ${bold ? "font-bold" : "font-medium"} ${valueClass ?? "text-gray-900"}`}>
        {value}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">Cashier Shift</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSummary(true)} />
        }
      >
        {/* ---------- Shift Information ---------- */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Shift Information</Text>

          <Dropdown
            label="Cashier"
            placeholder="Select cashier"
            options={cashiers}
            selectedId={cashierId}
            onSelect={setCashierId}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Shift Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-white"
            >
              <Text className="text-sm text-gray-800">{formatDate(shiftDate)}</Text>
              <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={shiftDate}
                mode="date"
                onChange={(e, d) => {
                  setShowDatePicker(false);
                  if (e.type === "set" && d) setShiftDate(d);
                }}
              />
            )}
          </View>

          <Dropdown
            label="Shift"
            placeholder="Select shift"
            options={SHIFTS.map((s) => ({ id: s.id, name: s.name }))}
            selectedId={shiftId}
            onSelect={setShiftId}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Opening Balance</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
              <Text className="text-sm text-gray-500 mr-2">৳</Text>
              <TextInput
                value={openingBalance}
                onChangeText={setOpeningBalance}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3 text-sm text-gray-800"
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Note (Optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Enter note"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
            />
          </View>
        </View>

        {/* ---------- Shift Summary ---------- */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">Shift Summary</Text>
            {loadingSummary && <ActivityIndicator size="small" color="#3B82F6" />}
          </View>

          {summaryError ? (
            <View className="items-center py-4">
              <Text className="text-red-500 text-sm mb-3">{summaryError}</Text>
              <TouchableOpacity
                onPress={() => loadSummary()}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <SummaryRow label="Total Sales" value={money(summary.TotalSales)} />
              <SummaryRow label="Total Returns" value={money(summary.TotalReturns)} />
              <SummaryRow label="Net Sales" value={money(summary.NetSales)} bold />
              <SummaryRow label="Total Received" value={money(summary.TotalReceived)} bold />
              <View className="flex-row justify-between items-center pt-3">
                <Text className="text-sm font-semibold text-gray-900">
                  Closing Balance (Calculated)
                </Text>
                <Text className="text-base font-bold text-green-600">{money(calculated)}</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-2">
                Opening + cash sales − cash refunds
              </Text>
            </>
          )}
        </View>

        {/* ---------- Cash Closing ---------- */}
        <View className="bg-white border border-gray-200 rounded-xl p-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Cash Closing</Text>

          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Closing Balance (Actual)
          </Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white mb-3">
            <Text className="text-sm text-gray-500 mr-2">৳</Text>
            <TextInput
              value={actualText}
              onChangeText={setActualInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-3 text-sm text-gray-800"
            />
          </View>

          <View className={`flex-row justify-between items-center border rounded-xl px-3 py-3 ${diffState.box}`}>
            <Text className="text-sm font-medium text-gray-700">
              Difference{diffState.note ? ` (${diffState.note})` : ""}
            </Text>
            <Text className={`text-base font-bold ${diffState.text}`}>
              {money(difference)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View className="flex-row px-4 pt-3 pb-8 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleCancel}
          className="flex-1 mr-2 border border-gray-300 rounded-xl py-3.5 items-center"
        >
          <Text className="text-gray-600 font-medium">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClose}
          disabled={saving}
          className="flex-[2] bg-green-600 rounded-xl py-3.5 items-center justify-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Close Shift</Text>
          )}
        </TouchableOpacity>
      </View>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}