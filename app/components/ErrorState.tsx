"use client";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <p className="font-display text-2xl font-bold text-refuted">
        The trial couldn&apos;t continue
      </p>
      <p className="mt-2 text-dim">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-lg bg-accent px-6 py-2.5 font-display font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}