"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Message } from "@/types/database";

export function MessageSection({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ? { id: u.id } : null);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `listing_id=eq.${listingId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId, user, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth?next=/listing/${listingId}`);
      return;
    }
    if (!content.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, content: content.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发送失败");
      setContent("");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <h2 className="px-4 py-3 font-medium text-gray-900 border-b border-gray-100">
        联系卖家
      </h2>

      {!user ? (
        <div className="p-4 text-center text-gray-500">
          <Link href={`/auth?next=/listing/${listingId}`} className="text-indigo-600 hover:underline">
            登录后发送消息
          </Link>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">暂无消息，发起对话吧</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.from_user === user.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    m.from_user === user.id
                      ? "bg-indigo-600 text-white"
                      : m.is_auto
                      ? "bg-amber-50 text-amber-900 border border-amber-200"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="text-xs opacity-75 mt-1">{new Date(m.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                发送
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </form>
        </>
      )}
    </div>
  );
}
