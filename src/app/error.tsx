"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="font-serif text-4xl">משהו נעצר</h1>
      <p className="mt-3 text-muted">הפעולה לא הושלמה. אפשר לנסות שוב בלי לאבד מה שכבר נשמר.</p>
      <button type="button" className="mt-6 border border-line px-4 py-2" onClick={() => reset()}>נסיון נוסף</button>
    </main>
  );
}
