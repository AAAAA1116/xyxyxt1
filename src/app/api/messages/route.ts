import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 匹配「还卖吗」类关键词，触发自动回复 */
const AUTO_REPLY_PATTERN = /还(在|卖)吗|在吗|还有吗|能要吗|还卖不/i;

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const { listing_id, content } = body;

  if (!listing_id || !content || typeof content !== "string") {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("seller_id, price")
    .eq("id", listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  const seller_id = listing.seller_id as string;
  const price = listing.price as number;
  const from_user = user.id;
  const to_user = seller_id;

  if (from_user === seller_id) {
    console.log("[POST /api/messages]", { from_user, seller_id, to_user, listing_id });
    return NextResponse.json(
      { error: "cannot message yourself: listing seller_id equals current user" },
      { status: 400 }
    );
  }

  console.log("[POST /api/messages]", { from_user, seller_id, to_user, listing_id });

  const { error: insertErr } = await supabase.from("messages").insert({
    listing_id,
    from_user,
    to_user,
    content: content.trim(),
    is_auto: false,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  if (AUTO_REPLY_PATTERN.test(content.trim())) {
    const admin = createAdminClient();
    await admin.from("messages").insert({
      listing_id,
      from_user: seller_id,
      to_user: from_user,
      content: `还卖哦，${price}元，校内自取~`,
      is_auto: true,
    });
  }

  return NextResponse.json({ ok: true });
}
