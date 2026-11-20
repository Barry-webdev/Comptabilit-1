export default function LoadingSpinner({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#176B45] mr-3" />
      <span className="text-sm text-[#64748B]">{message}</span>
    </div>
  );
}
