'use client'

import { useParams } from 'next/navigation';
import SiteThemeEditor from '../SiteThemeEditor';

export default function EditSiteThemePage() {
    const params = useParams();
    return <SiteThemeEditor id={params.id} />;
}
