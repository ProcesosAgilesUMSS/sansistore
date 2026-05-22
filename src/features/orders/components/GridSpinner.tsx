const sizeClasses = {
  4: "size-4",
  4.5: "size-4.5",
  5: "size-5",
  6: "size-6",
} as const;

export default function GridSpinner({ size = 6 }: { size?: keyof typeof sizeClasses }) {
  return (
    <div className={`grid grid-cols-3 ${sizeClasses[size]}`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="bg-black/80 animate-pulse"
          style={{
            animationDelay: `${(i * 137.5) % 600}ms`,
            animationDuration: "800ms",
          }}
        />
      ))}
    </div>
  );
}
