import { NextRequest, NextResponse } from "next/server";

// 内存存储已提交 IP（服务重启后重置）
const submittedIPs = new Set<string>();

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIP = req.headers.get("x-real-ip");
    if (realIP) return realIP.trim();
    return "unknown";
}

export async function POST(req: NextRequest) {
    const ip = getClientIP(req);

    if (submittedIPs.has(ip)) {
        return NextResponse.json(
            { error: "You have already submitted a message." },
            { status: 429 }
        );
    }

    const body = await req.json().catch(() => null);
    const content = body?.content?.trim();

    if (!content) {
        return NextResponse.json(
            { error: "Message content is required." },
            { status: 400 }
        );
    }

    submittedIPs.add(ip);

    // TODO: 持久化到数据库
    console.log(`[Message] IP: ${ip} | Content: ${content}`);

    return NextResponse.json({ success: true });
}
