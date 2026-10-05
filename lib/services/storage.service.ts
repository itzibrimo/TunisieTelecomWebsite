import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseStorage } from "../firebase";

export async function uploadProfilePicture(uid: string, file: File): Promise<string> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, `profile-pictures/${uid}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  return url;
}

export async function deleteProfilePicture(uid: string): Promise<void> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, `profile-pictures/${uid}`);
  try {
    await deleteObject(fileRef);
  } catch (err) {
    console.error("[Storage] Erreur suppression photo:", err);
  }
}
