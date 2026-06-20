import { WritingDetailClient } from "@/components/writing/WritingDetailClient";

export default async function WritingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WritingDetailClient id={id} />;
}
