import { db } from "./firebase";
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, orderBy, DocumentData,
} from "firebase/firestore";
import { Manual } from "./types";

function mapManual(id: string, r: DocumentData): Manual {
  return {
    id,
    title: r.title ?? "",
    departmentId: r.departmentId ?? "",
    topicId: r.topicId ?? "",
    fileUrl: r.fileUrl ?? "",
    fileName: r.fileName ?? "",
    fileSize: r.fileSize ?? 0,
    publicId: r.publicId ?? "",
    uploadedAt: r.uploadedAt ?? "",
  };
}

export async function getManuals(): Promise<Manual[]> {
  const snap = await getDocs(query(collection(db, "manuals"), orderBy("uploadedAt", "desc")));
  return snap.docs.map((d) => mapManual(d.id, d.data()));
}

export async function uploadManual(
  file: File,
  meta: { title: string; departmentId: string; topicId: string }
): Promise<Manual> {
  const formData = new FormData();
  formData.append("file", file);

  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

  const uploadedAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, "manuals"), {
    title: meta.title,
    departmentId: meta.departmentId,
    topicId: meta.topicId,
    fileUrl: uploadData.url,
    fileName: uploadData.fileName,
    fileSize: uploadData.fileSize,
    publicId: uploadData.publicId,
    uploadedAt,
  });

  return {
    id: docRef.id,
    title: meta.title,
    departmentId: meta.departmentId,
    topicId: meta.topicId,
    fileUrl: uploadData.url,
    fileName: uploadData.fileName,
    fileSize: uploadData.fileSize,
    publicId: uploadData.publicId,
    uploadedAt,
  };
}

export async function deleteManual(id: string, publicId?: string): Promise<void> {
  await deleteDoc(doc(db, "manuals", id));
  if (publicId) {
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
    } catch {
      // Non-fatal if Cloudinary delete fails
    }
  }
}
