import { Manual } from "./types";
import { dbSelect, dbInsert, dbDelete } from "./rest";

function mapManual(r: Record<string, unknown>): Manual {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "",
    departmentId: (r.department_id as string) ?? "",
    topicId: (r.topic_id as string) ?? "",
    fileUrl: (r.file_url as string) ?? "",
    fileName: (r.file_name as string) ?? "",
    fileSize: (r.file_size as number) ?? 0,
    publicId: (r.public_id as string) ?? "",
    uploadedAt: (r.uploaded_at as string) ?? "",
  };
}

export async function getManuals(): Promise<Manual[]> {
  const rows = await dbSelect("manuals", { order: "uploaded_at.desc" });
  return rows.map(mapManual);
}

export async function uploadManual(
  file: File,
  meta: { title: string; departmentId: string; topicId: string }
): Promise<Manual> {
  const formData = new FormData();
  formData.append("file", file);

  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
  const uploadData = await uploadRes.json() as { url: string; fileName: string; fileSize: number; publicId: string; error?: string };
  if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

  const row = await dbInsert("manuals", {
    title: meta.title,
    department_id: meta.departmentId || null,
    topic_id: meta.topicId || null,
    file_url: uploadData.url,
    file_name: uploadData.fileName,
    file_size: uploadData.fileSize,
    public_id: uploadData.publicId,
  });

  return mapManual(row);
}

export async function deleteManual(id: string, publicId?: string): Promise<void> {
  await dbDelete("manuals", id);
  if (publicId) {
    fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    }).catch(() => {});
  }
}
