import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getCustomerById, Customer } from "../../../../services/customerApi";

export default function CustomerViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // ============================================
  // FETCH CUSTOMER
  // ============================================

  const fetchCustomer = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const data = await getCustomerById(customerId);

      setCustomer(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load customer details.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // ============================================
  // GENERATE PDF
  // ============================================

  const handleDownloadPdf = async () => {
    if (!customer) return;

    try {
      setExporting(true);

      const html = generateCustomerHtml(customer);

      const { uri } = await Print.printToFileAsync({
        html,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${customer.CustomerCode} - Customer Details`,
        });
      } else {
        Alert.alert("Saved", `PDF saved to: ${uri}`);
      }
    } catch (err) {
      console.error(err);

      Alert.alert("Error", "Couldn't generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error || !customer) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-red-500 text-center mb-3">{error}</Text>

        <TouchableOpacity
          onPress={fetchCustomer}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================
  // ROW COMPONENT
  // ============================================

  const Row = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <View className="mb-3">
      <Text className="text-xs text-gray-400 mb-0.5">{label}</Text>

      <Text className="text-sm text-gray-800">
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </Text>
    </View>
  );

  // ============================================
  // UI
  // ============================================

  return (
    <View className="flex-1 bg-gray-50">
      {/* ========================================
          HEADER
      ======================================== */}

      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Customer Details
          </Text>
        </View>

        {/* PDF BUTTON */}

        <TouchableOpacity
          onPress={handleDownloadPdf}
          disabled={exporting}
          className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
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

      {/* ========================================
          CONTENT
      ======================================== */}

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* ======================================
            CUSTOMER NAME + STATUS
        ====================================== */}

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900">
            {customer.CustomerName}
          </Text>

          <View
            className={`px-2.5 py-1 rounded-full ${
              customer.Status === "Active" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                customer.Status === "Active" ? "text-green-700" : "text-red-700"
              }`}
            >
              {customer.Status}
            </Text>
          </View>
        </View>

        {/* ======================================
            BASIC INFORMATION
        ====================================== */}

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Basic Information
          </Text>

          <Row label="Customer Code" value={customer.CustomerCode} />

          <Row label="Customer Name" value={customer.CustomerName} />

          <Row label="Phone" value={customer.Phone} />

          <Row label="Email" value={customer.Email} />

          <Row label="Customer Group" value={customer.CustomerGroup} />
        </View>

        {/* ======================================
            PERSONAL INFORMATION
        ====================================== */}

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Personal Information
          </Text>
          <Row
            label="Date of Birth"
            value={customer.DateOfBirth || undefined}
          />

          <Row label="National ID / Tax ID" value={customer.NationalIdTaxId} />
        </View>

        {/* ======================================
            ADDRESS INFORMATION
        ====================================== */}

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Address Information
          </Text>

          <Row label="Address Line 1" value={customer.AddressLine1} />

          <Row label="Address Line 2" value={customer.AddressLine2} />

          <Row label="City" value={customer.City} />

          <Row label="State / Division" value={customer.StateDivision} />

          <Row label="Postal Code" value={customer.PostalCode} />

          <Row label="Country" value={customer.Country} />
        </View>

        {/* ======================================
            FINANCIAL INFORMATION
        ====================================== */}

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Financial Information
          </Text>

          <Row
            label="Opening Balance"
            value={`৳ ${Number(customer.OpeningBalance ?? 0).toLocaleString()}`}
          />

          <Row
            label="Credit Limit"
            value={`৳ ${Number(customer.CreditLimit ?? 0).toLocaleString()}`}
          />

          {customer.DueAmount !== undefined && (
            <Row
              label="Due Amount"
              value={`৳ ${Number(customer.DueAmount ?? 0).toLocaleString()}`}
            />
          )}
        </View>

        {/* ======================================
            NOTES
        ====================================== */}

        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Notes
          </Text>

          <Text className="text-sm text-gray-700">
            {customer.Notes ? customer.Notes : "—"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// CUSTOMER PDF HTML
// =====================================================

function generateCustomerHtml(c: Customer) {
  const row = (label: string, value?: string | number | null) => `
    <tr>
      <td style="
        padding:6px 0;
        color:#6B7280;
        font-size:12px;
      ">
        ${label}
      </td>

      <td style="
        padding:6px 0;
        color:#111827;
        font-size:13px;
        font-weight:500;
      ">
        ${value !== undefined && value !== null && value !== "" ? value : "-"}
      </td>
    </tr>
  `;

  return `
    <html>

      <body style="
        font-family:-apple-system, Helvetica, Arial, sans-serif;
        padding:24px;
      ">

        <h1 style="
          font-size:20px;
          margin-bottom:4px;
        ">
          ${c.CustomerName}
        </h1>

        <p style="
          color:${c.Status === "Active" ? "#16A34A" : "#DC2626"};
          font-size:13px;
          margin-top:0;
        ">
          ${c.Status}
        </p>


        <!-- BASIC INFORMATION -->

        <h3 style="
          font-size:14px;
          border-bottom:1px solid #E5E7EB;
          padding-bottom:6px;
          margin-top:20px;
        ">
          Basic Information
        </h3>

        <table style="
          width:100%;
          border-collapse:collapse;
        ">

          ${row("Customer Code", c.CustomerCode)}

          ${row("Customer Name", c.CustomerName)}

          ${row("Phone", c.Phone)}

          ${row("Email", c.Email)}

          ${row("Customer Group", c.CustomerGroup)}

        </table>


        <!-- PERSONAL INFORMATION -->

        <h3 style="
          font-size:14px;
          border-bottom:1px solid #E5E7EB;
          padding-bottom:6px;
          margin-top:20px;
        ">
          Personal Information
        </h3>

        <table style="
          width:100%;
          border-collapse:collapse;
        ">

          ${row(
            "Date of Birth",
            c.DateOfBirth
              ? new Date(c.DateOfBirth).toLocaleDateString()
              : undefined,
          )}

          ${row("National ID / Tax ID", c.NationalIdTaxId)}

        </table>


        <!-- ADDRESS INFORMATION -->

        <h3 style="
          font-size:14px;
          border-bottom:1px solid #E5E7EB;
          padding-bottom:6px;
          margin-top:20px;
        ">
          Address Information
        </h3>

        <table style="
          width:100%;
          border-collapse:collapse;
        ">

          ${row("Address Line 1", c.AddressLine1)}

          ${row("Address Line 2", c.AddressLine2)}

          ${row("City", c.City)}

          ${row("State / Division", c.StateDivision)}

          ${row("Postal Code", c.PostalCode)}

          ${row("Country", c.Country)}

        </table>


        <!-- FINANCIAL INFORMATION -->

        <h3 style="
          font-size:14px;
          border-bottom:1px solid #E5E7EB;
          padding-bottom:6px;
          margin-top:20px;
        ">
          Financial Information
        </h3>

        <table style="
          width:100%;
          border-collapse:collapse;
        ">

          ${row(
            "Opening Balance",
            `৳ ${Number(c.OpeningBalance ?? 0).toLocaleString()}`,
          )}

          ${row(
            "Credit Limit",
            `৳ ${Number(c.CreditLimit ?? 0).toLocaleString()}`,
          )}

          ${row("Due Amount", `৳ ${Number(c.DueAmount ?? 0).toLocaleString()}`)}

        </table>


        <!-- NOTES -->

        <h3 style="
          font-size:14px;
          border-bottom:1px solid #E5E7EB;
          padding-bottom:6px;
          margin-top:20px;
        ">
          Notes
        </h3>

        <p style="
          font-size:13px;
          color:#374151;
        ">
          ${c.Notes ? c.Notes : "-"}
        </p>

      </body>

    </html>
  `;
}
