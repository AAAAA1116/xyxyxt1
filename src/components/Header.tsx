"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) =>
        setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null)
    );
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          校园二手
        </Link>
        <nav className="flex items-center justify-end gap-3 flex-wrap">
          <Link href="/search" className="text-gray-600 hover:text-gray-900 text-sm">
            搜索
          </Link>
          {user ? (
            <>
              <span className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[200px]" title={`id: ${user.id}`}>
                {user.email ?? user.id.slice(-8)}
              </span>
              <Link href="/new" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                发布
              </Link>
              <Link href="/me" className="text-gray-600 hover:text-gray-900 text-sm">
                我的
              </Link>
              <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
                退出
              </button>
            </>
          ) : (
            <Link href="/auth" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
