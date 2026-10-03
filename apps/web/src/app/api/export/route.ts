import { toCsv, toGedcom } from "@family/core";
import { getPublicFamily, getSite } from "@/lib/data";

export const GET = async (request: Request) => {
  const site = await getSite();
  if (!site.settings.features.export) return new Response("Not found", { status: 404 });
  const format = new URL(request.url).searchParams.get("format");
  const data = await getPublicFamily();
  const name = "family-tree";
  if (format === "csv") {
    return new Response(toCsv(data), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}.csv"`,
      },
    });
  }
  if (format === "gedcom") {
    return new Response(toGedcom(data, site.brief.en.familyName || "FamilyTree"), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="${name}.ged"`,
      },
    });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${name}.json"`,
    },
  });
};
