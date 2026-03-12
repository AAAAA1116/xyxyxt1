import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: listing, error: fetchErr } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", id)
    .single();

  if (fetchErr || !listing) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }
  if ((listing.seller_id as string) !== user.id) {
    return NextResponse.json({ error: "只能操作自己的商品" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const updates: { status?: string; title?: string; description?: string | null; price?: number; image_url?: string } = {};

  if (typeof body.status === "string" && ["active", "sold"].includes(body.status)) {
    updates.status = body.status;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if (typeof body.price === "number" && body.price >= 0) {
    updates.price = body.price;
  } else if (typeof body.price === "string") {
    const p = parseInt(body.price, 10);
    if (!isNaN(p) && p >= 0) updates.price = p;
  }
  if (typeof body.image_url === "string" && body.image_url.trim()) {
    updates.image_url = body.image_url.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("listings").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: listing, error: fetchErr } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", id)
    .single();

  if (fetchErr || !listing) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }
  if ((listing.seller_id as string) !== user.id) {
    return NextResponse.json({ error: "只能删除自己的商品" }, { status: 403 });
  }

  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
