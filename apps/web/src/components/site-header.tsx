"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import type { SiteSettings } from "@family/core";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { LocaleToggle } from "@family/ui/components/locale-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@family/ui/components/sheet";
import { ThemeToggle } from "@family/ui/components/theme-toggle";
import { cn } from "@family/ui/lib/utils";
import { setLocaleAction } from "@/lib/actions";
import { LogoMark } from "./logo";

export const SiteHeader = ({
  familyName,
  features,
}: {
  familyName: string;
  features: SiteSettings["features"];
}) => {
  const { dict, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: dict.nav.home, show: true },
    { href: "/tree", label: dict.nav.tree, show: true },
    { href: "/members", label: dict.nav.members, show: features.directory },
    { href: "/timeline", label: dict.nav.timeline, show: features.timeline },
  ].filter((l) => l.show);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const handleLocaleChange = async (next: "ar" | "en") => {
    await setLocaleAction(next);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-xl font-bold"
          aria-label={dict.nav.home}
        >
          <LogoMark className="size-8" />
          <span className="truncate">{familyName}</span>
        </Link>
        <nav aria-label="primary" className="ms-6 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isActive(link.href) && "bg-accent text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          {features.directory && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/members" aria-label={dict.common.search}>
                <Search />
              </Link>
            </Button>
          )}
          <LocaleToggle
            locale={locale}
            label={dict.common.language}
            onChange={handleLocaleChange}
          />
          <ThemeToggle labels={dict.common} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={dict.common.openMenu}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" closeLabel={dict.common.close} className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{familyName}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent",
                      isActive(link.href) && "bg-accent",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
