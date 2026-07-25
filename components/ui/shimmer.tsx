import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}

// Specific shimmer components for common use cases
export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-800 p-6", className)}>
      <div className="space-y-4">
        <Shimmer className="h-6 w-3/4 rounded" />
        <Shimmer className="h-4 w-1/2 rounded" />
        <Shimmer className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function ShimmerButton({ className }: { className?: string }) {
  return <Shimmer className={cn("h-10 w-full rounded-md", className)} />;
}

export function ShimmerBadge({ className }: { className?: string }) {
  return <Shimmer className={cn("h-6 w-20 rounded-full", className)} />;
}

export function ShimmerAvatar({ className }: { className?: string }) {
  return <Shimmer className={cn("h-16 w-16 rounded-full", className)} />;
}

export function ShimmerText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn(
            "h-4 rounded",
            i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function ShimmerPricingCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-800 p-6", className)}>
      <div className="space-y-4">
        {/* Plan name */}
        <Shimmer className="h-8 w-24 rounded mx-auto" />
        
        {/* Price */}
        <Shimmer className="h-12 w-32 rounded mx-auto" />
        
        {/* Features */}
        <div className="space-y-2">
          <Shimmer className="h-4 w-full rounded" />
          <Shimmer className="h-4 w-3/4 rounded" />
          <Shimmer className="h-4 w-2/3 rounded" />
        </div>
        
        {/* Button */}
        <Shimmer className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}

export function ShimmerSubscriptionStatus({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-800 p-6", className)}>
      <div className="space-y-6">
        {/* Title with crown and text stacked on mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <Shimmer className="h-8 w-8 rounded-full" />
          <Shimmer className="h-8 w-64 rounded" />
        </div>
        
        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-3">
              <Shimmer className="h-16 w-16 rounded-full mx-auto" />
              <Shimmer className="h-6 w-24 rounded mx-auto" />
              <Shimmer className="h-4 w-20 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
