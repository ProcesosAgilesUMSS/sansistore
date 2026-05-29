export default function OrderStatusBadge({ status }: { status: string }) {
  if (status === "CREADO") {
    return (
      <div className="flex items-center gap-2 border border-black/10 px-2 py-0.5 rounded text-xs font-medium">
        {status}
        <div className="size-1.5 bg-[#FFA500] rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-black/10 px-2 py-0.5 rounded text-xs font-medium uppercase">
      {status} hola
    </div>
  );
}
