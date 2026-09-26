"use client";

import { useState } from "react";
import { CalendarPlus, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createId,
  timelineEventSchema,
  timelineEventTypeSchema,
  type FamilyBrief,
  type Locale,
  type SiteContent,
  type TimelineEvent,
} from "@family/core";
import { formatPartialDate, lookup, pickLocalized } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@family/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@family/ui/components/dialog";
import { EmptyState } from "@family/ui/components/empty-state";
import { Input } from "@family/ui/components/input";
import { Label } from "@family/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@family/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@family/ui/components/tabs";
import { Textarea } from "@family/ui/components/textarea";
import { useFamilyStore } from "@/lib/family-store";
import { useSiteEditor } from "@/lib/use-site-editor";
import { PersonPicker } from "./person-picker";
import { SaveBar } from "./save-bar";

const BriefForm = ({
  brief,
  lang,
  onChange,
}: {
  brief: FamilyBrief;
  lang: Locale;
  onChange: (b: FamilyBrief) => void;
}) => {
  const { dict } = useI18n();
  const t = dict.admin.content;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const text = (key: keyof FamilyBrief, label: string, multiline = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${lang}-${key}`}>{label}</Label>
      {multiline ? (
        <Textarea
          id={`${lang}-${key}`}
          dir={dir}
          rows={4}
          value={brief[key] as string}
          onChange={(e) => onChange({ ...brief, [key]: e.target.value })}
        />
      ) : (
        <Input
          id={`${lang}-${key}`}
          dir={dir}
          value={brief[key] as string}
          onChange={(e) => onChange({ ...brief, [key]: e.target.value })}
        />
      )}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {text("familyName", t.familyName)}
        {text("tagline", t.tagline)}
        {text("origin", t.origin)}
        {text("established", t.established)}
      </div>
      {text("description", t.description, true)}
      {text("notableMembers", t.notableMembers, true)}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${lang}-region`}>{t.mainRegion}</Label>
          <Input
            id={`${lang}-region`}
            dir={dir}
            value={brief.geography.mainRegion}
            onChange={(e) =>
              onChange({ ...brief, geography: { ...brief.geography, mainRegion: e.target.value } })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${lang}-geo`}>{t.geographyDescription}</Label>
          <Input
            id={`${lang}-geo`}
            dir={dir}
            value={brief.geography.description}
            onChange={(e) =>
              onChange({ ...brief, geography: { ...brief.geography, description: e.target.value } })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t.achievements}</Label>
        {brief.achievements.map((achievement, i) => (
          <div key={i} className="flex gap-2">
            <Input
              dir={dir}
              value={achievement}
              aria-label={`${t.achievements} ${i + 1}`}
              onChange={(e) =>
                onChange({
                  ...brief,
                  achievements: brief.achievements.map((a, j) => (j === i ? e.target.value : a)),
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={dict.common.delete}
              onClick={() =>
                onChange({ ...brief, achievements: brief.achievements.filter((_, j) => j !== i) })
              }
            >
              <X />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...brief, achievements: [...brief.achievements, ""] })}
        >
          <Plus /> {t.addAchievement}
        </Button>
      </div>
    </div>
  );
};

const emptyEvent = (): TimelineEvent => ({
  id: createId("e"),
  date: String(new Date().getFullYear()),
  type: "family",
  title: { ar: "", en: "" },
  description: { ar: "", en: "" },
  memberIds: [],
});

const EventDialog = ({
  event,
  onSave,
  onClose,
}: {
  event: TimelineEvent;
  onSave: (e: TimelineEvent) => void;
  onClose: () => void;
}) => {
  const { dict, dir } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const t = dict.admin.content;
  const [draft, setDraft] = useState(event);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const parsed = timelineEventSchema.safeParse(draft);
    if (!parsed.success) {
      setError(lookup(dict.issues, parsed.error.issues[0]?.message ?? "", dict.issues.invalidDate));
      return;
    }
    if (!draft.title.ar.trim() && !draft.title.en.trim()) {
      setError(dict.issues.nameRequired);
      return;
    }
    onSave(parsed.data);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl" closeLabel={dict.common.close}>
        <DialogHeader>
          <DialogTitle>{t.editEvent}</DialogTitle>
          <DialogDescription className="sr-only">{t.editEvent}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-date">{t.eventDate}</Label>
            <Input
              id="event-date"
              dir="ltr"
              placeholder={t.eventDateHint}
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value.trim() })}
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.eventType}</Label>
            <Select
              dir={dir}
              value={draft.type}
              onValueChange={(v) => setDraft({ ...draft, type: v as TimelineEvent["type"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timelineEventTypeSchema.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {dict.timeline.types[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(["ar", "en"] as const).map((lang) => (
            <div
              key={lang}
              className="space-y-3 rounded-lg border p-3"
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <Badge variant="secondary">{lang === "ar" ? t.arabic : t.english}</Badge>
              <div className="space-y-1.5">
                <Label htmlFor={`event-title-${lang}`}>{t.eventTitle}</Label>
                <Input
                  id={`event-title-${lang}`}
                  value={draft.title[lang]}
                  onChange={(e) =>
                    setDraft({ ...draft, title: { ...draft.title, [lang]: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`event-desc-${lang}`}>{t.eventDescription}</Label>
                <Textarea
                  id={`event-desc-${lang}`}
                  rows={3}
                  value={draft.description[lang]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      description: { ...draft.description, [lang]: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Label>{t.eventMembers}</Label>
            <div className="flex flex-wrap gap-1.5">
              {draft.memberIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 py-1">
                  {data.members[id]?.name ?? id}
                  <button
                    type="button"
                    aria-label={dict.common.delete}
                    onClick={() =>
                      setDraft({ ...draft, memberIds: draft.memberIds.filter((m) => m !== id) })
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <PersonPicker
              data={data}
              value={null}
              exclude={draft.memberIds}
              onChange={(id) => setDraft({ ...draft, memberIds: [...draft.memberIds, id] })}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {dict.common.cancel}
          </Button>
          <Button onClick={handleSave}>{dict.common.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ContentEditor = ({ initial }: { initial: SiteContent }) => {
  const { dict, locale, dir } = useI18n();
  const t = dict.admin.content;
  const { draft, setDraft, dirty, pending, save, reset } = useSiteEditor(initial, "content.update");
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const events = [...draft.timeline].sort((a, b) => a.date.localeCompare(b.date));

  const handleSaveEvent = (event: TimelineEvent) => {
    const exists = draft.timeline.some((e) => e.id === event.id);
    setDraft({
      ...draft,
      timeline: exists
        ? draft.timeline.map((e) => (e.id === event.id ? event : e))
        : [...draft.timeline, event],
    });
    setEditing(null);
  };

  return (
    <>
      <Tabs defaultValue="brief" dir={dir}>
        <TabsList>
          <TabsTrigger value="brief">{t.brief}</TabsTrigger>
          <TabsTrigger value="timeline">{t.timeline}</TabsTrigger>
        </TabsList>
        <TabsContent value="brief" className="pt-4">
          <Card>
            <CardContent>
              <Tabs defaultValue={locale} dir={dir}>
                <TabsList>
                  <TabsTrigger value="ar">{t.arabic}</TabsTrigger>
                  <TabsTrigger value="en">{t.english}</TabsTrigger>
                </TabsList>
                {(["ar", "en"] as const).map((lang) => (
                  <TabsContent key={lang} value={lang} className="pt-4">
                    <BriefForm
                      brief={draft.brief[lang]}
                      lang={lang}
                      onChange={(b) => setDraft({ ...draft, brief: { ...draft.brief, [lang]: b } })}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t.timeline}</CardTitle>
              <Button size="sm" onClick={() => setEditing(emptyEvent())}>
                <CalendarPlus /> {t.addEvent}
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <EmptyState icon={<CalendarPlus />} title={dict.timeline.empty} />
              ) : (
                <ul className="divide-y">
                  {events.map((event) => (
                    <li key={event.id} className="flex items-center gap-3 py-3">
                      <span className="w-28 shrink-0 text-sm text-muted-foreground tabular-nums">
                        {formatPartialDate(locale, event.date)}
                      </span>
                      <Badge variant="secondary">{dict.timeline.types[event.type]}</Badge>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {pickLocalized(event.title, locale)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={dict.common.edit}
                        onClick={() => setEditing(event)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={dict.common.delete}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            timeline: draft.timeline.filter((e) => e.id !== event.id),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {editing && (
        <EventDialog event={editing} onSave={handleSaveEvent} onClose={() => setEditing(null)} />
      )}
      <SaveBar dirty={dirty} pending={pending} onSave={() => save()} onReset={reset} />
    </>
  );
};
