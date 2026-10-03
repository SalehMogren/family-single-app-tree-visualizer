"use client";

import Link from "next/link";
import { ArrowDownUp, Download, FileJson, FileSpreadsheet, FileUp } from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@family/ui/components/dropdown-menu";

/** Import / export shortcuts on the members page (import itself lives on the Data page). */
export const MembersIoMenu = () => {
  const { dict, dir } = useI18n();
  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ArrowDownUp /> {dict.admin.members.importExport}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/api/export?format=csv" download>
            <FileSpreadsheet /> {dict.admin.data.exportCsv}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/export?format=json" download>
            <FileJson /> {dict.tree.exportJson}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/export?format=gedcom" download>
            <Download /> {dict.tree.exportGedcom}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/data#csv">
            <FileUp /> {dict.admin.members.importCsv}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
