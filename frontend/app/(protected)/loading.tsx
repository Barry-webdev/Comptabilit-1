export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-bg">
      {/* Initiales stylisées */}
      <span className="text-4xl font-extrabold tracking-widest text-primary select-none">
        GSAB
      </span>

      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />

      {/* Texte */}
      <p className="text-sm font-medium text-dark">Chargement…</p>
    </div>
  );
}
