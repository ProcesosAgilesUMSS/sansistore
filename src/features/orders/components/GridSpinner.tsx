export default function GridSpinner() {
  return (
    <div className="grid grid-cols-3 size-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="bg-black/90 animate-pulse"
          style={{
            animationDelay: `${(i * 137.5) % 600}ms`,
            animationDuration: "800ms",
          }}
        />
      ))}
    </div>
  );
}
