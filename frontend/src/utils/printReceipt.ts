import * as Print from "expo-print";

export type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
};

export type ReceiptData = {
  companyName: string;
  branchName?: string;
  invoiceNo: string;
  date: Date;
  customerName: string;
  cashierName?: string;
  priceType?: string;
  items: ReceiptItem[];
  subTotal: number;
  discount: number;
  pointsDiscount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  received: number;
  change: number;
};

const money = (n: number) => `৳${(Number(n) || 0).toFixed(2)}`;

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const buildReceiptHtml = (d: ReceiptData) => {
  const rows = d.items
    .map(
      (i) => `
      <tr>
        <td colspan="3" class="name">${esc(i.name)}</td>
      </tr>
      <tr>
        <td>${i.qty} x ${money(i.unitPrice)}${
          i.discountPercent ? ` (-${i.discountPercent}%)` : ""
        }</td>
        <td></td>
        <td class="r">${money(i.total)}</td>
      </tr>`,
    )
    .join("");

  const line = (label: string, value: string, bold = false) =>
    `<tr class="${bold ? "b" : ""}"><td>${label}</td><td class="r">${value}</td></tr>`;

  return `
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; width: 72mm; margin: 0 auto; color: #000; }
    h1 { font-size: 16px; text-align: center; margin: 0; }
    .c { text-align: center; }
    .r { text-align: right; }
    .name { font-weight: bold; padding-top: 4px; }
    .b td { font-weight: bold; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
    .small { font-size: 11px; }
  </style>
</head>
<body>
  <h1>${esc(d.companyName)}</h1>
  ${d.branchName ? `<div class="c small">${esc(d.branchName)}</div>` : ""}
  <hr />
  <div class="small">
    Invoice: <b>${esc(d.invoiceNo)}</b><br />
    Date: ${d.date.toLocaleString()}<br />
    Customer: ${esc(d.customerName)}<br />
    ${d.cashierName ? `Cashier: ${esc(d.cashierName)}<br />` : ""}
    ${d.priceType ? `Price: ${esc(d.priceType)}` : ""}
  </div>
  <hr />
  <table>${rows}</table>
  <hr />
  <table>
    ${line("Subtotal", money(d.subTotal))}
    ${d.discount > 0 ? line("Discount", `-${money(d.discount)}`) : ""}
    ${d.pointsDiscount > 0 ? line("Points used", `-${money(d.pointsDiscount)}`) : ""}
    ${d.tax > 0 ? line("Tax", money(d.tax)) : ""}
    ${line("TOTAL", money(d.grandTotal), true)}
  </table>
  <hr />
  <table>
    ${line("Payment", esc(d.paymentMethod))}
    ${line("Received", money(d.received))}
    ${line("Change", money(d.change))}
  </table>
  <hr />
  <div class="c small">Thank you for shopping with us!</div>
</body>
</html>`;
};

export const printReceipt = async (d: ReceiptData) => {
  await Print.printAsync({ html: buildReceiptHtml(d), width: 226 }); // 226pt ≈ 80mm
};