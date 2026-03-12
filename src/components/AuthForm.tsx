"use client";

import { useState, useMemo, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function getEmailRedirectTo(next: string): string {
  if (typeof window === "undefined") return "/auth/callback";
  const base =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const path = next && next !== "/" ? `/auth/callback?next=${encodeURIComponent(next)}` : "/auth/callback";
  return `${base}${path}`;
}

function formatError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "Failed to fetch") {
      return "无法连接 Supabase：可能是网络/代理/被插件拦截或 URL 配置错误。若在国内，可尝试开启 VPN 或系统代理后重试。";
    }
    return e.message;
  }
  return String(e);
}

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [config, setConfig] = useState<{ supabaseUrl: string; supabaseAnonKey: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const urlError = searchParams.get("error");

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((data) => setConfig({ supabaseUrl: data.supabaseUrl ?? "", supabaseAnonKey: data.supabaseAnonKey ?? "" }))
      .catch(() => setConfig({ supabaseUrl: "", supabaseAnonKey: "" }));
  }, []);

  const url = config?.supabaseUrl?.trim() ?? "";
  const anonKey = config?.supabaseAnonKey?.trim() ?? "";
  const isPlaceholder =
    url.includes("placeholder") || anonKey === "your-anon-key" || anonKey === "";
  const configOk = url.length > 0 && anonKey.length > 0 && !isPlaceholder;

  const supabase = useMemo(() => {
    if (!configOk) return null;
    return createBrowserClient(url, anonKey);
  }, [configOk, url, anonKey]);

  const sendMagicLink = async () => {
    setError("");
    setSuccess(false);
    setConnectionError("");
    if (!supabase) return;

    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("请输入有效的邮箱地址");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: getEmailRedirectTo(next),
        },
      });
      if (err) throw err;
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[AuthForm signInWithOtp]", {
        name: e instanceof Error ? e.name : "unknown",
        message: msg,
        cause: e instanceof Error ? e.cause : undefined,
      });
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    if (!supabase) return;
    setConnectionError("");
    setCheckingConnection(true);
    try {
      const { error: err } = await supabase.auth.getSession();
      if (err) throw err;
      setConnectionError("");
    } catch (e: unknown) {
      console.error("[AuthForm 连通性自检]", {
        name: e instanceof Error ? e.name : "unknown",
        message: e instanceof Error ? e.message : String(e),
        cause: e instanceof Error ? e.cause : undefined,
      });
      setConnectionError(
        "无法连接 Supabase：可能是网络/代理/被插件拦截或 URL 配置错误。若在国内，可尝试开启 VPN 或系统代理；或用无痕窗口、检查 .env.local 与 Supabase 控制台。"
      );
    } finally {
      setCheckingConnection(false);
    }
  };

  const supabaseHost = url
    ? (() => {
        try {
          return new URL(url.replace(/\/$/, "")).origin;
        } catch {
          return url;
        }
      })()
    : "";

  if (config === null) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <p className="text-gray-500">加载配置中…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">邮箱登录</h1>

      {!configOk && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900">
          <p className="font-medium">Supabase 未配置或未生效</p>
          <p className="mt-2">
            请在项目根目录的 <strong>.env.local</strong> 中填写
            <code className="mx-1 bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>
            和
            <code className="mx-1 bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            （Supabase 控制台 → Project Settings → API），保存后<strong>重启 npm run dev</strong>。
          </p>
        </div>
      )}

      {configOk && supabaseHost && (
        <p className="mb-4 text-xs text-gray-500">当前 Supabase 地址：{supabaseHost}</p>
      )}

      {urlError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {decodeURIComponent(urlError)}
        </div>
      )}

      {success ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          已向 <strong>{email}</strong> 发送登录链接，请查收邮件并点击链接完成登录。
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={sendMagicLink}
            disabled={loading || !configOk}
            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "发送中..." : "发送登录链接"}
          </button>
          <p className="mt-3 text-xs text-gray-500">
            若发送失败，可先自检连通性：{" "}
            <button
              type="button"
              onClick={checkConnection}
              disabled={checkingConnection || !configOk}
              className="text-indigo-600 hover:underline disabled:opacity-50"
            >
              {checkingConnection ? "检测中…" : "检测 Supabase 连接"}
            </button>
          </p>
        </>
      )}

      {connectionError && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {connectionError}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/" className="text-indigo-600 hover:underline">
          返回首页
        </Link>
      </p>
    </div>
  );
}
