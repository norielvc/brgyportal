import { cn } from "@/lib/utils";

export default function LoadingSpinner({ size = "md", className }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary-600",
        sizeClasses[size],
        className,
      )}
    />
  );
}

export function LoadingPage({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

export function LoadingCard({ message = "Loading..." }) {
  return (
    <div className="card">
      <div className="card-body flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
