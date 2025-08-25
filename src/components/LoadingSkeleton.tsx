interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`bg-slate-200 rounded ${className}`}></div>
  );
}

interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className = '' }: StatCardSkeletonProps) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <LoadingSkeleton className="w-10 h-10 rounded-xl" />
        <LoadingSkeleton className="w-12 h-6 rounded-full" />
      </div>
      <LoadingSkeleton className="w-20 h-8 mb-1" />
      <LoadingSkeleton className="w-24 h-4 mb-3" />
      <div className="progress-bar">
        <LoadingSkeleton className="w-full h-full rounded-full" />
      </div>
    </div>
  );
}