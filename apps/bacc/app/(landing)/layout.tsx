import LandingNavBar from "@/components/LandingNavBar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-layout">
      <LandingNavBar />
      <div className="landing-content">{children}</div>
      <style>{`
        .landing-layout {
          width: 100%;
          background: white;
          color: #0A0708;
        }
        .landing-content {
          margin-top: -64px;
        }
        .landing-page-shell {
          padding-top: 64px;
        }
      `}</style>
    </div>
  );
}
