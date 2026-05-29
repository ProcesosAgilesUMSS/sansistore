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
    }, 400);

    return () => clearInterval(timer);
  }, []);

  const length = text.length;

  return (
    <div className={`tracking-tighter w-[${length}ch]`}>
      <div className="flex gap-2">
        {text}
        <div>
          {titles[index]}
        </div>
      </div>
    </div>
  );
}


