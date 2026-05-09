import { useEffect, useState } from "react";

const titles: string[] = [
  "Receiving shipped orders",
  "Receiving shipped orders  .",
  "Receiving shipped orders  ..",
  "Receiving shipped orders  ..."
];

export default function LoadingMessage() {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-[22ch] tracking-tighter">
      <div>{titles[index]}</div>
    </div>
  );
}
