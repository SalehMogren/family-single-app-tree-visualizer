#!/usr/bin/env node
/**
 * Sync shadcn/ui components from the official source on GitHub.
 *
 * Why not `shadcn add`? The CLI downloads from ui.shadcn.com, which is not reachable in
 * every environment (e.g. restricted CI/cloud sandboxes). The same component source lives
 * in the shadcn/ui repository, so we fetch it from there, pinned to a commit, and apply:
 *
 *   1. import rewrites for this package's layout,
 *   2. an RTL transform (physical → logical Tailwind classes: left→start, pl→ps, …),
 *   3. a few explicit local patches (i18n close labels, logical sheet sides, RTL switch).
 *
 * Patches assert that their anchor text exists, so an upstream change fails loudly instead
 * of silently producing a broken component.
 *
 * Usage:
 *   node scripts/sync-shadcn.mjs              # write components
 *   node scripts/sync-shadcn.mjs --check      # exit 1 if local files differ from a fresh sync
 *   SHADCN_REF=<sha|branch> node scripts/...  # sync from another upstream revision
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const REF = process.env.SHADCN_REF ?? "98a1fe67b439324ddc857f47fbdce056600a4329";
const STYLE = "new-york-v4";
const BASE = `https://raw.githubusercontent.com/shadcn-ui/ui/${REF}/apps/v4/registry/${STYLE}/ui`;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../src/components");

const COMPONENTS = [
  "alert",
  "alert-dialog",
  "avatar",
  "badge",
  "button",
  "card",
  "checkbox",
  "command",
  "dialog",
  "dropdown-menu",
  "input",
  "kbd",
  "label",
  "popover",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "sonner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toggle",
  "toggle-group",
  "tooltip",
];

// ---------------------------------------------------------------------------
// 1. Imports

const rewriteImports = (source) =>
  source
    .replace(/from ["'](?:cn|@\/lib\/utils)["']/g, 'from "../lib/utils"')
    .replace(new RegExp(`from ["']@/registry/${STYLE}/ui/([\\w-]+)["']`, "g"), 'from "./$1"')
    .replace(new RegExp(`from ["']@/registry/${STYLE}/hooks/([\\w-]+)["']`, "g"), 'from "../hooks/$1"');

// ---------------------------------------------------------------------------
// 2. RTL: physical → logical utilities. Only whole utility tokens are touched (optionally
// behind variants like `sm:` or `data-[x]:`), so `slide-in-from-left`, `data-[side=left]`,
// `rounded-lg`, `border-ring` and `placeholder:` are left alone.

const LOGICAL = [
  [/^(-?)left-(?!\[50%\])/, "$1start-"],
  [/^(-?)right-/, "$1end-"],
  [/^(-?)pl-/, "$1ps-"],
  [/^(-?)pr-/, "$1pe-"],
  [/^(-?)ml-/, "$1ms-"],
  [/^(-?)mr-/, "$1me-"],
  [/^scroll-pl-/, "scroll-ps-"],
  [/^scroll-pr-/, "scroll-pe-"],
  [/^border-l(?=$|-)/, "border-s"],
  [/^border-r(?=$|-)(?!-?ing)/, "border-e"],
  [/^rounded-tl(?=$|-)/, "rounded-ss"],
  [/^rounded-tr(?=$|-)/, "rounded-se"],
  [/^rounded-bl(?=$|-)/, "rounded-es"],
  [/^rounded-br(?=$|-)/, "rounded-ee"],
  [/^rounded-l(?=$|-)(?!g)/, "rounded-s"],
  [/^rounded-r(?=$|-)/, "rounded-e"],
  [/^text-left$/, "text-start"],
  [/^text-right$/, "text-end"],
];

const toLogicalToken = (token) => {
  // Split variants ("sm:", "data-[state=open]:", "[&_svg]:") from the utility itself.
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i += 1) {
    if (token[i] === "[") depth += 1;
    else if (token[i] === "]") depth -= 1;
    else if (token[i] === ":" && depth === 0) cut = i;
  }
  const variants = token.slice(0, cut + 1);
  const important = token[cut + 1] === "!" ? "!" : "";
  const utility = token.slice(cut + 1 + important.length);
  for (const [pattern, replacement] of LOGICAL) {
    if (pattern.test(utility)) return variants + important + utility.replace(pattern, replacement);
  }
  return token;
};

/** Apply the transform inside string literals that look like class lists. */
const toLogical = (source) =>
  source.replace(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g, (match, quote, body) => {
    if (!/[a-z]-/.test(body) || /^(?:\.{0,2}\/|@|use )/.test(body)) return match;
    const next = body
      .split(/(\s+)/)
      .map((part) => (/^\s+$/.test(part) || !part ? part : toLogicalToken(part)))
      .join("");
    return quote + next + quote;
  });

// ---------------------------------------------------------------------------
// 3. Local patches

const replaceOnce = (source, from, to, file) => {
  const hits = typeof from === "string" ? source.split(from).length - 1 : (source.match(from) ?? []).length;
  if (hits === 0) throw new Error(`[${file}] patch anchor not found: ${from}`);
  return source.replace(from, to);
};

const replaceAll = (source, from, to, file) => {
  if (!source.includes(from)) throw new Error(`[${file}] patch anchor not found: ${from}`);
  return source.split(from).join(to);
};

/** Make the hard-coded "Close" screen-reader label translatable. */
const i18nCloseLabel = (source, file, component) => {
  let out = replaceOnce(
    source,
    new RegExp(`(function ${component}\\(\\{[^}]*?)showCloseButton = true,`),
    '$1showCloseButton = true,\n  closeLabel = "Close",',
    file,
  );
  out = replaceOnce(out, /showCloseButton\?: boolean\n\}\)/, "showCloseButton?: boolean\n  /** Accessible label for the close button (translate it). */\n  closeLabel?: string\n})", file);
  return replaceOnce(out, '<span className="sr-only">Close</span>', '<span className="sr-only">{closeLabel}</span>', file);
};

const PATCHES = {
  dialog: (s, f) => i18nCloseLabel(s, f, "DialogContent"),
  sheet: (s, f) => {
    let out = i18nCloseLabel(s, f, "SheetContent");
    // Logical sides so the sheet opens from the reading-direction edge in RTL and LTR.
    out = replaceOnce(out, 'side = "right"', 'side = "end"', f);
    out = replaceOnce(out, 'side?: "top" | "right" | "bottom" | "left"', 'side?: "top" | "end" | "bottom" | "start"', f);
    out = replaceOnce(out, 'side === "right" &&', 'side === "end" &&', f);
    out = replaceOnce(out, 'side === "left" &&', 'side === "start" &&', f);
    out = replaceAll(out, "slide-out-to-right", "slide-out-to-end", f);
    out = replaceAll(out, "slide-in-from-right", "slide-in-from-end", f);
    out = replaceAll(out, "slide-out-to-left", "slide-out-to-start", f);
    out = replaceAll(out, "slide-in-from-left", "slide-in-from-start", f);
    return out;
  },
  switch: (s, f) =>
    replaceOnce(
      s,
      "data-[state=checked]:translate-x-[calc(100%-2px)]",
      "data-[state=checked]:translate-x-[calc(100%-2px)] rtl:data-[state=checked]:-translate-x-[calc(100%-2px)]",
      f,
    ),
  "dropdown-menu": (s, f) => replaceOnce(s, 'className="ms-auto size-4"', 'className="ms-auto size-4 rtl:rotate-180"', f),
};

// ---------------------------------------------------------------------------

const header = (name) =>
  `// shadcn/ui "${name}" (${STYLE}) — synced from github.com/shadcn-ui/ui@${REF.slice(0, 12)}.\n` +
  `// Generated by packages/ui/scripts/sync-shadcn.mjs. Edit the script's patches, not this file.\n`;

const build = async (name) => {
  const response = await fetch(`${BASE}/${name}.tsx`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status} from ${BASE}/${name}.tsx`);
  let source = rewriteImports(await response.text());
  source = toLogical(source);
  if (PATCHES[name]) source = PATCHES[name](source, `${name}.tsx`);
  const directive = source.match(/^\s*["']use client["'];?\s*\n/);
  const body = directive ? source.slice(directive[0].length) : source;
  const output = (directive ? '"use client";\n\n' : "") + header(name) + "\n" + body.replace(/^\s*\n/, "");
  const file = join(OUT, `${name}.tsx`);
  const options = (await prettier.resolveConfig(file)) ?? {};
  return prettier.format(output, { ...options, filepath: file });
};

const check = process.argv.includes("--check");
const results = await Promise.all(COMPONENTS.map(async (name) => [name, await build(name)]));
let drift = 0;
for (const [name, contents] of results) {
  const file = join(OUT, `${name}.tsx`);
  if (check) {
    const current = await readFile(file, "utf8").catch(() => "");
    if (current !== contents) {
      drift += 1;
      console.log(`drift: ${name}.tsx`);
    }
    continue;
  }
  await writeFile(file, contents);
  console.log(`synced ${name}.tsx`);
}
if (check && drift) {
  console.error(`${drift} component(s) differ from shadcn/ui@${REF.slice(0, 12)}. Run: pnpm --filter @family/ui sync:shadcn`);
  process.exit(1);
}
