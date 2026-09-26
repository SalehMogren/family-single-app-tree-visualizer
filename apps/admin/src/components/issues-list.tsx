"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import type { Issue } from "@family/core";
import { format, lookup } from "@family/i18n";
import { useI18n } from "@family/i18n/react";

export const IssuesList = ({ issues }: { issues: Issue[] }) => {
  const { dict } = useI18n();
  if (!issues.length) return null;
  return (
    <ul className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm" aria-live="polite">
      {issues.map((issue) => (
        <li key={issue.code} className="flex items-start gap-2">
          {issue.level === "error" ? (
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          )}
          <span className={issue.level === "error" ? "text-destructive" : ""}>
            {format(lookup(dict.issues, issue.code), issue.params)}
          </span>
        </li>
      ))}
    </ul>
  );
};
