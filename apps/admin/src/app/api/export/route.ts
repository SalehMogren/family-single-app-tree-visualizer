import { toGedcom } from "@family/core";
import { getFamilyData, getSiteContent } from "@family/data";
import { requireSession } from "@/lib/auth";

export const GET = async (request: Request) => {
  try {
    await requireSession();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const format = new URL(request.url).searchParams.get("format");
  const kind = new URL(request.url).searchParams.get("kind");
  const stamp = new Date().toISOString().slice(0, 10);
  if (kind === "site") {
    return new Response(JSON.stringify(await getSiteContent(), null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="site-content-${stamp}.json"`,
      },
    });
  }
  const data = await getFamilyData();
  if (format === "gedcom") {
    return new Response(toGedcom(data), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="family-tree-${stamp}.ged"`,
      },
    });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="family-tree-${stamp}.json"`,
    },
  });
};
