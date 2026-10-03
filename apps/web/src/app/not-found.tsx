import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@family/ui/components/button";
import { EmptyState } from "@family/ui/components/empty-state";
import { getI18n } from "@/lib/i18n";

const NotFound = async () => {
  const { dict } = await getI18n();
  return (
    <main className="grid min-h-[70dvh] place-items-center p-6">
      <EmptyState
        icon={<Compass />}
        title={dict.common.notFound}
        description={dict.common.notFoundDescription}
        action={
          <Button asChild>
            <Link href="/">{dict.common.goHome}</Link>
          </Button>
        }
        className="max-w-md"
      />
    </main>
  );
};

export default NotFound;
