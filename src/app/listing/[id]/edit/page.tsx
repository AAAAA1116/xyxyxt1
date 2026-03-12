import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditListingForm } from "./EditListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, title, description, price, image_url, seller_id, status")
    .eq("id", id)
    .single();

  if (error || !listing) notFound();
  if ((listing.seller_id as string) !== user.id) notFound();

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">编辑商品</h1>
      <EditListingForm
        listingId={listing.id}
        initialTitle={listing.title}
        initialDescription={listing.description ?? ""}
        initialPrice={String(listing.price)}
        initialImageUrl={listing.image_url}
        initialStatus={(listing.status as "active" | "sold") ?? "active"}
      />
      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href={`/listing/${id}`} className="text-indigo-600 hover:underline">返回商品详情</Link>
        {" · "}
        <Link href="/me" className="text-indigo-600 hover:underline">我的</Link>
      </p>
    </div>
  );
}
