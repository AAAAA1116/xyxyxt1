"use client";

import { useState, useMemo, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function getEmailRedirectTo(next: string): string {
  if (typeof window === "undefined") return "/auth/callback";
  // 关键：必须与当前访问 /auth 的 origin 一致，否则 PKCE verifier cookie 带不回 /auth/callback
  // 例：用 127.0.0.1 打开站点但回跳写死 localhost，会导致 “PKCE code verifier not found”
  const base =
    process.env.NODE_ENV === "development"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const path = next && next !== "/" ? `/auth/callback?next=${encodeURIComponent(next)}` : "/auth/callback";
  return `${base}${path}`;
}

function formatError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "Failed to fetch") {
      return "无法连接 Supabase：可能是网络/代理/被插件拦截或 URL 配置错误。若在国内，可尝试开启 VPN 或系统代理后重试。";
    }
    if (e.message.includes("PKCE code verifier not found")) {
      return "PKCE 校验失败：通常是登录链接在不同浏览器/设备打开，或回跳域名与当前访问 /auth 的域名不一致（如 127.0.0.1 vs localhost）。请在同一浏览器里重新发送并打开邮件链接。";
    }
    return e.message;
  }
  return String(e);
}

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "otp">("request");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
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

  const sendOtp = async () => {
    setError("");
    setInfo("");
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
      });
      if (err) throw err;
      setStep("otp");
      setInfo(`验证码已发送至 ${trimmed}，请在 10 分钟内输入。`);
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

  const sendMagicLink = async () => {
    setError("");
    setInfo("");
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
      setInfo(`已向 ${trimmed} 发送 Magic Link，点击邮件中的链接也可以完成登录。`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[AuthForm signInWithOtp][magic-link]", {
        name: e instanceof Error ? e.name : "unknown",
        message: msg,
        cause: e instanceof Error ? e.cause : undefined,
      });
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (!supabase) return;
    if (!email.trim()) {
      setError("请先输入邮箱并发送验证码");
      return;
    }
    if (!otp.trim() || otp.trim().length < 6) {
      setError("请输入收到的验证码（至少 6 位）");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const token = otp.trim();

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token,
        type: "email",
      });
      if (err) {
        const msg = err.message.toLowerCase();
        if (msg.includes("expired")) {
          setError("验证码已过期，请重新发送。");
        } else if (msg.includes("invalid") || msg.includes("otp")) {
          setError("验证码不正确，请检查后重试。");
        } else {
          setError(err.message);
        }
        return;
      }
      // 登录成功
      setInfo("");
      router.push(next);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[AuthForm verifyOtp]", {
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

      {info && !error && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          {info}
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />

      {step === "request" && (
        <>
          <button
            onClick={sendOtp}
            disabled={loading || !configOk}
            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "发送中..." : "发送验证码（推荐）"}
          </button>
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={loading || !configOk}
            className="mt-2 w-full py-3 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm hover:bg-indigo-50 disabled:opacity-50"
          >
            使用 Magic Link 登录（需要在同一浏览器打开链接）
          </button>
        </>
      )}

      {step === "otp" && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            邮箱验证码
            <span className="ml-1 text-xs text-gray-400">(一般为 8 位数字)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
        maxLength={8}
            value={otp}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/\D/g, "");
          setOtp(cleaned.slice(0, 8));
        }}
        placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tracking-[0.35em] text-center text-lg font-mono"
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || !configOk || otp.trim().length < 6}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "验证中..." : "登录"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("request"); setOtp(""); }}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700"
          >
            收不到验证码？返回重新发送
          </button>
        </div>
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
