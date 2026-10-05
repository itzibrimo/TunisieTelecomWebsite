"use client";

/* =============================================================================
 * app/account/profile/page.tsx — Profile settings (moved from /settings)
 * ============================================================================= */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RevealOnScroll } from "@/components/effects/Animations";
import { updateProfile } from "firebase/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import { useUser } from "@/lib/hooks/useUser";
import { updateUserData } from "@/lib/services/auth.service";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/services/storage.service";
import { profileSchema } from "@/lib/validations";
import { showToast } from "@/components/ui/Toast";

export default function AccountProfilePage() {
  const router = useRouter();
  const { user, profile, loading, setProfile } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      queueMicrotask(() => {
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setPhotoPreview(profile.photoURL || null);
      });
    }
  }, [profile]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { showToast("Veuillez sélectionner une image.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("L'image ne doit pas dépasser 5 Mo.", "error"); return; }
    setUploading(true);
    try {
      const url = await uploadProfilePicture(user.uid, file);
      setPhotoPreview(url);
      await updateProfile(user, { photoURL: url });
      await updateUserData(user.uid, { photoURL: url });
      setProfile({ ...profile!, photoURL: url });
      showToast("Photo de profil mise à jour !");
    } catch (err) {
      console.error("[Account] Erreur upload photo:", err);
      showToast("Erreur lors de l'upload de la photo.", "error");
    } finally { setUploading(false); }
  }

  async function handlePhotoRemove() {
    if (!user) return;
    setUploading(true);
    try {
      await deleteProfilePicture(user.uid);
      await updateProfile(user, { photoURL: null });
      await updateUserData(user.uid, { photoURL: null });
      setPhotoPreview(null);
      setProfile({ ...profile!, photoURL: null });
      showToast("Photo de profil supprimée.");
    } catch (err) {
      console.error("[Account] Erreur suppression photo:", err);
      showToast("Erreur lors de la suppression.", "error");
    } finally { setUploading(false); }
  }

  async function handleSave() {
    if (!user) return;
    setErrors({});
    const result = profileSchema.safeParse({ name, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0] as string] = issue.message; });
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user, { displayName: name });
      await updateUserData(user.uid, { name, phone });
      setProfile({ ...profile!, name, phone });
      showToast("Profil mis à jour avec succès !");
    } catch (err) {
      console.error("[Account] Erreur sauvegarde profil:", err);
      showToast("Erreur lors de la mise à jour du profil.", "error");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !user.emailVerified) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <RevealOnScroll>
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-6">Photo de profil</h2>
            <div className="relative w-32 h-32 mx-auto mb-6">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo de profil" className="w-full h-full rounded-full object-cover border-4 border-primary/20" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
              )}
              {uploading && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" /></div>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Envoi en cours..." : "Changer la photo"}
              </Button>
              {photoPreview && <Button variant="ghost" size="sm" disabled={uploading} onClick={handlePhotoRemove} className="text-error hover:text-error/80">Supprimer</Button>}
            </div>
          </Card>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={0.1}>
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-6">Informations personnelles</h2>
            <div className="space-y-5">
              <FormInput label="Nom complet" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              <FormInput label="Adresse email" value={user.email || ""} disabled className="opacity-60 cursor-not-allowed" />
              <FormInput label="Téléphone" placeholder="Votre numéro" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} disabled={saving} loading={saving} size="md">Enregistrer les modifications</Button>
            </div>
          </Card>
        </div>
      </RevealOnScroll>
    </div>
  );
}
