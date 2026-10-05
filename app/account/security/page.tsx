"use client";

/* =============================================================================
 * app/account/security/page.tsx — Security settings (moved from /settings/security)
 * ============================================================================= */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RevealOnScroll } from "@/components/effects/Animations";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Badge from "@/components/ui/Badge";
import { useUser } from "@/lib/hooks/useUser";
import { changePassword, reauthenticateUser, updateUserData } from "@/lib/services/auth.service";
import { changePasswordSchema } from "@/lib/validations";
import { getPasswordStrength, PASSWORD_RULES } from "@/lib/utils/password";
import { generateTOTPSecret, generateQRCode, verifyTOTP, generateRecoveryCodes } from "@/lib/utils/totp";
import { showToast } from "@/components/ui/Toast";

export default function AccountSecurityPage() {
  const router = useRouter();
  const { user, profile, loading, setProfile } = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [changingPassword, setChangingPassword] = useState(false);

  const [twoFALoading, setTwoFALoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [disablePassword, setDisablePassword] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (profile?.twoFactorEnabled && profile?.recoveryCodes) queueMicrotask(() => setRecoveryCodes(profile.recoveryCodes!)); }, [profile]);

  async function handleChangePassword() {
    setPasswordErrors({});
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmNewPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0] as string] = issue.message; });
      setPasswordErrors(fieldErrors);
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      showToast("Mot de passe modifié avec succès !");
    } catch (err) {
      console.error("[Account Security] Erreur changement mot de passe:", err);
      showToast("Mot de passe actuel incorrect.", "error");
    } finally { setChangingPassword(false); }
  }

  async function handleEnable2FA() {
    if (!user?.email) return;
    setTwoFALoading(true);
    try {
      const { secret, otpauthUrl } = generateTOTPSecret(user.email);
      setTotpSecret(secret);
      const qrUrl = await generateQRCode(otpauthUrl);
      setQrDataUrl(qrUrl);
    } catch (err) {
      console.error("[Account Security] Erreur génération QR:", err);
      showToast("Erreur lors de la génération du QR code.", "error");
    } finally { setTwoFALoading(false); }
  }

  async function handleVerify2FA() {
    if (!totpSecret || otpCode.length !== 6) return;
    setOtpError("");
    const isValid = verifyTOTP(otpCode, totpSecret);
    if (!isValid) { setOtpError("Code incorrect. Réessayez."); return; }
    setTwoFALoading(true);
    try {
      const codes = generateRecoveryCodes(8);
      await updateUserData(user!.uid, { twoFactorEnabled: true, twoFactorSecret: totpSecret, recoveryCodes: codes });
      setProfile({ ...profile!, twoFactorEnabled: true, twoFactorSecret: totpSecret, recoveryCodes: codes });
      setRecoveryCodes(codes);
      setQrDataUrl(null); setTotpSecret(null); setOtpCode("");
      showToast("Authentification à deux facteurs activée !");
    } catch (err) {
      console.error("[Account Security] Erreur activation 2FA:", err);
      showToast("Erreur lors de l'activation de la 2FA.", "error");
    } finally { setTwoFALoading(false); }
  }

  async function handleDisable2FA() {
    if (!disablePassword) return;
    setDisabling2FA(true);
    try {
      await reauthenticateUser(disablePassword);
      await updateUserData(user!.uid, { twoFactorEnabled: false, twoFactorSecret: undefined, recoveryCodes: undefined });
      setProfile({ ...profile!, twoFactorEnabled: false, twoFactorSecret: undefined, recoveryCodes: undefined });
      setRecoveryCodes([]); setDisablePassword("");
      showToast("2FA désactivée.");
    } catch (err) {
      console.error("[Account Security] Erreur désactivation 2FA:", err);
      showToast("Mot de passe incorrect.", "error");
    } finally { setDisabling2FA(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !user.emailVerified) return null;
  const is2FAEnabled = profile?.twoFactorEnabled ?? false;

  return (
    <div className="max-w-2xl space-y-8">
      <RevealOnScroll>
        <Card className="p-6 md:p-8">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-6">Changer le mot de passe</h2>
          <div className="space-y-5">
            <FormInput label="Mot de passe actuel" type="password" autoComplete="current-password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} error={passwordErrors.currentPassword} />
            <FormInput label="Nouveau mot de passe" type="password" autoComplete="new-password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={passwordErrors.newPassword} />
            {newPassword.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Force :</span>
                  <span style={{ color: strength.color }} className="font-semibold">{strength.label}</span>
                </div>
                <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strength.percent}%`, backgroundColor: strength.color }} />
                </div>
                <ul className="space-y-1 mt-3">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(newPassword);
                    return (
                      <li key={rule.label} className="flex items-center gap-2 text-sm">
                        {passed ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0"><circle cx="12" cy="12" r="10" /></svg>
                        )}
                        <span className={passed ? "text-success" : "text-muted"}>{rule.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <FormInput label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} error={passwordErrors.confirmNewPassword} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleChangePassword} disabled={changingPassword} loading={changingPassword} size="md">Modifier le mot de passe</Button>
          </div>
        </Card>
      </RevealOnScroll>

      <RevealOnScroll delay={0.1}>
        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground">Authentification à deux facteurs (2FA)</h2>
            {is2FAEnabled && <Badge variant="success" dot>Activée</Badge>}
          </div>
          <p className="text-muted text-sm mb-6">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>

          {!is2FAEnabled ? (
            <div>
              {!qrDataUrl ? (
                <Button onClick={handleEnable2FA} disabled={twoFALoading} loading={twoFALoading} variant="outline" size="md">Activer la 2FA</Button>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted mb-4">Scannez ce QR code avec votre application d&apos;authentification.</p>
                    <div className="inline-block p-4 bg-bg-elevated rounded-2xl border border-border shadow-card">
                      <img src={qrDataUrl} alt="QR Code 2FA" className="w-48 h-48" />
                    </div>
                  </div>
                  <div className="max-w-xs mx-auto">
                    <FormInput label="Code à 6 chiffres" placeholder="000000" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} error={otpError} />
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => { setQrDataUrl(null); setTotpSecret(null); setOtpCode(""); }} variant="ghost" size="sm">Annuler</Button>
                    <Button onClick={handleVerify2FA} disabled={twoFALoading || otpCode.length !== 6} loading={twoFALoading} size="sm">Activer</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                <span className="text-success font-medium text-sm">L&apos;authentification à deux facteurs est activée</span>
              </div>
              {recoveryCodes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Codes de récupération</h3>
                  <p className="text-xs text-muted mb-3">Conservez ces codes en lieu sûr.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {recoveryCodes.map((code) => <code key={code} className="block text-center py-2 px-3 rounded-lg bg-surface-2 dark:bg-surface-3 text-sm font-mono text-foreground">{code}</code>)}
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-error mb-2">Désactiver la 2FA</h3>
                <p className="text-xs text-muted mb-3">Entrez votre mot de passe pour confirmer.</p>
                <div className="flex items-end gap-3">
                  <div className="flex-1"><FormInput label="Mot de passe" type="password" autoComplete="current-password" placeholder="••••••••" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} /></div>
                  <Button onClick={handleDisable2FA} disabled={disabling2FA || !disablePassword} loading={disabling2FA} variant="danger" size="md">Désactiver</Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </RevealOnScroll>
    </div>
  );
}
