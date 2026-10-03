const CSS_VARS = [
  "--card",
  "--card-foreground",
  "--muted-foreground",
  "--border",
  "--ring",
  "--male",
  "--female",
  "--tree-link",
  "--tree-canvas",
  "--destructive",
  "--warning",
  "--primary",
  "--background",
];

/**
 * Serialise the tree's SVG into a standalone document: resolves CSS variables to
 * concrete colours and crops to the drawing bounds.
 */
export const serializeTreeSvg = (
  svg: SVGSVGElement,
  bounds: { minX: number; minY: number; width: number; height: number },
  padding = 40,
) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const viewport = clone.querySelector<SVGGElement>("[data-viewport]");
  viewport?.setAttribute(
    "transform",
    `translate(${padding - bounds.minX},${padding - bounds.minY})`,
  );
  clone.querySelectorAll("[data-export-ignore]").forEach((el) => el.remove());
  const width = Math.ceil(bounds.width + padding * 2);
  const height = Math.ceil(bounds.height + padding * 2);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  clone.removeAttribute("class");
  clone.removeAttribute("style");

  const style = getComputedStyle(svg);
  const background = style.getPropertyValue("--tree-canvas").trim() || "#fff";
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", background);
  clone.insertBefore(bg, clone.firstChild);
  clone.setAttribute("font-family", style.fontFamily);

  let markup = new XMLSerializer().serializeToString(clone);
  for (const name of CSS_VARS) {
    const value = style.getPropertyValue(name).trim();
    if (value) markup = markup.split(`var(${name})`).join(value);
  }
  return { markup, width, height };
};

export const svgToPngBlob = async (markup: string, width: number, height: number, scale = 2) => {
  const maxSide = 16384;
  const factor = Math.min(scale, maxSide / width, maxSide / height);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to render SVG"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * factor);
    canvas.height = Math.floor(height * factor);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.scale(factor, factor);
    ctx.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
