// generate 目录：用 fixed 层覆盖父级 layout（隐藏顶部 navbar）
export default function GenerateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 bg-[#f8f8f8] overflow-hidden">
            {children}
        </div>
    );
}
