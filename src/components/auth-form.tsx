"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { loginAction, registerAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { Locale } from "@/lib/domain";

export function AuthForm({
  mode,
  locale,
  title,
  nextPath,
  alternate,
}: {
  mode: "login" | "register";
  locale: Locale;
  title: string;
  nextPath: string;
  alternate: { href: string; label: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-sidebar px-12 py-10 text-sidebar-ink lg:flex lg:flex-col">
        <Link href="/"><Wordmark light /></Link>
        <p className="mt-auto max-w-md font-serif text-4xl leading-tight">{text(locale, "החשבון שומר את הפרויקטים על השרת הזה. אין כאן מנוי מומצא.", "The account keeps projects on this server. There is no invented subscription.")}</p>
      </section>
      <section className="flex flex-col px-6 py-8 md:px-12">
        <Link href="/" className="lg:hidden"><Wordmark /></Link>
        <form
          className="mx-auto my-auto w-full max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              const result = mode === "login" ? await loginAction(data) : await registerAction(data);
              if (result && !result.ok) setError(result.error);
            });
          }}
        >
          <h1 className="font-serif text-4xl">{title}</h1>
          <input type="hidden" name="next" value={nextPath} />
          <div className="mt-8 grid gap-4">
            {mode === "register" && (
              <div>
                <Label htmlFor="name">{text(locale, "שם", "Name")}</Label>
                <Input id="name" name="name" required autoComplete="name" />
              </div>
            )}
            <div>
              <Label htmlFor="email">{text(locale, "אימייל", "Email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">{text(locale, "סיסמה", "Password")}</Label>
              <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
          <Button className="mt-6 w-full" type="submit" disabled={pending} size="lg">
            {pending ? text(locale, "רגע", "One moment") : title}
          </Button>
          <Link href={alternate.href} className="mt-4 inline-block text-sm text-muted">{alternate.label}</Link>
        </form>
      </section>
    </div>
  );
}
