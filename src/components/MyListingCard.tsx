"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ListingWithProfile } from "@/types/database";

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "刚刚";
  if (diffM < 60) return `${diffM}分钟前`;
  if (diffH < 24) return `${diffH}小时前`;
  if (diffD < 7) return `${diffD}天前`;
  return d.toLocaleDateString("zh-CN");
}

export function MyListingCard({ listing }: { listing: ListingWithProfile }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"sold" | "relist" | "delete" | null>(null);
  const isSold = listing.status === "sold";

  const markSold = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading("sold");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "操作失败");
      router.refresh();
    } catch (_) {
      setLoading(null);
    }
  };

  const markActive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading("relist");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "操作失败");
      router.push("/");
      router.refresh();
    } catch (_) {
      setLoading(null);
    }
  };

  const deleteListing = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定删除该商品？删除后无法恢复。")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "删除失败");
      router.refresh();
    } catch (_) {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Link href={`/listing/${listing.id}`} className="block relative">
        <div className="aspect-square relative bg-gray-100">
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
          {isSold && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-medium text-sm">
              已售
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-gray-900 truncate">{listing.title}</p>
          <p className="text-indigo-600 font-semibold mt-1">¥{listing.price}</p>
          <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(listing.created_at)}</p>
        </div>
      </Link>
      <div className="px-3 pb-3 flex flex-wrap gap-2">
        {!isSold ? (
          <button
            type="button"
            onClick={markSold}
            disabled={loading !== null}
            className="text-xs px-2 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-50"
          >
            {loading === "sold" ? "处理中..." : "下架"}
          </button>
        ) : (
          <button
            type="button"
            onClick={markActive}
            disabled={loading !== null}
            className="text-xs px-2 py-1.5 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 disabled:opacity-50"
          >
            {loading === "relist" ? "处理中..." : "重新上架"}
          </button>
        )}
        <Link
          href={`/listing/${listing.id}/edit`}
          className="text-xs px-2 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 inline-block"
        >
          编辑
        </Link>
        <button
          type="button"
          onClick={deleteListing}
          disabled={loading !== null}
          className="text-xs px-2 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50"
        >
          {loading === "delete" ? "删除中..." : "删除"}
        </button>
      </div>
    </div>
  );
}
