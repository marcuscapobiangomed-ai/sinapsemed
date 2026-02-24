"use client";

import { useRouter } from "next/navigation";

interface BancaFilterProps {
  bancas: string[];
  active: string | null;
}

export function BancaFilter({ bancas, active }: BancaFilterProps) {
  const router = useRouter();

  if (bancas.length === 0) return null;

  function handleClick(banca: string) {
    if (active === banca) {
      router.push("/review");
    } else {
      router.push(`/review?banca=${encodeURIComponent(banca)}`);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium shrink-0">
        Filtrar por banca:
      </span>
      {bancas.map((banca) => (
        <button
          key={banca}
          onClick={() => handleClick(banca)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            active === banca
              ? "bg-violet-100 text-violet-700 border-violet-300"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-600 hover:bg-violet-50"
          }`}
        >
          🏛️ {banca}
          {active === banca && (
            <span className="ml-1 opacity-60">×</span>
          )}
        </button>
      ))}
    </div>
  );
}
