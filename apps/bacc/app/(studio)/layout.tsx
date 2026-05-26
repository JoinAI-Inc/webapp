// Studio routes use their own full-screen shell instead of the landing chrome.

import { GenerateLayoutProvider } from "../components/GenerateLayoutProvider";

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-[0px] z-50 overflow-hidden">
            <GenerateLayoutProvider>
                {children}
            </GenerateLayoutProvider>
        </div>
    );
}
