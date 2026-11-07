import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="font-serif text-4xl">404</h1>
      <p className="mt-3 text-muted">העמוד לא נמצא.</p>
      <Link href="/" className="mt-6 inline-block underline-offset-4 hover:underline">LaunchLab</Link>
    </main>
  );
}
