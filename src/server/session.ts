import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/domain";
import { getDb } from "@/lib/db";
import { userForSession } from "@/lib/repo";

export const SESSION_COOKIE = "ll_session";

export async function cookieJar() {
  return cookies();
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function currentUser() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return userForSession(getDb(), sessionId);
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function uiLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get("ll_locale")?.value;
  if (value === "en" || value === "he") return value;
  const user = await currentUser();
  return user?.locale === "en" ? "en" : "he";
}

export async function uiTheme() {
  const jar = await cookies();
  const value = jar.get("ll_theme")?.value;
  return value === "dark" ? "dark" : "light";
}

export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/app") || value.startsWith("//")) return "/app";
  return value;
}
