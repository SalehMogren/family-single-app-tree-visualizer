import { Skeleton } from "@family/ui/components/skeleton";

const TreeLoading = () => (
  <div className="relative h-[calc(100dvh-4rem)] bg-tree-canvas p-3">
    <Skeleton className="h-9 w-72" />
    <div className="absolute inset-0 grid place-items-center">
      <div className="grid grid-cols-3 gap-8 opacity-60">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-40 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export default TreeLoading;
