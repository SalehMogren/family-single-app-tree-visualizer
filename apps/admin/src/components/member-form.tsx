"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { memberInputSchema, type Member, type MemberInput } from "@family/core";
import { lookup } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { Input } from "@family/ui/components/input";
import { Label } from "@family/ui/components/label";
import { Switch } from "@family/ui/components/switch";
import { Textarea } from "@family/ui/components/textarea";
import { ToggleGroup, ToggleGroupItem } from "@family/ui/components/toggle-group";

type Draft = Record<keyof MemberInput, string | boolean>;

const toDraft = (m?: Partial<Member>): Draft => ({
  name: m?.name ?? "",
  gender: m?.gender ?? "male",
  birthYear: m?.birthYear ? String(m.birthYear) : "",
  deathYear: m?.deathYear ? String(m.deathYear) : "",
  isDeceased: !!(m?.isDeceased || m?.deathYear),
  nickname: m?.nickname ?? "",
  occupation: m?.occupation ?? "",
  birthplace: m?.birthplace ?? "",
  residence: m?.residence ?? "",
  bio: m?.bio ?? "",
  photoUrl: m?.photoUrl ?? "",
});

const toInput = (d: Draft): unknown => ({
  name: d.name,
  gender: d.gender,
  birthYear: d.birthYear ? Number(d.birthYear) : null,
  deathYear: d.isDeceased && d.deathYear ? Number(d.deathYear) : null,
  isDeceased: !!d.isDeceased,
  nickname: d.nickname || undefined,
  occupation: d.occupation || undefined,
  birthplace: d.birthplace || undefined,
  residence: d.residence || undefined,
  bio: d.bio || undefined,
  photoUrl: d.photoUrl || undefined,
});

export const MemberForm = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDraftChange,
  children,
  compact = false,
}: {
  initial?: Partial<Member>;
  submitLabel: string;
  onSubmit: (input: MemberInput) => void;
  onCancel?: () => void;
  /** Called with the parsed-so-far values (for live relationship validation). */
  onDraftChange?: (draft: Pick<Member, "name" | "gender" | "birthYear" | "deathYear">) => void;
  /** Extra fields rendered before the submit button. */
  children?: ReactNode;
  compact?: boolean;
}) => {
  const { dict } = useI18n();
  const id = useId();
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const update = (key: keyof Draft, value: string | boolean) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    onDraftChange?.({
      name: String(next.name),
      gender: next.gender as Member["gender"],
      birthYear: next.birthYear ? Number(next.birthYear) : null,
      deathYear: next.isDeceased && next.deathYear ? Number(next.deathYear) : null,
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = memberInputSchema.safeParse(toInput(draft));
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [
            String(i.path[0]),
            lookup(dict.issues, i.message, dict.issues.invalidYear),
          ]),
        ),
      );
      return;
    }
    onSubmit(parsed.data);
  };

  const field = (
    key: keyof Draft,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${id}-${key}`}>{label}</Label>
      <Input
        id={`${id}-${key}`}
        value={String(draft[key])}
        onChange={(e) => update(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
        {...props}
      />
      {errors[key] && (
        <p id={`${id}-${key}-error`} className="text-xs text-destructive">
          {errors[key]}
        </p>
      )}
    </div>
  );

  const yearProps = {
    type: "number",
    inputMode: "numeric" as const,
    min: 1,
    max: 3000,
    dir: "ltr",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        {field("name", dict.member.name, { autoFocus: true, required: true, autoComplete: "off" })}
        <div className="space-y-1.5">
          <Label id={`${id}-gender`}>{dict.member.gender}</Label>
          <ToggleGroup
            type="single"
            value={String(draft.gender)}
            onValueChange={(v) => v && update("gender", v)}
            aria-labelledby={`${id}-gender`}
            className="h-9"
          >
            <ToggleGroupItem
              value="male"
              className="data-[state=on]:bg-male/15 data-[state=on]:text-male"
            >
              {dict.common.male}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="female"
              className="data-[state=on]:bg-female/15 data-[state=on]:text-female"
            >
              {dict.common.female}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field("birthYear", dict.member.birthYear, yearProps)}
        <div className="space-y-1.5">
          <div className="flex h-3.5 items-center justify-between gap-2">
            <Label htmlFor={`${id}-deathYear`}>{dict.member.deathYear}</Label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Switch
                checked={!!draft.isDeceased}
                onCheckedChange={(v) => update("isDeceased", v)}
                aria-label={dict.member.isDeceased}
                className="scale-75"
              />
              {dict.member.isDeceased}
            </label>
          </div>
          <Input
            id={`${id}-deathYear`}
            value={String(draft.deathYear)}
            onChange={(e) => update("deathYear", e.target.value)}
            disabled={!draft.isDeceased}
            aria-invalid={!!errors.deathYear}
            {...yearProps}
          />
          {errors.deathYear && <p className="text-xs text-destructive">{errors.deathYear}</p>}
        </div>
      </div>
      {!compact && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("nickname", dict.member.nickname)}
            {field("occupation", dict.member.occupation)}
            {field("birthplace", dict.member.birthplace)}
            {field("residence", dict.member.residence)}
          </div>
          {field("photoUrl", dict.member.photoUrl, {
            type: "url",
            dir: "ltr",
            placeholder: "https://",
          })}
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-bio`}>{dict.member.bio}</Label>
            <Textarea
              id={`${id}-bio`}
              value={String(draft.bio)}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
            />
          </div>
        </>
      )}
      {children}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {dict.common.cancel}
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
};
