"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function EditListingForm({
  listingId,
  initialTitle,
  initialDescription,
  initialPrice,
  initialImageUrl,
  initialStatus,
}: {
  listingId: string;
  initialTitle: string;
  initialDescription: string;
  initialPrice: string;
  initialImageUrl: string;
  initialStatus: "active" | "sold";
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(initialPrice);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"sold" | "relist" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(initialStatus);

  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("仅支持 jpg / png / webp 格式");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("图片不能超过 5MB");
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("请输入标题");
      return;
    }
    const p = parseInt(price, 10);
    if (isNaN(p) || p < 0) {
      setError("请输入有效价格");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = initialImageUrl;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || "上传失败");
        imageUrl = uploadJson.url;
      }

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          price: p,
          image_url: imageUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      router.push(`/listing/${listingId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const markSold = async () => {
    setActionLoading("sold");
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "操作失败");
      setStatus("sold");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "下架失败");
    } finally {
      setActionLoading(null);
    }
  };

  const markActive = async () => {
    setActionLoading("relist");
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "操作失败");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上架失败");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteListing = async () => {
    if (!confirm("确定删除该商品？删除后无法恢复。")) return;
    setActionLoading("delete");
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "删除失败");
      router.push("/me");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="例如：九成新iPad"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="简要描述商品"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）*</label>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片（不选则保留原图）</label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="w-full text-sm"
        />
        {file && <p className="mt-1 text-xs text-gray-500">已选：{file.name}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading || actionLoading !== null}
          className="flex-1 min-w-[80px] py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存"}
        </button>
        {status === "active" ? (
          <button
            type="button"
            onClick={markSold}
            disabled={loading || actionLoading !== null}
            className="px-4 py-3 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 disabled:opacity-50"
          >
            {actionLoading === "sold" ? "处理中..." : "下架"}
          </button>
        ) : (
          <button
            type="button"
            onClick={markActive}
            disabled={loading || actionLoading !== null}
            className="px-4 py-3 bg-emerald-100 text-emerald-800 rounded-lg font-medium hover:bg-emerald-200 disabled:opacity-50"
          >
            {actionLoading === "relist" ? "处理中..." : "重新上架"}
          </button>
        )}
        <button
          type="button"
          onClick={deleteListing}
          disabled={loading || actionLoading !== null}
          className="px-4 py-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50"
        >
          {actionLoading === "delete" ? "删除中..." : "删除"}
        </button>
      </div>
    </form>
  );
}
