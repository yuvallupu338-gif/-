import { AuthForm } from "@/components/auth-form";
import { text } from "@/lib/consultant/shared";
import { uiLocale } from "@/server/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const locale = await uiLocale();
  const { next } = await searchParams;
  return (
    <AuthForm
      mode="login"
      locale={locale}
      nextPath={next ?? "/app"}
      title={text(locale, "כניסה לסטודיו", "Enter the studio")}
      alternate={{ href: `/register?next=${encodeURIComponent(next ?? "/app")}`, label: text(locale, "אין חשבון? פתיחה", "No account? Create one") }}
    />
  );
}
