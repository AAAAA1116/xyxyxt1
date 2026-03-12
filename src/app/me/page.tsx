import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/ListingCard";

export default async function MePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/me");

  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id, title, description, price, image_url, status, created_at,
      profiles!seller_id (id, nickname)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">我的发布</h1>

      <div className="grid grid-cols-2 gap-3">
        {(listings ?? []).map((l: Record<string, unknown>) => (
          <ListingCard key={String(l.id)} listing={l as never} />
        ))}
      </div>

      {(listings?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无发布</p>
          <Link href="/new" className="mt-2 inline-block text-indigo-600 hover:underline">
            去发布
          </Link>
        </div>
      )}

      <p className="mt-6 text-center">
        <Link href="/" className="text-indigo-600 hover:underline text-sm">返回首页</Link>
      </p>
    </div>
  );
}
