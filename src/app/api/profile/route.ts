import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() || null : undefined;
  const student_id = typeof body.student_id === "string" ? body.student_id.trim() || null : undefined;

  const updates: { nickname?: string | null; student_id?: string | null } = {};
  if (nickname !== undefined) updates.nickname = nickname;
  if (student_id !== undefined) updates.student_id = student_id;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
