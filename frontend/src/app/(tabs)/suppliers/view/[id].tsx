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
import { getSupplierById, Supplier } from "../../../../services/supplierApi";

export default function SupplierViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchSupplier = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getSupplierById(supplierId);
      setSupplier(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load supplier details.");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  const handleDownloadPdf = async () => {
    if (!supplier) return;
    try {
      setExporting(true);
      const html = generateSupplierHtml(supplier);
      const { uri } = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${supplier.SupplierCode} - Supplier Details`,
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error || !supplier) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-red-500 text-center mb-3">{error}</Text>
        <TouchableOpacity
          onPress={fetchSupplier}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View className="mb-3">
      <Text className="text-xs text-gray-400 mb-0.5">{label}</Text>
      <Text className="text-sm text-gray-800">
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            Supplier Details
          </Text>
        </View>
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

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status badge */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900">
            {supplier.SupplierName}
          </Text>
          <View
            className={`px-2.5 py-1 rounded-full ${
              supplier.Status === "Active" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                supplier.Status === "Active" ? "text-green-700" : "text-red-700"
              }`}
            >
              {supplier.Status}
            </Text>
          </View>
        </View>

        {/* Basic Information */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Basic Information
          </Text>
          <Row label="Supplier Code" value={supplier.SupplierCode} />
          <Row label="Supplier Name" value={supplier.SupplierName} />
          <Row label="Phone" value={supplier.Phone} />
          <Row label="Email" value={supplier.Email} />
          <Row label="Website" value={supplier.Website} />
        </View>

        {/* Address Information */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Address Information
          </Text>
          <Row label="Address Line 1" value={supplier.AddressLine1} />
          <Row label="Address Line 2" value={supplier.AddressLine2} />
          <Row label="City" value={supplier.City} />
          <Row label="State / Division" value={supplier.StateDivision} />
          <Row label="Postal Code" value={supplier.PostalCode} />
          <Row label="Country" value={supplier.Country} />
        </View>

        {/* Other Information */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Other Information
          </Text>
          <Row label="Contact Person" value={supplier.ContactPerson} />
          <Row label="Phone (Contact Person)" value={supplier.ContactPersonPhone} />
          <Row label="Tax / VAT No." value={supplier.TaxVatNo} />
          <Row
            label="Opening Balance"
            value={`৳ ${Number(supplier.OpeningBalance ?? 0).toLocaleString()}`}
          />
          <Row
            label="Credit Limit"
            value={`৳ ${Number(supplier.CreditLimit ?? 0).toLocaleString()}`}
          />
          {supplier.DueAmount !== undefined && (
            <Row
              label="Due Amount"
              value={`৳ ${Number(supplier.DueAmount ?? 0).toLocaleString()}`}
            />
          )}
        </View>

        {/* Notes */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Notes</Text>
          <Text className="text-sm text-gray-700">
            {supplier.Notes ? supplier.Notes : "—"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Builds the HTML that gets converted into a PDF
function generateSupplierHtml(s: Supplier) {
  const row = (label: string, value?: string | number | null) => `
    <tr>
      <td style="padding:6px 0; color:#6B7280; font-size:12px;">${label}</td>
      <td style="padding:6px 0; color:#111827; font-size:13px; font-weight:500;">${
        value !== undefined && value !== null && value !== "" ? value : "-"
      }</td>
    </tr>`;

  return `
    <html>
      <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px;">
        <h1 style="font-size:20px; margin-bottom:4px;">${s.SupplierName}</h1>
        <p style="color:${s.Status === "Active" ? "#16A34A" : "#DC2626"}; font-size:13px; margin-top:0;">
          ${s.Status}
        </p>

        <h3 style="font-size:14px; border-bottom:1px solid #E5E7EB; padding-bottom:6px; margin-top:20px;">Basic Information</h3>
        <table style="width:100%; border-collapse:collapse;">
          ${row("Supplier Code", s.SupplierCode)}
          ${row("Phone", s.Phone)}
          ${row("Email", s.Email)}
          ${row("Website", s.Website)}
        </table>

        <h3 style="font-size:14px; border-bottom:1px solid #E5E7EB; padding-bottom:6px; margin-top:20px;">Address Information</h3>
        <table style="width:100%; border-collapse:collapse;">
          ${row("Address Line 1", s.AddressLine1)}
          ${row("Address Line 2", s.AddressLine2)}
          ${row("City", s.City)}
          ${row("State / Division", s.StateDivision)}
          ${row("Postal Code", s.PostalCode)}
          ${row("Country", s.Country)}
        </table>

        <h3 style="font-size:14px; border-bottom:1px solid #E5E7EB; padding-bottom:6px; margin-top:20px;">Other Information</h3>
        <table style="width:100%; border-collapse:collapse;">
          ${row("Contact Person", s.ContactPerson)}
          ${row("Phone (Contact Person)", s.ContactPersonPhone)}
          ${row("Tax / VAT No.", s.TaxVatNo)}
          ${row("Opening Balance", `৳ ${Number(s.OpeningBalance ?? 0).toLocaleString()}`)}
          ${row("Credit Limit", `৳ ${Number(s.CreditLimit ?? 0).toLocaleString()}`)}
        </table>

        <h3 style="font-size:14px; border-bottom:1px solid #E5E7EB; padding-bottom:6px; margin-top:20px;">Notes</h3>
        <p style="font-size:13px; color:#374151;">${s.Notes ? s.Notes : "-"}</p>
      </body>
    </html>
  `;
}