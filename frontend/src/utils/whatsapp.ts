import { Linking, Alert } from "react-native";
import { ReceiptData } from "./printReceipt";

const COUNTRY_CODE = "880"; // Bangladesh

// "01712-345678" -> "8801712345678"; returns null if it doesn't look like a number
export const normalizePhone = (raw?: string | null): string | null => {
  let d = (raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = COUNTRY_CODE + d.slice(1);
  else if (!d.startsWith(COUNTRY_CODE) && d.length === 10) d = COUNTRY_CODE + d;
  return d.length >= 11 && d.length <= 15 ? d : null;
};

const money = (n: number) => `৳${(Number(n) || 0).toFixed(2)}`;

export const buildReceiptText = (d: ReceiptData) =>
  [
    `*${d.companyName}*`,
    ...(d.branchName ? [d.branchName] : []),
    `Invoice: ${d.invoiceNo}`,
    `Date: ${d.date.toLocaleString()}`,
    `Customer: ${d.customerName}`,
    "",
    ...d.items.map(
      (i) => `${i.name}\n  ${i.qty} x ${money(i.unitPrice)} = ${money(i.total)}`,
    ),
    "",
    `Subtotal: ${money(d.subTotal)}`,
    ...(d.discount > 0 ? [`Discount: -${money(d.discount)}`] : []),
    ...(d.pointsDiscount > 0 ? [`Points used: -${money(d.pointsDiscount)}`] : []),
    ...(d.tax > 0 ? [`Tax: ${money(d.tax)}`] : []),
    `*Total: ${money(d.grandTotal)}*`,
    `Paid (${d.paymentMethod}): ${money(d.received)}`,
    `Change: ${money(d.change)}`,
    "",
    "Thank you for shopping with us!",
  ].join("\n");

export const sendReceiptWhatsApp = async (
  rawPhone: string | null | undefined,
  receipt: ReceiptData,
) => {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    Alert.alert("WhatsApp", "Enter a valid phone number first.");
    return;
  }
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildReceiptText(receipt))}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("WhatsApp", "Couldn't open WhatsApp on this phone.");
  }
};