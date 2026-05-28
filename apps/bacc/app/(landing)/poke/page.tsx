import { FooterSection } from "../../components/FooterSection";
import { CardFrame } from "../../components/CardFrame";
import { getSiteTheme } from "../../lib/site-theme";

// 参与者数据
const participants = [
    { name: "哈尼桃桃酱", id: "Yetkitty951004", followers: "878" },
    { name: "李开心的亲子时光", id: "207305504", followers: "27k" },
    { name: "绵绵岛", id: "375785978", followers: "537" },
    { name: "Nico匠", id: "Hyl95234", followers: "33k" },
    { name: "-是溪溪呀-", id: "944605407", followers: "525k" },
    { name: "米米🌸🌸🌸", id: "95555262084", followers: "1.6k" },
    { name: "是安宁呀！！！", id: "6574283932", followers: "4.5k" },
    { name: "叔系少年老三", id: "R44444444", followers: "2.2k" },
    { name: "贝贝万事屋", id: "bei185448278", followers: "3.9k" },
    { name: "鹿儿Tata", id: "109627123", followers: "173k" },
    { name: "数码侦探小何", id: "94118559427", followers: "4.8k" },
    { name: "Mici", id: "959628182", followers: "11k" },
    { name: "小番薯她爹", id: "1052328063", followers: "250k" },
    { name: "快乐猴子", id: "6224741086", followers: "152" },
    { name: "梵麦麦", id: "969961790", followers: "4.7k" },
    { name: "讨厌香菇", id: "776560427", followers: "13k" },
    { name: "西夏📷", id: "xixia326", followers: "9k" },
    { name: "昆明小好全家福", id: "Xiaohaofamily", followers: "1.8k" },
    { name: "西瓜约拍", id: "CHAN981010", followers: "5.9k" },
    { name: "露小那那🌙", id: "yuanlj0316", followers: "40k" },
    { name: "哈士奇奇", id: "632698469", followers: "2.5k" },
    { name: "喝可乐加七喜", id: "110976416", followers: "14k" },
    { name: "Enjoy", id: "jiuliyyds1314fs", followers: "18k" },
    { name: "毛友友的宠物写真", id: "95630780883", followers: "1k" },
    { name: "会笑的阿柴", id: "157471040", followers: "951" },
    { name: "除七", id: "389535422", followers: "7.1k" },
    { name: "NICEPETS厦门宠物摄影", id: "tjxpic", followers: "1.7k" },
    { name: "草莓味的阿乐啊🍓", id: "XX999998", followers: "102" },
    { name: "汪汪雪饼大礼包", id: "4287858287", followers: "100" },
    { name: "豆包是只萨摩耶", id: "502292937", followers: "10k" },
    { name: "大羊宠物摄影", id: "Goat_Studio", followers: "686" },
    { name: "卡卡大事记", id: "108957722", followers: "4" },
    { name: "米奇妙妙屋", id: "809410004", followers: "2.4k" },
    { name: "卷卷不卷 🌀", id: "951854764", followers: "376" },
    { name: "红雨树边", id: "5858670701", followers: "6" },
    { name: "是蜡笔小嘉呀～", id: "94311523574", followers: "22" },
    { name: "妲己的日常", id: "11504145349", followers: "58" },
    { name: "霸道宠裁Haby", id: "Habe_bibi", followers: "468" },
    { name: "范老师的猫", id: "6102688434", followers: "2.7k" },
    { name: "超级安", id: "542408004", followers: "238" },
    { name: "腮腮胡噜噜", id: "Htaotaoo", followers: "58k" },
    { name: "天庭流放猪八戒🐷", id: "279703851", followers: "1.7k" },
    { name: "玩具小茉莉", id: "Mollytoy", followers: "21k" },
    { name: "蒋默默", id: "295393179", followers: "316k" },
    { name: "拍照的小西", id: "afan_cc", followers: "1.7k" },
    { name: "鑫子摄影", id: "XINZISY", followers: "24k" },
    { name: "YQ-STUDIO云栖置景", id: "YZ19012879853", followers: "715" },
    { name: "哎呀我的胳膊肘儿啊！（造景我贴贴贴！）", id: "863524422", followers: "2.8k" },
    { name: "Kerry Dowdle", id: "717150236", followers: "206k" },
];

export default async function PokePage() {
    const material = await getSiteTheme();
    const poke = material.poke;

    return (
        <div style={{ background: poke.backgroundColor, width: "100%", position: "relative", overflowX: "hidden" }}>
            {/* ─── 顶部红色渐变区域 ─── */}
            <section
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: 450,
                    overflow: "hidden",
                }}
            >
                {/* 背景渐变 */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 1920,
                        height: 1299,
                        background: `linear-gradient(180deg, ${poke.gradientStartColor} 0%, ${poke.gradientEndColor} 70.192%)`,
                        pointerEvents: "none",
                    }}
                />

                {/* 灯笼 右上角（模糊） */}
                <div
                    style={{
                        position: "absolute",
                        top: -196,
                        right: -120,
                        width: 480,
                        height: 738,
                        filter: "blur(8.15px)",
                        opacity: 0.77,
                        pointerEvents: "none",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poke.lanternImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* 灯笼 左侧 */}
                <div
                    style={{
                        position: "absolute",
                        top: 90,
                        left: -66,
                        width: 256,
                        height: 394,
                        opacity: 0.86,
                        pointerEvents: "none",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poke.lanternImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* 标题文字 */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        paddingTop: 100,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        textAlign: "center",
                    }}
                >
                    {poke.headingLines.map((line) => (
                        <p
                            key={line}
                            style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 600,
                                fontSize: 32,
                                lineHeight: 1.4,
                                color: poke.headingColor,
                                letterSpacing: 0.32,
                                margin: 0,
                            }}
                        >
                            {line}
                        </p>
                    ))}
                </div>

                {/* ─── 参与者名单卷轴区域 ─── */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        justifyContent: "center",
                        flexDirection: "column",
                        alignItems: "center",
                        marginTop: 40,
                        paddingBottom: 80,
                    }}
                >
                    <CardFrame width={760}>
                        {/* 表头 */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1.5fr 1fr",
                                padding: "12px 20px 8px",
                                borderBottom: `1px solid ${poke.tableBorderColor}`,
                            }}
                        >
                            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 14, color: poke.tableHeaderColor, letterSpacing: 0.14 }}>Name</span>
                            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 14, color: poke.tableHeaderColor, letterSpacing: 0.14 }}>rednote ID</span>
                            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 14, color: poke.tableHeaderColor, letterSpacing: 0.14 }}>Followers</span>
                        </div>

                        {/* 数据行 */}
                        {participants.map((p, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1.5fr 1fr",
                                    padding: "8px 20px",
                                }}
                            >
                                <span style={{ fontFamily: "Manrope, 'Noto Sans SC', 'Noto Sans JP', sans-serif", fontSize: 17, color: poke.tableTextColor, letterSpacing: 0.17, lineHeight: 1.4 }}>
                                    {p.name}
                                </span>
                                <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 17, color: poke.tableTextColor, letterSpacing: 0.17, lineHeight: 1.4 }}>
                                    {p.id}
                                </span>
                                <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 17, color: poke.tableTextColor, letterSpacing: 0.17, lineHeight: 1.4 }}>
                                    {p.followers}
                                </span>
                            </div>
                        ))}

                        {/* CardFrame 内底部感谢区域 */}
                        <div style={{ borderTop: `1px solid ${poke.tableBorderColor}`, margin: "8px 20px 0" }} />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                alignItems: "center",
                                padding: "16px 20px 20px",
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: "Manrope, 'Noto Sans JP', 'Noto Sans SC', sans-serif",
                                    fontSize: 17,
                                    color: poke.thanksTextColor,
                                    textAlign: "center",
                                    letterSpacing: 0.17,
                                    margin: 0,
                                    lineHeight: 1.4,
                                }}
                            >
                                {poke.thanksText}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span
                                    style={{
                                        fontFamily: "Manrope, sans-serif",
                                        fontSize: 17,
                                        color: poke.thanksTextColor,
                                        letterSpacing: 0.17,
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {poke.specialThanksText}
                                </span>
                                <img src={poke.xhsIconUrl} alt="" height={24} width={24} />
                            </div>
                        </div>
                    </CardFrame>
                </div>

            </section>

            {/* ─── 底部 Footer CTA ─── */}
            <FooterSection material={material} />
        </div>
    );
}
