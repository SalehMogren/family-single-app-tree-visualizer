"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity,
  DatabaseBackup,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Settings,
  Users,
} from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { LocaleToggle } from "@family/ui/components/locale-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@family/ui/components/sheet";
import { ThemeToggle } from "@family/ui/components/theme-toggle";
import { cn } from "@family/ui/lib/utils";
import { logoutAction, setLocaleAction } from "@/lib/actions";
import { LogoMark } from "./logo";
import { SaveStatus } from "./save-status";

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { dict } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: "/", label: dict.nav.dashboard, icon: LayoutDashboard },
    { href: "/editor", label: dict.nav.editor, icon: Network },
    { href: "/members", label: dict.nav.members, icon: Users },
    { href: "/content", label: dict.nav.content, icon: FileText },
    { href: "/settings", label: dict.nav.settings, icon: Settings },
    { href: "/data", label: dict.nav.data, icon: DatabaseBackup },
    { href: "/activity", label: dict.nav.activity, icon: Activity },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="flex flex-col gap-0.5" aria-label="admin">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            isActive(href) && "bg-sidebar-accent text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
};

export const AdminShell = ({
  familyName,
  webUrl,
  children,
}: {
  familyName: string;
  webUrl: string;
  children: ReactNode;
}) => {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLocaleChange = async (next: "ar" | "en") => {
    await setLocaleAction(next);
    router.refresh();
  };

  const brand = (
    <div className="flex items-center gap-2.5 px-2">
      <LogoMark className="size-8" />
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-lg font-bold">{familyName}</p>
        <p className="text-xs text-muted-foreground">{dict.common.adminName}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="mt-auto flex flex-col gap-1">
      <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" asChild>
        <a href={webUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
          {dict.nav.viewSite}
        </a>
      </Button>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="size-4 rtl:rotate-180" />
          {dict.nav.logout}
        </Button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-e bg-sidebar p-4 lg:flex">
        {brand}
        <SidebarNav />
        {footer}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={dict.common.openMenu}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="start"
              closeLabel={dict.common.close}
              className="w-72 gap-6 bg-sidebar p-4"
            >
              <SheetTitle className="sr-only">{dict.common.adminName}</SheetTitle>
              {brand}
              <SidebarNav onNavigate={() => setOpen(false)} />
              {footer}
            </SheetContent>
          </Sheet>
          <SaveStatus />
          <div className="ms-auto flex items-center gap-1">
            <LocaleToggle
              locale={locale}
              label={dict.common.language}
              onChange={handleLocaleChange}
            />
            <ThemeToggle labels={dict.common} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
