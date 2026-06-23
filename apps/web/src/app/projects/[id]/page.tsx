import { ProjectBrainView } from "@/components/projects/ProjectBrainView";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectBrainView projectId={id} />;
}
