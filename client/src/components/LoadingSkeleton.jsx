const LoadingSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-surface rounded"
          style={{ width: `${85 - index * 10}%` }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
