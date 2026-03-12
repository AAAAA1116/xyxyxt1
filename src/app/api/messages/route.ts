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

  // 查询 listing 获取 seller_id、price
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("seller_id, price")
    .eq("id", listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  const sellerId = listing.seller_id as string;
  const price = listing.price as number;

  // 不能给自己发
  if (user.id === sellerId) {
    return NextResponse.json({ error: "不能给自己发消息" }, { status: 400 });
  }

  // 插入用户消息（from=当前用户，to=卖家）
  const { error: insertErr } = await supabase.from("messages").insert({
    listing_id,
    from_user: user.id,
    to_user: sellerId,
    content: content.trim(),
    is_auto: false,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 检测关键词 → 自动回复（需 service role 绕过 RLS，以卖家身份插入）
  if (AUTO_REPLY_PATTERN.test(content.trim())) {
    const admin = createAdminClient();
    await admin.from("messages").insert({
      listing_id,
      from_user: sellerId,
      to_user: user.id,
      content: `还卖哦，${price}元，校内自取~`,
      is_auto: true,
    });
  }

  return NextResponse.json({ ok: true });
}
