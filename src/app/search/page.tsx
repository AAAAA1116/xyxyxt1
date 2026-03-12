import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let listings: Record<string, unknown>[] = [];

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from("listings")
      .select(`
        id, title, description, price, image_url, status, created_at,
        profiles!seller_id (id, nickname)
      `)
      .eq("status", "active")
      .or(`title.ilike.${term},description.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(50);
    listings = data ?? [];
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse" />}>
        <SearchForm initialQ={q} />
      </Suspense>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {listings.map((l: Record<string, unknown>) => (
          <ListingCard key={String(l.id)} listing={l as never} />
        ))}
      </div>
      {q && listings.length === 0 && (
        <p className="mt-8 text-center text-gray-500">无相关结果</p>
      )}
      {!q && (
        <p className="mt-8 text-center text-gray-500">输入关键词搜索</p>
      )}
    </div>
  );
}
