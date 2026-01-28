/**
 * AI Generation Prompts Configuration
 * Business personnel can adjust these prompts to fine-tune the AI output.
 */

export const HANFU_PROMPTS: Record<string, string> = {
    tang: "Transform this person into a high-nobility figure from the Tang Dynasty. Photo style. Realistic photo. Keep the original hair color and face looking. Chinese New Year celibrition, holding Chinese couplet on hands, and write chinese words 新年快乐 or 马年快乐 or other Chinese words on it.Clad in flamboyant, wide-sleeved Hanfu with rich floral patterns and gold embroidery. Background: A lavish palace balcony with red pillars.",
    song: "Transform this person into a scholar or elegant figure from the Song Dynasty. Photo style. Realistic photo. Keep the original hair color and face looking. Chinese New Year celibrition, holding Chinese couplet on hands, and write chinese words 新年快乐 or 马年快乐 or other Chinese words on it.Wearing refined, minimalist Hanfu in pastel silk. Background: A serene traditional garden with bamboo and stone bridges.",
    ming: "Transform this person into a dignified official or lady from the Ming Dynasty. Photo style. Realistic photo. Keep the original hair color and face looking. Chinese New Year celibrition, holding Chinese couplet on hands, and write chinese words 新年快乐 or 马年快乐 or other Chinese words on it.Clad in structured, traditional Hanfu with a cross-collar and intricate patterns. Background: A classical study room with antique furniture.",
    defaultText: "Please preserve the original facial identity while seamlessly blending it into the Hanfu attire and historical setting."
};

export const DECOR_PROMPTS = {
    basePrompt: (style: string, elementDescs: string) =>
        `Add traditional Chinese New Year decorations to this room in ${style} style${elementDescs}. Place red lanterns, couplets, and festive ornaments naturally in the scene while maintaining the original room structure.`
};

export const VIDEO_PROMPTS = {
    basePrompt: (scene: string, identity: string, voice: string, music: string) =>
        `Generate a high-fidelity festive Chinese New Year scene based on this person. Scenario: ${scene}. Identity Style: ${identity}. Voice Tone: ${voice}. Music Vibe: ${music}. Ensure the person is celebrating and the environment is filled with traditional CNY symbols.`
};

export const MAGIC_STUDIO_PROMPTS = {
    imagePrompt: (characters: { styleId: string }[], backgroundType: 'preset' | 'custom', backgroundDesc: string, elements: string) => {
        const characterCount = characters.length;
        let characterLogic = "";

        const getStyleName = (id: string) => {
            const style = id.toLowerCase();
            if (style === 'tang') return "Tang Dynasty";
            if (style === 'song') return "Song Dynasty";
            if (style === 'ming') return "Ming Dynasty";
            return "traditional";
        };

        if (characterCount === 0) {
            characterLogic = "This is a pure architectural and interior design shot. No people are present.";
        } else if (characterCount === 1) {
            characterLogic = `There is one person in the center, wearing ${getStyleName(characters[0].styleId)} style Hanfu.`;
        } else if (characterCount === 2) {
            characterLogic = `There are two people interactively performing a traditional 'Bainian' greeting. Person 1 (left) is wearing ${getStyleName(characters[0].styleId)} style Hanfu, and Person 2 (right) is wearing ${getStyleName(characters[1].styleId)} style Hanfu.`;
        } else {
            const descriptions = characters.map((c, i) => `Person ${i + 1} is wearing ${getStyleName(c.styleId)} style Hanfu`).join(", ");
            characterLogic = `There are ${characterCount} people in a festive family gathering. ${descriptions}. One lead person is in the foreground performing a 'Bainian' greeting.`;
        }

        let bgLogic = backgroundType === 'custom'
            ? `The background is based on the provided architectural photo: ${backgroundDesc}. Naturally integrate festive decorations into the real-world structure.`
            : `The background is a ${backgroundDesc} scene.`;

        return `RAW photo, a high-quality cinematic masterpiece. ${characterLogic} 
        The Hanfu should have realistic fabric textures like silk and brocade with natural folds. 
        ${bgLogic} 
        Add these traditional Chinese elements: ${elements}. 
        Preserve the uploaded facial identities with 100% accuracy, maintaining original skin textures, eye shapes, and proportions. 
        Atmosphere: Natural warm lighting from lanterns, shallow depth of field, shot on 35mm lens, f/1.8, 8k resolution, highly detailed skin pores, no digital smoothing, realistic shadows and reflections, authentic historical atmosphere. Avoid typical AI over-saturation and plastic textures.`;
    },
    motionPrompt: (voice: string, music: string) => {
        return `Animate this festive Chinese New Year scene. The people in the image should perform a gentle 'Bainian' greeting motion, bowing slightly with hands cupped. Their expressions should be joyful and celebratory. The background elements like lanterns should have subtle swaying motion. The lighting should be warm and cinematic. Voice Tone: ${voice}. Music Vibe: ${music}. Ensure the animation is smooth, high-fidelity, and maintains the exact identities and styles from the source image.`;
    }
};
