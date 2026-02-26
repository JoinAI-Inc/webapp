
const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';
// Section 5 - 马图
const imgHorse = `${IMAGE_URL}/new-home/bg-horse.png`;
const imgBg = `${IMAGE_URL}/new-home/bg-special.png`;

// ─── Section 5: Special Announcement (53:10156) ───────────────────────────────
export function AnnouncementSection() {
    return (
        <section
            style={{
                width: "100%",
                display: "flex",
                gap: 120,
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 0px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imgBg}
                alt=""
                aria-hidden
                style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 480,
                    height: "auto",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            />
            <div className="flex max-w-[1065px] items-center justify-center gap-[120px]">
                {/* 文字区 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                    <h2
                        style={{
                            fontFamily: "Manrope, sans-serif",
                            fontWeight: 600,
                            fontSize: 40,
                            lineHeight: 1.3,
                            letterSpacing: 0.4,
                            color: "#000",
                            margin: 0,
                        }}
                    >
                        Special{" "}
                        <span style={{ color: "#FF3F2A" }}>Announcement</span>
                    </h2>
                    <p
                        style={{
                            fontFamily: "Manrope, sans-serif",
                            fontWeight: 400,
                            fontSize: 19,
                            lineHeight: 1.4,
                            letterSpacing: 0.19,
                            color: "#404040",
                            width: 600,
                            margin: 0,
                        }}
                    >
                        As part of our commitment to respecting your privacy,{" "}
                        <strong style={{ color: "#FF3F2A", fontWeight: 700 }}>
                            we do not store any photos you upload.{" "}
                        </strong>
                        Furthermore, since our service does not require creating a unique Avatar of you,{" "}
                        <strong style={{ color: "#FF3F2A", fontWeight: 700 }}>
                            there is no need to upload multiple photos
                        </strong>
                        —just one is sufficient.
                    </p>
                </div>

                {/* 马图 */}
                <div
                    style={{
                        width: 345,
                        height: 481,
                        flexShrink: 0,
                        position: "relative",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imgHorse}
                        alt="lucky horse"
                        style={{
                            position: "absolute",
                            width: "109.28%",
                            height: "104.05%",
                            left: "-5.22%",
                            top: "-4%",
                            maxWidth: "none",
                        }}
                    />
                </div>
            </div>

        </section>
    );
}
