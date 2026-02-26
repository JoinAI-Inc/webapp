#!/usr/bin/env node

/**
 * TinyPNG 批量图片压缩脚本
 * 用法: node compress-images.js <图片目录> [输出目录]
 * 示例: node compress-images.js ./apps/bacc/public/new-home
 *       node compress-images.js ./images ./images-compressed
 *
 * 不指定输出目录时，会原地覆盖（压缩后替换原文件）
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.TINYPNG_KEY || "Q1z3t1wK6Qc1SWySNK6B3MDdSyXdVPKT";
const SUPPORTED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const inputDir = process.argv[2];
const outputDir = process.argv[3] || null; // null = 原地覆盖

if (!inputDir) {
    console.error("用法: node compress-images.js <图片目录> [输出目录]");
    process.exit(1);
}

if (!fs.existsSync(inputDir)) {
    console.error(`目录不存在: ${inputDir}`);
    process.exit(1);
}

if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 递归获取所有图片文件
function getImages(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getImages(fullPath));
        } else if (SUPPORTED_EXTS.includes(path.extname(entry.name).toLowerCase())) {
            results.push(fullPath);
        }
    }
    return results;
}

// 压缩单张图片
function compressImage(filePath) {
    return new Promise((resolve, reject) => {
        // 保留原始文件模式：目标已存在则跳过
        if (outputDir) {
            const relativePath = path.relative(inputDir, filePath);
            const outPath = path.join(outputDir, relativePath);
            if (fs.existsSync(outPath)) {
                console.log(`⊘ ${path.basename(filePath)} 已存在，跳过`);
                return resolve();
            }
        }

        let fileData;
        try {
            fileData = fs.readFileSync(filePath);
        } catch (err) {
            return reject(err);
        }
        const originalSize = fileData.length;

        const options = {
            hostname: "api.tinify.com",
            path: "/shrink",
            method: "POST",
            auth: `api:${API_KEY}`,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Length": fileData.length,
            },
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 201) {
                let body = "";
                res.on("data", (d) => (body += d));
                res.on("end", () => reject(new Error(`API错误 ${res.statusCode}: ${body}`)));
                return;
            }

            // 获取压缩后图片URL
            const location = res.headers["location"];

            // 下载压缩后的图片
            https.get(location, { auth: `api:${API_KEY}` }, (dlRes) => {
                const chunks = [];
                dlRes.on("data", (chunk) => chunks.push(chunk));
                dlRes.on("end", () => {
                    const compressedData = Buffer.concat(chunks);
                    const compressedSize = compressedData.length;

                    // 确定输出路径
                    let outPath;
                    if (outputDir) {
                        const relativePath = path.relative(inputDir, filePath);
                        outPath = path.join(outputDir, relativePath);
                        fs.mkdirSync(path.dirname(outPath), { recursive: true });
                    } else {
                        outPath = filePath; // 原地覆盖
                    }

                    fs.writeFileSync(outPath, compressedData);

                    const saved = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                    const origKB = (originalSize / 1024).toFixed(0);
                    const compKB = (compressedSize / 1024).toFixed(0);
                    console.log(`✓ ${path.basename(filePath)} | ${origKB}KB → ${compKB}KB (节省 ${saved}%)`);
                    resolve();
                });
                dlRes.on("error", reject);
            }).on("error", reject);
        });

        req.on("error", reject);
        req.write(fileData);
        req.end();
    });
}

// 主流程（并发限制为 5）
async function main() {
    const images = getImages(inputDir);

    if (images.length === 0) {
        console.log("未找到图片文件");
        return;
    }

    console.log(`找到 ${images.length} 张图片，开始压缩...\n`);

    const CONCURRENCY = 5;
    let index = 0;
    let success = 0;
    let failed = 0;

    async function worker() {
        while (index < images.length) {
            const file = images[index++];
            try {
                await compressImage(file);
                success++;
            } catch (err) {
                console.error(`✗ ${path.basename(file)}: ${err.message}`);
                failed++;
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    console.log(`\n完成！成功: ${success}，失败: ${failed}`);
}

main();
