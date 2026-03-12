import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, price, image_url } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }
  const p = parseInt(String(price), 10);
  if (isNaN(p) || p < 0) {
    return NextResponse.json({ error: "价格无效" }, { status: 400 });
  }
  if (!image_url || typeof image_url !== "string") {
    return NextResponse.json({ error: "需要图片" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      price: p,
      image_url: image_url.trim(),
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
