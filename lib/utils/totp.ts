import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

/** Génère un secret TOTP + l'URI pour Google/Microsoft Authenticator */
export function generateTOTPSecret(email: string, issuer: string = "TT Digital"): { secret: string; otpauthUrl: string } {
  const totp = new OTPAuth.TOTP({ issuer, label: email, algorithm: "SHA1", digits: 6, period: 30 });
  return { secret: totp.secret.base32, otpauthUrl: totp.toString() };
}

/** Génère un data URL du QR Code */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2, color: { dark: "#001e8c", light: "#ffffff" } });
}

/** Vérifie un token TOTP contre un secret */
export function verifyTOTP(token: string, secretBase32: string): boolean {
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secretBase32), algorithm: "SHA1", digits: 6, period: 30 });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/** Génère N codes de récupération */
export function generateRecoveryCodes(count: number = 8): string[] {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: count }, () =>
    Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
}
