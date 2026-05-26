import { GenerateStudio } from "../../components/GenerateStudio";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

export default async function GeneratePage() {
    const [tagsRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/templates/tags/list`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/api/templates`, { cache: 'no-store' }),
    ]);

    const tags = tagsRes.ok ? await tagsRes.json() : [];
    const templatesJson = templatesRes.ok ? await templatesRes.json() : {};
    const templates = Array.isArray(templatesJson) ? templatesJson : (templatesJson.data || []);

    return <GenerateStudio tags={tags} templates={templates} />;
}
