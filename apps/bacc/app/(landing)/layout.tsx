import LandingNavBar from "@/components/LandingNavBar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-white text-[#0A0708]">
      <LandingNavBar />
      {children}
    </div>
  );
}
