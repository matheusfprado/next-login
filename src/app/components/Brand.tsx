import Image from "next/image";

import clsx from "clsx";

interface BrandProps {
  compact?: boolean;
  subtitle?: string;
}

export default function Brand({ compact = false, subtitle }: BrandProps) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icon.png"
        alt="Logo InvestHub"
        width={40}
        height={40}
        priority
        className={clsx("shrink-0 rounded-xl", compact ? "size-7" : "size-10")}
      />
      <div>
        <p
          className={clsx(
            "bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text font-extrabold tracking-tight text-transparent",
            compact ? "text-lg" : "text-xl"
          )}
        >
          InvestHub
        </p>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
    </div>
  );
}
