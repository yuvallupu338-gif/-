import { AuthForm } from "@/components/auth-form";
import { text } from "@/lib/consultant/shared";
import { uiLocale } from "@/server/session";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const locale = await uiLocale();
  const { next } = await searchParams;
  return (
    <AuthForm
      mode="register"
      locale={locale}
      nextPath={next ?? "/app"}
      title={text(locale, "פתיחת חשבון", "Create an account")}
      alternate={{ href: `/login?next=${encodeURIComponent(next ?? "/app")}`, label: text(locale, "כבר יש חשבון", "I already have an account") }}
    />
  );
}
