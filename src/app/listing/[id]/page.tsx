import { notFound } from "next/navigation";

/** 商品详情缓存 60 秒 */
export const revalidate = 60;
import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessageSection } from "@/components/MessageSection";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      id, title, description, price, image_url, status, created_at, seller_id,
      profiles!seller_id (id, nickname)
    `)
    .eq("id", id)
    .single();

  if (error || !listing) notFound();

  const sellerProfile = (listing as Record<string, unknown>).profiles as { nickname?: string } | null;
  const displayName = sellerProfile?.nickname || "卖家";
  const sellerIdTail = String(listing.seller_id).slice(-6);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="aspect-square relative bg-gray-100">
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            priority
          />
        </div>
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">{listing.title}</h1>
          <p className="text-2xl font-bold text-indigo-600 mt-1">¥{listing.price}</p>
          <p className="text-sm text-gray-500 mt-2">
            发布者 {displayName} · {formatTime(listing.created_at)}
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-gray-400 mt-1 font-mono">
              [调试] 卖家 id 末6位：{sellerIdTail}
            </p>
          )}
          {listing.description && (
            <p className="mt-3 text-gray-700">{listing.description}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <MessageSection listingId={listing.id} sellerId={listing.seller_id} />
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/" className="text-indigo-600 hover:underline">返回首页</Link>
      </p>
    </div>
  );
}
