export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="h-4 w-24 bg-line" />
      <div className="mt-4 h-12 w-2/3 bg-line" />
      <div className="mt-8 h-40 bg-line" />
    </div>
  );
}
