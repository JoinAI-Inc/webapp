import LandingNavBar from "@/components/LandingNavBar";

export default function NewLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full">
            <LandingNavBar />
            {children}
        </div>
    );
}
