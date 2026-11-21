/**
 * Skeleton générique avec animation pulse.
 * Utilisé comme état de chargement à la place d'un spinner pour
 * donner une perception de chargement plus rapide (structure visible).
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-[#E2E8F0] ${className}`}
    />
  );
}
