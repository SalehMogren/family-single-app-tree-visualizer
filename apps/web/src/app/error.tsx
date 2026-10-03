"use client";

import { TriangleAlert } from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { EmptyState } from "@family/ui/components/empty-state";

const ErrorPage = ({ reset }: { error: Error; reset: () => void }) => {
  const { dict } = useI18n();
  return (
    <main className="grid min-h-[70dvh] place-items-center p-6">
      <EmptyState
        icon={<TriangleAlert />}
        title={dict.common.error}
        description={dict.common.errorDescription}
        action={<Button onClick={reset}>{dict.common.tryAgain}</Button>}
        className="max-w-md"
      />
    </main>
  );
};

export default ErrorPage;
