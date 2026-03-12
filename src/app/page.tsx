import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { ListingCard } from "@/components/ListingCard";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id, title, description, price, image_url, status, created_at,
      profiles!seller_id (id, nickname)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        {(listings ?? []).map((l: Record<string, unknown>) => (
          <ListingCard key={String(l.id)} listing={l as never} />
        ))}
      </div>
      {(listings?.length ?? 0) >= PAGE_SIZE && (
        <div className="mt-6 text-center">
          <Link
            href="/search"
            className="text-indigo-600 hover:underline text-sm"
          >
            加载更多 / 搜索
          </Link>
        </div>
      )}
      {(listings?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无商品</p>
          <Link href="/new" className="mt-2 inline-block text-indigo-600 hover:underline">
            去发布
          </Link>
        </div>
      )}
    </div>
  );
}
