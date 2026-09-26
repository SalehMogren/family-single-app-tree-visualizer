"use client";

import type { ReactNode } from "react";
import { resolveRootId, setRoot, type SiteContent, type SiteSettings } from "@family/core";
import { useI18n } from "@family/i18n/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@family/ui/components/card";
import { Input } from "@family/ui/components/input";
import { Label } from "@family/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@family/ui/components/select";
import { Switch } from "@family/ui/components/switch";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";
import { useSiteEditor } from "@/lib/use-site-editor";
import { PersonPicker } from "./person-picker";
import { SaveBar } from "./save-bar";

const Row = ({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-6 py-3">
    <div className="space-y-0.5">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </div>
);

export const SettingsForm = ({ initial }: { initial: SiteContent }) => {
  const { dict, dir } = useI18n();
  const t = dict.admin.settings;
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const { draft, setDraft, dirty, pending, save, reset } = useSiteEditor(
    initial,
    "settings.update",
  );
  const s = draft.settings;
  const set = (patch: Partial<SiteSettings>) =>
    setDraft({ ...draft, settings: { ...s, ...patch } });

  const toggle = <G extends "features" | "tree" | "privacy">(
    group: G,
    key: keyof SiteSettings[G],
    label: string,
    hint?: string,
  ) => (
    <Row id={`${group}-${String(key)}`} label={label} hint={hint}>
      <Switch
        id={`${group}-${String(key)}`}
        checked={Boolean(s[group][key])}
        onCheckedChange={(v) =>
          set({ [group]: { ...s[group], [key]: v } } as Partial<SiteSettings>)
        }
      />
    </Row>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.general}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row id="locale" label={t.defaultLocale}>
            <Select
              dir={dir}
              value={s.defaultLocale}
              onValueChange={(v) => set({ defaultLocale: v as "ar" | "en" })}
            >
              <SelectTrigger id="locale" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <div className="space-y-2 py-3">
            <Label htmlFor="root">{t.root}</Label>
            <PersonPicker
              id="root"
              data={data}
              value={resolveRootId(data)}
              onChange={(id) =>
                mutate(
                  (d) => setRoot(d, id),
                  { action: "tree.setRoot", summary: data.members[id]?.name },
                  dict.common.saved,
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.features}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {toggle("features", "brief", t.featureBrief)}
          {toggle("features", "timeline", t.featureTimeline)}
          {toggle("features", "directory", t.featureDirectory)}
          {toggle("features", "stats", t.featureStats)}
          {toggle("features", "export", t.featureExport)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.tree}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row id="direction" label={t.direction}>
            <Select
              dir={dir}
              value={s.tree.direction}
              onValueChange={(v) =>
                set({ tree: { ...s.tree, direction: v as SiteSettings["tree"]["direction"] } })
              }
            >
              <SelectTrigger id="direction" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-down">{dict.tree.topDown}</SelectItem>
                <SelectItem value="bottom-up">{dict.tree.bottomUp}</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          {toggle("tree", "showSpouses", t.showSpouses)}
          {toggle("tree", "showYears", t.showYears)}
          {toggle("tree", "showPhotos", t.showPhotos)}
          <Row id="depth" label={t.initialDepth} hint={t.initialDepthHint}>
            <Input
              id="depth"
              type="number"
              min={0}
              max={50}
              dir="ltr"
              className="w-20"
              value={s.tree.initialDepth}
              onChange={(e) =>
                set({
                  tree: {
                    ...s.tree,
                    initialDepth: Math.max(0, Math.min(50, Number(e.target.value) || 0)),
                  },
                })
              }
            />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.privacy}</CardTitle>
          <CardDescription>{t.hideLivingDetailsHint}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {toggle("privacy", "hideLivingDetails", t.hideLivingDetails, t.hideLivingDetailsHint)}
          {toggle("privacy", "hideSpouses", t.hideSpouses, t.hideSpousesHint)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.contact}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {(["location", "email", "phone"] as const).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`contact-${key}`}>{t[key]}</Label>
              <Input
                id={`contact-${key}`}
                dir={key === "location" ? undefined : "ltr"}
                type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                value={s.contact[key]}
                onChange={(e) => set({ contact: { ...s.contact, [key]: e.target.value } })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} pending={pending} onSave={() => save()} onReset={reset} />
    </div>
  );
};
