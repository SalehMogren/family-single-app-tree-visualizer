import type { Metadata } from "next";
import { TreeEditor } from "@/components/tree-editor";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getI18n()).dict.admin.editor.title,
});

const EditorPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; root?: string }>;
}) => {
  const { focus, root } = await searchParams;
  return <TreeEditor initialFocusId={focus ?? null} initialRootId={root ?? null} />;
};

export default EditorPage;
