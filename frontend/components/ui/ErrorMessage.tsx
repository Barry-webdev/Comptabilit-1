export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
      <p className="text-sm text-red-700">⚠ {message}</p>
    </div>
  );
}
