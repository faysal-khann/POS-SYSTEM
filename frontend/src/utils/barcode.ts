// Generates a valid EAN-13 barcode number with correct checksum digit
export function generateEAN13(): string {
  // "20" prefix = internal/in-store use range (standard practice for non-GS1-registered codes)
  let digits = "20";
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10);
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return digits + checkDigit;
}