"use client";

import { memo, type KeyboardEvent, type MouseEvent } from "react";
import { initials, type Member } from "@family/core";

export type CardLod = "full" | "lite";

export interface TreeCardProps {
  nodeKey: string;
  member: Member;
  x: number;
  y: number;
  width: number;
  height: number;
  role: "blood" | "spouse";
  duplicate?: boolean;
  selected: boolean;
  /** Roving tab stop: exactly one card in the tree is keyboard-focusable. */
  focusable: boolean;
  dimmed: boolean;
  highlighted: boolean;
  collapsed: boolean;
  childCount: number;
  rtl: boolean;
  lod: CardLod;
  showYears: boolean;
  showPhoto: boolean;
  hideDetails: boolean;
  badge?: "error" | "warning" | "info" | null;
  direction: "top-down" | "bottom-up";
  labels: { collapse: string; expand: string; marriedIn: string; deceased: string };
  onSelect: (id: string, key: string) => void;
  onToggle?: (id: string) => void;
  onActivate?: (id: string) => void;
}

const MAX_NAME = 18;

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

const yearsLabel = (m: Member, hideDetails: boolean) => {
  if (hideDetails) return "";
  const from = m.birthYear ? String(m.birthYear) : "";
  const to = m.deathYear ? String(m.deathYear) : m.isDeceased ? "…" : "";
  if (from && to) return `\u2066${from} – ${to}\u2069`;
  if (to) return `– ${to}`;
  return from;
};

/**
 * One person card, drawn in plain SVG (no foreignObject) for crisp rendering,
 * iOS compatibility and export fidelity.
 */
const TreeCardBase = ({
  nodeKey,
  member,
  x,
  y,
  width,
  height,
  role,
  duplicate,
  selected,
  focusable,
  dimmed,
  highlighted,
  collapsed,
  childCount,
  rtl,
  lod,
  showYears,
  showPhoto,
  hideDetails,
  badge,
  direction,
  labels,
  onSelect,
  onToggle,
  onActivate,
}: TreeCardProps) => {
  const left = x - width / 2;
  const top = y - height / 2;
  const accent = member.gender === "male" ? "var(--male)" : "var(--female)";
  const deceased = !!member.deathYear || !!member.isDeceased;
  const avatar = 44;
  const pad = 12;
  const avatarCx = rtl ? left + width - pad - avatar / 2 : left + pad + avatar / 2;
  const textX = rtl ? avatarCx - avatar / 2 - 10 : avatarCx + avatar / 2 + 10;
  const years = showYears ? yearsLabel(member, hideDetails) : "";
  const subtitle =
    role === "spouse" ? labels.marriedIn : member.nickname || member.occupation || "";
  const photo = showPhoto && !hideDetails && member.photoUrl;
  const toggleY = direction === "top-down" ? top + height : top;

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onSelect(member.id, nodeKey);
  };
  const handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onActivate?.(member.id);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (event.key === "Enter" && selected) onActivate?.(member.id);
    else onSelect(member.id, nodeKey);
  };
  const handleToggle = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    if ("key" in event && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggle?.(member.id);
  };

  return (
    <g
      data-node-key={nodeKey}
      data-member-id={member.id}
      role="button"
      tabIndex={focusable ? 0 : -1}
      aria-label={member.name}
      aria-pressed={selected}
      className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      opacity={dimmed ? 0.32 : 1}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {selected && (
        <rect
          x={left - 5}
          y={top - 5}
          width={width + 10}
          height={height + 10}
          rx={18}
          fill="none"
          stroke="var(--ring)"
          strokeWidth={3}
          strokeOpacity={0.55}
        />
      )}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={14}
        fill="var(--card)"
        stroke={highlighted || selected ? accent : "var(--border)"}
        strokeWidth={highlighted || selected ? 2 : 1}
        strokeDasharray={role === "spouse" ? "5 4" : undefined}
      />
      <rect
        x={rtl ? left + width - 5 : left}
        y={top + 12}
        width={5}
        height={height - 24}
        rx={2.5}
        fill={accent}
        opacity={deceased ? 0.45 : 1}
      />
      {lod === "full" ? (
        <>
          <circle cx={avatarCx} cy={y} r={avatar / 2} fill={accent} opacity={0.14} />
          {photo ? (
            <image
              href={member.photoUrl}
              x={avatarCx - avatar / 2}
              y={y - avatar / 2}
              width={avatar}
              height={avatar}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#ft-avatar-clip)"
            />
          ) : (
            <text
              x={avatarCx}
              y={y}
              dy="0.36em"
              textAnchor="middle"
              fontSize={18}
              fontWeight={600}
              fill={accent}
            >
              {initials(member.name)}
            </text>
          )}
          <text
            x={textX}
            y={subtitle || years ? y - 8 : y}
            dy="0.35em"
            textAnchor="start"
            direction={rtl ? "rtl" : "ltr"}
            fontSize={15}
            fontWeight={600}
            fill="var(--card-foreground)"
            opacity={deceased ? 0.8 : 1}
          >
            {truncate(member.name, MAX_NAME)}
          </text>
          {(years || subtitle) && (
            <text
              x={textX}
              y={y + 13}
              dy="0.35em"
              textAnchor="start"
              direction={rtl ? "rtl" : "ltr"}
              fontSize={11.5}
              fill="var(--muted-foreground)"
            >
              {truncate([years, subtitle].filter(Boolean).join(" · "), 26)}
            </text>
          )}
          {duplicate && (
            <circle
              cx={rtl ? left + 12 : left + width - 12}
              cy={top + 12}
              r={4}
              fill="var(--muted-foreground)"
            >
              <title>{labels.marriedIn}</title>
            </circle>
          )}
        </>
      ) : (
        <text
          x={x}
          y={y}
          dy="0.35em"
          textAnchor="middle"
          direction={rtl ? "rtl" : "ltr"}
          fontSize={22}
          fontWeight={700}
          fill="var(--card-foreground)"
        >
          {truncate(member.name, 12)}
        </text>
      )}
      {badge && (
        <circle
          cx={rtl ? left + 10 : left + width - 10}
          cy={top + height - 10}
          r={5}
          fill={
            badge === "error"
              ? "var(--destructive)"
              : badge === "warning"
                ? "var(--warning)"
                : "var(--ring)"
          }
        />
      )}
      {role === "blood" && childCount > 0 && onToggle && (
        <g
          role="button"
          tabIndex={-1}
          aria-label={collapsed ? labels.expand : labels.collapse}
          aria-expanded={!collapsed}
          className="cursor-pointer"
          onClick={handleToggle}
          onKeyDown={handleToggle}
        >
          <circle cx={x} cy={toggleY} r={11} fill="var(--card)" stroke="var(--border)" />
          <text
            x={x}
            y={toggleY}
            dy="0.35em"
            textAnchor="middle"
            fontSize={collapsed ? 10 : 14}
            fontWeight={600}
            fill="var(--muted-foreground)"
          >
            {collapsed ? `+${childCount}` : "−"}
          </text>
        </g>
      )}
    </g>
  );
};

export const TreeCard = memo(TreeCardBase);
