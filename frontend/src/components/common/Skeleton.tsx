interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex gap-4">
          <Skeleton variant="text" width={80} height={14} />
          <Skeleton variant="text" width={60} height={14} />
        </div>
        <Skeleton variant="rectangular" width="100%" height={8} className="rounded-full mt-3" />
      </div>
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" width="70%" height={20} className="mb-2" />
          <Skeleton variant="text" width="50%" height={14} />
        </div>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={60} height={14} />
      </div>
      <div className="pt-3 border-t border-gray-100">
        <Skeleton variant="rectangular" width="100%" height={6} className="rounded-full" />
        <div className="flex justify-between mt-2">
          <Skeleton variant="text" width={60} height={12} />
          <Skeleton variant="text" width={40} height={12} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonSessionCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" width="50%" height={18} className="mb-1" />
          <Skeleton variant="text" width="70%" height={14} className="mb-3" />
          <Skeleton variant="rectangular" width="60%" height={6} className="rounded-full" />
          <Skeleton variant="text" width={100} height={12} className="mt-1" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={70} height={32} className="rounded-lg" />
          <Skeleton variant="rectangular" width={70} height={32} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="25%" height={12} />
          </div>
          <Skeleton variant="rectangular" width={80} height={28} className="rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboardHeader() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton variant="text" width={200} height={32} className="bg-gray-300/50 mb-2" />
          <Skeleton variant="text" width={280} height={16} className="bg-gray-300/50" />
        </div>
        <Skeleton variant="rectangular" width={140} height={40} className="rounded-xl bg-gray-300/50" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-300/30 rounded-xl p-4">
            <Skeleton variant="text" width={60} height={28} className="bg-gray-300/50 mb-1" />
            <Skeleton variant="text" width={80} height={14} className="bg-gray-300/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
