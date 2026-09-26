import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center",
      className,
    )}
  >
    {icon && (
      <div className="rounded-full bg-muted p-3 text-muted-foreground [&_svg]:size-6">{icon}</div>
    )}
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);
