import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo";
import { getAdminPassword } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getI18n()).dict.admin.login.title,
});

const LoginPage = async ({ searchParams }: { searchParams: Promise<{ next?: string }> }) => {
  const [{ next }, { dict }] = await Promise.all([searchParams, getI18n()]);
  const usingDevPassword = !process.env.ADMIN_PASSWORD && !!getAdminPassword();
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-12" />
          <div>
            <h1 className="text-2xl font-bold">{dict.admin.login.title}</h1>
            <p className="text-sm text-muted-foreground">{dict.admin.login.subtitle}</p>
          </div>
        </div>
        <LoginForm
          next={next ?? "/"}
          hint={usingDevPassword ? dict.admin.login.notConfigured : undefined}
        />
      </div>
    </main>
  );
};

export default LoginPage;
