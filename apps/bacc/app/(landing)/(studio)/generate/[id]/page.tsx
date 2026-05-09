import { TemplateDetailPageClient } from "../../../../components/TemplateDetailPageClient";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

export default async function TemplateGeneratePage({ params }: { params: { id: string } }) {
    return <TemplateDetailPageClient templateId={params.id} />;
}
