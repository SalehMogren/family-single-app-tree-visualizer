import { LinkData } from "../types";

interface LinkProps {
  link: LinkData;
}

export function Link({ link }: LinkProps) {
  const { source, target, type, d } = link;

  return (
    <path
      d={d}
      fill='none'
      stroke={
        source.isPlaceholder || target.isPlaceholder
          ? "#9CA3AF"
          : type === "spouse"
          ? "#F59E0B"
          : "#D4AF37"
      }
      strokeWidth={2}
      strokeDasharray={
        source.isPlaceholder || target.isPlaceholder ? "5,5" : "none"
      }
      opacity={source.isPlaceholder || target.isPlaceholder ? 0.8 : 0.7}
    />
  );
}
