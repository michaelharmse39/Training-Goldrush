import { supabase } from "./supabase";
import { Manual } from "./types";

function mapManual(r: Record<string, unknown>): Manual {
  return {
    id: r.id as string,
    title: r.title as string ?? "",
    departmentId: r.department_id as string ?? "",
    topicId: r.topic_id as string ?? "",
    fileUrl: r.file_url as string ?? "",
    fileName: r.file_name as string ?? "",
    fileSize: r.file_size as number ?? 0,
    publicId: r.public_id as string ?? "",
    uploadedAt: r.uploaded_at as string ?? "",
  };
}

export async function getManuals(): Promise<Manual[]> {
  const { data } = await supabase.from("manuals").select("*").order("uploaded_at", { ascending: false });
  return (data ?? []).map(mapManual);
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

  const { data } = await supabase.from("manuals").insert({
    title: meta.title,
    department_id: meta.departmentId || null,
    topic_id: meta.topicId || null,
    file_url: uploadData.url,
    file_name: uploadData.fileName,
    file_size: uploadData.fileSize,
    public_id: uploadData.publicId,
  }).select().single();

  return mapManual(data!);
}

export async function deleteManual(id: string, publicId?: string): Promise<void> {
  await supabase.from("manuals").delete().eq("id", id);
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
