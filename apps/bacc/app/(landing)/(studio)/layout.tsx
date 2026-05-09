// generate 目录：用 fixed 层覆盖父级 layout（隐藏顶部 navbar）

import { GenerateLayoutProvider } from "../../components/GenerateLayoutProvider";

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-[0px] z-50 overflow-hidden">
            <GenerateLayoutProvider>
                {children}
            </GenerateLayoutProvider>
        </div>
    );
}
