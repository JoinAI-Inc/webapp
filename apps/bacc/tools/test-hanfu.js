const https = require('https');
const fs = require('fs');
const path = require('path');

const apiKey = "AIzaSyBKIrUMMFx9l8VYuFRHeS4YY78fZIh72KY";
const imagePath = "/Users/kevin/.gemini/antigravity/brain/17cae178-36e5-47cf-bf0a-f37c0ea09932/blonde_test_model_1769008874863.png";

async function testHanfuGen() {
    console.log("Reading local image...");
    const imgData = fs.readFileSync(imagePath).toString('base64');

    const body = JSON.stringify({
        contents: [
            {
                parts: [
                    { text: "Transform this person into a high-nobility figure from the Tang Dynasty. Clad in flamboyant, wide-sleeved Hanfu with rich floral patterns and gold embroidery. Background: A lavish palace balcony with red pillars. Please preserve the original facial identity while seamlessly blending it into the Hanfu attire and historical setting." },
                    {
                        inline_data: {
                            mime_type: "image/png",
                            data: imgData,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            response_modalities: ["IMAGE"],
        },
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;

    console.log("Calling Nano Banana (Gemini 2.0) API...");
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const req = https.request(endpoint, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const result = JSON.parse(data);
            if (result.error) {
                console.error("API Error:", JSON.stringify(result.error, null, 2));
                return;
            }

            const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inline_data);
            if (imagePart) {
                console.log("Success! Image received.");
                const base64Image = imagePart.inline_data.data;
                const outputPath = path.join(__dirname, 'test-hanfu-2.0-result.png');
                fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
                console.log(`Result saved to ${outputPath}`);
            } else {
                console.log("No image in response. Response:", JSON.stringify(result, null, 2));
            }
        });
    });

    req.on('error', console.error);
    req.write(body);
    req.end();
}

testHanfuGen();
