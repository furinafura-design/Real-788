import QRCode from 'qrcode';

/**
 * CRC16 Calculation for EMVCo standard (CCITT false / 0x1021)
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Format string length helper for EMVCo
 */
function f(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generate standard Thai PromptPay QR Payload (EMVCo specification)
 * Supports mobile numbers (10 digits) or National ID / Tax ID (13 digits)
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let targetType = '01'; // 01 for mobile, 02 for Citizen/Tax ID
  let formattedTarget = cleanTarget;

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile number: prefix with 0066 and drop first 0
    targetType = '01';
    formattedTarget = `0066${cleanTarget.substring(1)}`;
  } else if (cleanTarget.length === 13) {
    targetType = '02';
    formattedTarget = cleanTarget;
  } else if (cleanTarget.length >= 9 && cleanTarget.length <= 15) {
    targetType = '01';
    formattedTarget = cleanTarget;
  }

  // Tag 29: PromptPay AID
  const aid = f('00', 'A000000677010111');
  const targetTag = f(targetType, formattedTarget);
  const merchantAccountInfo = f('29', `${aid}${targetTag}`);

  // Base tags
  const payloadFormat = f('00', '01');
  const initiationMethod = f('01', amount ? '12' : '11'); // 12 = Dynamic (One-time with amount), 11 = Static
  const countryCode = f('58', 'TH');
  const currencyCode = f('53', '764'); // 764 = THB

  let payload = `${payloadFormat}${initiationMethod}${merchantAccountInfo}${countryCode}${currencyCode}`;

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += f('54', formattedAmount);
  }

  // Checksum tag placeholder
  const rawWithChecksumTag = `${payload}6304`;
  const checksum = crc16(rawWithChecksumTag);

  return `${rawWithChecksumTag}${checksum}`;
}

/**
 * Generate high-resolution QR Data URL for display or download
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#460E3F',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
