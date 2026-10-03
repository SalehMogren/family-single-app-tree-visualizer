"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Download, FileJson, FileSpreadsheet, FileUp, Loader2 } from "lucide-react";
import {
  csvTemplate,
  CsvImportError,
  fromCsv,
  parseFamilyData,
  type CsvRowIssue,
  type FamilyData,
} from "@family/core";
import type { BackupInfo } from "@family/data";
import { format, formatDate, lookup } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@family/ui/components/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@family/ui/components/alert";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@family/ui/components/card";
import { EmptyState } from "@family/ui/components/empty-state";
import { toast } from "@family/ui/lib/toast";
import { importFamilyAction, restoreBackupAction } from "@/lib/actions";
import { useFamilyStore } from "@/lib/family-store";

export const DataManager = ({ backups }: { backups: BackupInfo[] }) => {
  const { dict, locale } = useI18n();
  const t = dict.admin.data;
  const router = useRouter();
  const reset = useFamilyStore((s) => s.reset);
  const flush = useFamilyStore((s) => s.flush);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{
    raw: unknown;
    data: FamilyData;
    dropped: number;
    migrated: boolean;
    csvIssues: CsvRowIssue[];
  } | null>(null);
  const [restoreFile, setRestoreFile] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const isCsv = /\.(csv|tsv|txt)$/i.test(file.name) || file.type.includes("csv");
      if (isCsv) {
        // Parsed in the browser for preview; the server re-validates on import.
        const { data, issues } = fromCsv(text);
        setPreview({ raw: data, ...parseFamilyData(data), csvIssues: issues });
      } else {
        const raw = JSON.parse(text);
        setPreview({ raw, ...parseFamilyData(raw), csvIssues: [] });
      }
      requestAnimationFrame(() =>
        document
          .getElementById("import-preview")
          ?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
    } catch (error) {
      toast.error(error instanceof CsvImportError ? dict.csv[error.code] : dict.issues.invalidFile);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleImport = () =>
    startTransition(async () => {
      if (!preview) return;
      await flush();
      const result = await importFamilyAction(preview.raw);
      if (!result.ok) {
        toast.error(lookup(dict.issues, result.code, dict.common.error));
        return;
      }
      reset(result.value.data);
      toast.success(dict.admin.data.imported);
      setPreview(null);
      router.refresh();
    });

  const handleRestore = () =>
    startTransition(async () => {
      if (!restoreFile) return;
      await flush();
      const result = await restoreBackupAction(restoreFile);
      setRestoreFile(null);
      if (!result.ok) {
        toast.error(lookup(dict.issues, result.code, dict.common.error));
        return;
      }
      if (!restoreFile.startsWith("site-")) {
        const response = await fetch("/api/export?format=json", { cache: "no-store" });
        if (response.ok) reset(await response.json());
      }
      toast.success(t.restored);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.exportTitle}</CardTitle>
            <CardDescription>{t.exportHint}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href="/api/export?format=json" download>
                <FileJson /> {dict.tree.exportJson}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export?format=csv" download>
                <FileSpreadsheet /> {dict.tree.exportCsv}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export?format=gedcom" download>
                <Download /> {dict.tree.exportGedcom}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export?kind=site" download>
                <FileJson /> {dict.admin.content.title}
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.importTitle}</CardTitle>
            <CardDescription>{t.importHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,text/csv,.csv,.tsv"
              className="sr-only"
              id="import-file"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp /> {t.chooseCsvFile}
            </Button>
            {preview && (
              <Alert id="import-preview" className="scroll-mt-24">
                <FileJson />
                <AlertTitle>
                  {format(t.importPreview, {
                    members: Object.keys(preview.data.members).length,
                    relationships: preview.data.relationships.length,
                  })}
                </AlertTitle>
                <AlertDescription>
                  {preview.migrated && <p>{t.migrated}</p>}
                  {preview.dropped > 0 && <p>{format(t.dropped, { count: preview.dropped })}</p>}
                  {preview.csvIssues.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <p className="font-medium text-foreground">
                        {format(t.csvIssues, {
                          count: new Set(preview.csvIssues.map((i) => i.row)).size,
                        })}
                      </p>
                      <ul className="max-h-40 list-inside list-disc overflow-y-auto text-xs">
                        {preview.csvIssues.map((issue) => (
                          <li key={`${issue.row}-${issue.code}-${issue.value ?? ""}`}>
                            {format(t.csvRow, { row: issue.row })}:{" "}
                            {format(dict.csv[issue.code], { value: issue.value ?? "" })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleImport}
                      disabled={pending}
                    >
                      {pending && <Loader2 className="animate-spin" />}
                      {t.importConfirm}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                      {dict.common.cancel}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="csv" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-success" /> {t.csvTitle}
          </CardTitle>
          <CardDescription>{t.csvHint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href="/api/export?format=csv" download>
                <Download /> {t.exportCsv}
              </a>
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp /> {dict.admin.members.importCsv}
            </Button>
            <Button variant="ghost" asChild>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate())}`}
                download="family-members-template.csv"
              >
                <FileSpreadsheet /> {t.downloadTemplate}
              </a>
            </Button>
          </div>
          <p
            dir="ltr"
            className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-nowrap text-muted-foreground"
          >
            id,name,gender,birthYear,deathYear,isDeceased,fatherId,motherId,spouseIds,…
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.backups}</CardTitle>
          <CardDescription>{t.backupsHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <EmptyState icon={<ArchiveRestore />} title={t.noBackups} />
          ) : (
            <ul className="divide-y">
              {backups.map((backup) => (
                <li key={backup.file} className="flex items-center gap-3 py-2.5">
                  <Badge variant={backup.kind === "family" ? "secondary" : "outline"}>
                    {backup.kind === "family" ? t.kindFamily : t.kindSite}
                  </Badge>
                  <span className="flex-1 text-sm tabular-nums">
                    {formatDate(locale, backup.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    })}
                  </span>
                  <span
                    className="hidden text-xs text-muted-foreground tabular-nums sm:inline"
                    dir="ltr"
                  >
                    {(backup.size / 1024).toFixed(1)} KB
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setRestoreFile(backup.file)}>
                    <ArchiveRestore /> {t.restore}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!restoreFile} onOpenChange={(open) => !open && setRestoreFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.restore}</AlertDialogTitle>
            <AlertDialogDescription>{t.restoreConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>{t.restore}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
