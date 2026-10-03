import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { SiteContent } from "@family/core";
import type { Dictionary } from "@family/i18n";
import { LogoMark } from "./logo";

export const SiteFooter = ({
  site,
  familyName,
  dict,
}: {
  site: SiteContent;
  familyName: string;
  dict: Dictionary;
}) => {
  const { contact, features } = site.settings;
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 font-display text-xl font-bold">
            <LogoMark className="size-8" />
            {familyName}
          </div>
          <p className="text-sm text-muted-foreground">{dict.common.poweredBy}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="footer">
          <Link className="text-muted-foreground hover:text-foreground" href="/tree">
            {dict.nav.tree}
          </Link>
          {features.directory && (
            <Link className="text-muted-foreground hover:text-foreground" href="/members">
              {dict.nav.members}
            </Link>
          )}
          {features.timeline && (
            <Link className="text-muted-foreground hover:text-foreground" href="/timeline">
              {dict.nav.timeline}
            </Link>
          )}
        </nav>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {contact.location && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {contact.location}
            </li>
          )}
          {contact.email && (
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <a className="hover:text-foreground" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
          )}
          {contact.phone && (
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <a
                className="hover:text-foreground"
                dir="ltr"
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
              >
                {contact.phone}
              </a>
            </li>
          )}
        </ul>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {year} {familyName}. {dict.common.rights}
      </div>
    </footer>
  );
};
