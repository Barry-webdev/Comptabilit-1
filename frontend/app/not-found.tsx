import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-bg">
      {/* Logo */}
      <Image
        src="/Logo.gif"
        alt="Logo GSAB"
        width={80}
        height={80}
        className="rounded-full"
        priority
      />

      {/* Code 404 */}
      <p className="text-8xl font-extrabold leading-none text-primary">
        404
      </p>

      {/* Titre */}
      <h1 className="text-2xl font-bold text-center text-dark">
        Page introuvable
      </h1>

      {/* Message */}
      <p className="text-sm text-center max-w-sm text-muted">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>

      {/* Bouton retour */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-3 rounded-xl transition shadow-sm"
      >
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}
