import { useEffect, useState } from "react";

const titles: string[] = [
  "",
  ".",
  "..",
  "..."
];

export default function LoadingMessage({ text }: { text: string }) {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 600);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-[22ch] tracking-tighter">
      <div className="flex gap-4">
        {text}
        <div>
          {titles[index]}
        </div>
      </div>
    </div>
  );
}


