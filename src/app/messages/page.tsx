import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatTime(dateStr: string) {
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

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/messages");

  const { data: messages } = await supabase
    .from("messages")
    .select("id, listing_id, from_user, to_user, content, created_at")
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(500);

  const byListing = new Map<string, { content: string; created_at: string }>();
  for (const m of messages ?? []) {
    if (!byListing.has(m.listing_id)) {
      byListing.set(m.listing_id, { content: m.content, created_at: m.created_at });
    }
  }
  const listingIds = Array.from(byListing.keys());
  if (listingIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">消息</h1>
        <p className="text-gray-500 text-center py-12">暂无对话，在商品详情里联系卖家即可开始</p>
        <p className="text-center">
          <Link href="/" className="text-indigo-600 hover:underline text-sm">返回首页</Link>
        </p>
      </div>
    );
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, image_url")
    .in("id", listingIds);

  const listingMap = new Map((listings ?? []).map((l) => [l.id, l]));
  const list = listingIds
    .map((id) => {
      const last = byListing.get(id)!;
      const listing = listingMap.get(id);
      return listing ? { listing, last } : null;
    })
    .filter(Boolean) as { listing: { id: string; title: string; image_url: string }; last: { content: string; created_at: string } }[];
  list.sort((a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime());

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">消息</h1>
      <ul className="space-y-2">
        {list.map(({ listing, last }) => (
          <li key={listing.id}>
            <Link
              href={`/listing/${listing.id}#message`}
              className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="w-14 h-14 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                <Image
                  src={listing.image_url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                <p className="text-sm text-gray-500 truncate mt-0.5">{last.content}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTime(last.created_at)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center">
        <Link href="/" className="text-indigo-600 hover:underline text-sm">返回首页</Link>
      </p>
    </div>
  );
}
