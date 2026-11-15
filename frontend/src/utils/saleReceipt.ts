import { SaleDetail } from "../services/saleApi";
import { ReceiptData } from "./printReceipt";

export const saleDetailToReceipt = (
  d: SaleDetail,
  companyName: string,
  branchName?: string,
): ReceiptData => {
  const lineDiscount = d.items.reduce(
    (s, i) => s + (i.Qty * i.UnitPrice * i.DiscountPercent) / 100,
    0,
  );

  return {
    companyName,
    branchName,
    invoiceNo: d.InvoiceNo,
    date: new Date(d.SaleDate),
    customerName: d.CustomerName,
    cashierName: d.CashierName,
    priceType: d.PriceType ?? undefined,
    items: d.items.map((i) => ({
      name: i.ProductName,
      qty: i.Qty,
      unitPrice: i.UnitPrice,
      discountPercent: i.DiscountPercent,
      total: i.LineTotal,
    })),
    subTotal: d.SubTotal,
    discount: lineDiscount + d.DiscountAmount,
    pointsDiscount: d.LoyaltyDiscountAmount,
    tax: d.TaxAmount,
    grandTotal: d.GrandTotal,
    paymentMethod: d.PaymentMethod ?? "—",
    received: d.ReceivedAmount,
    change: d.ChangeAmount,
  };
};