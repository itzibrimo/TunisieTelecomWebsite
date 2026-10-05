export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Chargement">
      <div className="text-center space-y-4">
        <div className="relative w-10 h-10 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-accent-cyan animate-spin" />
        </div>
        <p className="text-sm text-muted">Chargement...</p>
      </div>
    </div>
  );
}
