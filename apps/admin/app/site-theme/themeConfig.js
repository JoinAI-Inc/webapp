const FALLBACK_IMAGE_URL = 'https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image';
const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || FALLBACK_IMAGE_URL).replace(/\/$/, '');

export const DEFAULT_CONFIG = {
    theme: {
        primaryColor: '#EC2E2E',
        textColor: '#0A0708',
        mutedTextColor: '#39383B',
        heroBackgroundColor: '#FFFFFF',
        mediaShellStart: '#F7F4F2',
        mediaShellEnd: '#EEE9E5',
        cardBackgroundStart: '#D8D8DA',
        cardBackgroundEnd: '#CFCFD3',
        ctaGradientStart: '#FF5C2E',
        ctaGradientEnd: '#E81500',
        ctaFocusColor: '#FFD322',
    },
    hero: {
        titlePrefix: 'The most ',
        titleHighlight: 'popular fortune',
        titleSuffix: '',
        logoPrefix: 'foto in',
        subtitlePrefix: 'how to make a foto',
        subtitleSuffix: 'that real Chinese would jealous',
        ctaLabel: 'Try it free',
        brandIconUrl: '',
        logoImageUrl: '',
        backgroundImageUrl: '',
        ctaBackgroundImageUrl: '',
        rows: [[], [], []],
    },
    redBrand: {
        backgroundColor: '#DD1E1B',
        patternImageUrl: '',
        leftBaseImageUrl: '',
        leftOverlayImageUrl: '',
        rightBaseImageUrl: '',
        rightOverlayImageUrl: '',
        iconUrl: '',
        title: 'furtune Foto of the year now',
        support: 'Capture the moments in the new year,\nLet every click of the shutter preserve the essence of time. May the coming year be as splendid as a brocade, with all wishes fulfilled.',
        titleColor: '#FFFFFF',
        supportColor: 'rgba(255, 255, 255, 0.82)',
    },
    gallery: {
        backgroundColor: '#FFFFFF',
        title: 'Also, can',
        highlight: 'not just you...',
        suffix: '',
        support: 'Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.',
        titleColor: '#0A0708',
        highlightColor: '#EC2E2E',
        supportColor: '#39383B',
        cardBackgroundColor: '#F5F5F5',
        images: [],
    },
    pet: {
        backgroundColor: '#FFFFFF',
        cloudImageUrl: '',
        topLeftImageUrl: '',
        topRightImageUrl: '',
        bottomLeftImageUrl: '',
        bottomRightImageUrl: '',
        titlePrefix: 'OR,',
        titleMiddle: 'Even for',
        titleHighlight: 'your pet',
        text: 'Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.',
        titleColor: '#0A0708',
        highlightColor: '#EC2E2E',
        textColor: '#6D6C70',
    },
    ootd: {
        backgroundColor: '#FFFFFF',
        title: 'IN Every',
        highlight: 'OOTD',
        suffix: 'You LIKE',
        support: 'Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.',
        titleColor: '#0A0708',
        highlightColor: '#EC2E2E',
        supportColor: '#39383B',
        cardBackgroundColor: '#F5F5F5',
        items: [
            { imageUrl: '', placeholderColor: '#F6C46A', label: 'OOTD 1' },
            { imageUrl: '', placeholderColor: '#E96255', label: 'OOTD 2' },
            { imageUrl: '', placeholderColor: '#73B69B', label: 'OOTD 3' },
        ],
    },
    inspiration: {
        backgroundStartColor: '#DA2524',
        backgroundEndColor: '#C00B0A',
        patternImageUrl: '/bg-insprition.svg',
        leftDecorImageUrl: '',
        rightDecorImageUrl: '',
        title: 'Insprition from',
        titleColor: '#C51C1B',
        entryColor: '#E29211',
        dividerColor: '#E29211',
        note: '鼓励大家去follow他们的话和感谢的话',
        noteColor: '#C51C1B',
        specialThanksText: 'Special Thanks to',
        thanksIconUrl: '/icon-xhs.svg',
        items: [
            { id: 'Yetkitty951004', name: '哈尼桃桃酱' },
            { id: '207305504', name: '李开心的亲子时光' },
            { id: '375785978', name: '绵绵岛' },
        ],
    },
    announcement: {
        backgroundColor: '#FFFFFF',
        imageUrl: '',
        mediaBackgroundImageUrl: '',
        titlePrefix: 'Special',
        titleHighlight: 'Announcement',
        support: 'As part of our commitment to respecting your privacy, **we do not store any photos you upload.** Furthermore, since our service does not require creating a unique Avatar of you, **there is no need to upload multiple photos** —just one is sufficient.',
        titleColor: '#0A0708',
        highlightColor: '#EC2E2E',
        supportColor: '#39383B',
        supportHighlightColor: 'rgb(236, 46, 46)',
    },
    footer: {
        backgroundColor: '#EC2E2E',
        backgroundImageUrl: `${IMAGE_URL}/landing-footer/lucky-photo-footer-bg.png`,
        title: 'Get your fortune Foto right now',
        titleColor: '#FFFFFF',
        ctaLabel: 'Try it free',
        ctaIconUrl: '/landing-footer/lucky-photo-home-cta-icon-brand.svg',
        ctaBackgroundColor: '#FFFFFF',
        ctaTextColor: '#EC2E2E',
        collageImageUrl: `${IMAGE_URL}/landing-footer/lucky-photo-footer-collage.png`,
        metaColor: '#E0B2B2',
        copyrightText: 'Copyright © 2026 JoinAI. All rights reserved.',
        recordText: '浙ICP备2021040718号-2',
    },
    about: {
        backgroundColor: '#FDF5EA',
        backgroundImageUrl: '',
        illustrationUrl: '',
        decorationImageUrl: '/bg-about-1.svg',
        heartIconUrl: `${IMAGE_URL}/icon-heart.png`,
        accentColor: '#EC2E2E',
        textColor: '#0A0708',
        mutedTextColor: '#9B9A9D',
        inputBackgroundColor: '#FDF5EA',
        inputBorderColor: '#E4D7C5',
        disabledButtonColor: '#E8E8E8',
        title: 'Leave us a message',
        headlinePrefix: 'just that your option is',
        headlineHighlight: 'precious to us',
        headlineSuffix: '',
        subheadline: 'feel free to write down anything',
        placeholder: 'Leave us a message...',
        emailLabel: 'or sent us an E-Mail:',
        email: 'hello@joinai.com',
    },
    login: {
        logoImageUrl: '/login-design/lucky-photo-logo.svg',
        titleAccentImageUrl: '/login-design/lucky-photo-title-accent.svg',
        mobileCollageImageUrl: `${IMAGE_URL}/login-design/lucky-photo-mobile-collage.png`,
        desktopCollageImageUrl: `${IMAGE_URL}/login-design/lucky-photo-login-collage.png`,
        googleIconUrl: '/login-design/lucky-photo-icon-google.svg',
        discordIconUrl: '/login-design/lucky-photo-icon-discord.svg',
        xIconUrl: '/login-design/lucky-photo-icon-x.svg',
        appleIconUrl: '/login-design/lucky-photo-icon-apple.svg',
    },
    poke: {
        backgroundColor: '#FFF9F2',
        gradientStartColor: '#C11010',
        gradientEndColor: '#FFF9F2',
        lanternImageUrl: '',
        headingColor: '#FFFFFF',
        headingLines: [
            'This Idea can never be happend without',
            'the inspiration form those awesome people',
            'Best wishes & Big thank-you to them',
        ],
        tableHeaderColor: '#C39E67',
        tableTextColor: '#A16610',
        tableBorderColor: '#C9A86C',
        thanksTextColor: '#C51C1B',
        thanksText: '鼓励大家去follow他们的话和感谢的话',
        specialThanksText: 'Special Thanks to',
        xhsIconUrl: '/icon-xhs.svg',
        participants: [
            { name: '哈尼桃桃酱', id: 'Yetkitty951004', followers: '878' },
            { name: '李开心的亲子时光', id: '207305504', followers: '27k' },
            { name: '绵绵岛', id: '375785978', followers: '537' },
            { name: 'Nico匠', id: 'Hyl95234', followers: '33k' },
            { name: '-是溪溪呀-', id: '944605407', followers: '525k' },
            { name: '米米🌸🌸🌸', id: '95555262084', followers: '1.6k' },
            { name: '是安宁呀！！！', id: '6574283932', followers: '4.5k' },
            { name: '叔系少年老三', id: 'R44444444', followers: '2.2k' },
            { name: '贝贝万事屋', id: 'bei185448278', followers: '3.9k' },
            { name: '鹿儿Tata', id: '109627123', followers: '173k' },
            { name: '数码侦探小何', id: '94118559427', followers: '4.8k' },
            { name: 'Mici', id: '959628182', followers: '11k' },
            { name: '小番薯她爹', id: '1052328063', followers: '250k' },
            { name: '快乐猴子', id: '6224741086', followers: '152' },
            { name: '梵麦麦', id: '969961790', followers: '4.7k' },
            { name: '讨厌香菇', id: '776560427', followers: '13k' },
            { name: '西夏📷', id: 'xixia326', followers: '9k' },
            { name: '昆明小好全家福', id: 'Xiaohaofamily', followers: '1.8k' },
            { name: '西瓜约拍', id: 'CHAN981010', followers: '5.9k' },
            { name: '露小那那🌙', id: 'yuanlj0316', followers: '40k' },
            { name: '哈士奇奇', id: '632698469', followers: '2.5k' },
            { name: '喝可乐加七喜', id: '110976416', followers: '14k' },
            { name: 'Enjoy', id: 'jiuliyyds1314fs', followers: '18k' },
            { name: '毛友友的宠物写真', id: '95630780883', followers: '1k' },
            { name: '会笑的阿柴', id: '157471040', followers: '951' },
            { name: '除七', id: '389535422', followers: '7.1k' },
            { name: 'NICEPETS厦门宠物摄影', id: 'tjxpic', followers: '1.7k' },
            { name: '草莓味的阿乐啊🍓', id: 'XX999998', followers: '102' },
            { name: '汪汪雪饼大礼包', id: '4287858287', followers: '100' },
            { name: '豆包是只萨摩耶', id: '502292937', followers: '10k' },
            { name: '大羊宠物摄影', id: 'Goat_Studio', followers: '686' },
            { name: '卡卡大事记', id: '108957722', followers: '4' },
            { name: '米奇妙妙屋', id: '809410004', followers: '2.4k' },
            { name: '卷卷不卷 🌀', id: '951854764', followers: '376' },
            { name: '红雨树边', id: '5858670701', followers: '6' },
            { name: '是蜡笔小嘉呀～', id: '94311523574', followers: '22' },
            { name: '妲己的日常', id: '11504145349', followers: '58' },
            { name: '霸道宠裁Haby', id: 'Habe_bibi', followers: '468' },
            { name: '范老师的猫', id: '6102688434', followers: '2.7k' },
            { name: '超级安', id: '542408004', followers: '238' },
            { name: '腮腮胡噜噜', id: 'Htaotaoo', followers: '58k' },
            { name: '天庭流放猪八戒🐷', id: '279703851', followers: '1.7k' },
            { name: '玩具小茉莉', id: 'Mollytoy', followers: '21k' },
            { name: '蒋默默', id: '295393179', followers: '316k' },
            { name: '拍照的小西', id: 'afan_cc', followers: '1.7k' },
            { name: '鑫子摄影', id: 'XINZISY', followers: '24k' },
            { name: 'YQ-STUDIO云栖置景', id: 'YZ19012879853', followers: '715' },
            { name: '哎呀我的胳膊肘儿啊！（造景我贴贴贴！）', id: '863524422', followers: '2.8k' },
            { name: 'Kerry Dowdle', id: '717150236', followers: '206k' },
        ],
    },
};

function normalizeRows(rows) {
    return Array.from({ length: 3 }, (_, index) => {
        const row = rows?.[index];
        return Array.isArray(row) ? row.filter(Boolean) : [];
    });
}

function normalizeOotdItems(items) {
    if (!Array.isArray(items)) return DEFAULT_CONFIG.ootd.items;
    const normalized = items
        .map((item, index) => ({
            imageUrl: typeof item?.imageUrl === 'string' ? item.imageUrl : '',
            placeholderColor: item?.placeholderColor || DEFAULT_CONFIG.ootd.items[index]?.placeholderColor || '#F5F5F5',
            label: item?.label || `OOTD ${index + 1}`,
        }))
        .filter(item => item.imageUrl || item.placeholderColor);
    return normalized.length ? normalized : DEFAULT_CONFIG.ootd.items;
}

function normalizeInspirationItems(items) {
    if (!Array.isArray(items)) return DEFAULT_CONFIG.inspiration.items;
    const normalized = items
        .map(item => ({ id: item?.id || '', name: item?.name || '' }))
        .filter(item => item.id && item.name);
    return normalized.length ? normalized : DEFAULT_CONFIG.inspiration.items;
}

function normalizePokeParticipants(items) {
    if (!Array.isArray(items)) return DEFAULT_CONFIG.poke.participants;
    const normalized = items
        .map(item => ({
            name: item?.name || '',
            id: item?.id || '',
            followers: item?.followers || '',
        }))
        .filter(item => item.name && item.id);
    return normalized.length ? normalized : DEFAULT_CONFIG.poke.participants;
}

export function normalizeConfig(config) {
    const source = config && typeof config === 'object' ? config : {};

    return {
        theme: { ...DEFAULT_CONFIG.theme, ...(source.theme || {}) },
        hero: {
            ...DEFAULT_CONFIG.hero,
            ...(source.hero || {}),
            rows: normalizeRows(source.hero?.rows),
        },
        redBrand: { ...DEFAULT_CONFIG.redBrand, ...(source.redBrand || {}) },
        gallery: {
            ...DEFAULT_CONFIG.gallery,
            ...(source.gallery || {}),
            images: Array.isArray(source.gallery?.images) ? source.gallery.images.filter(Boolean) : DEFAULT_CONFIG.gallery.images,
        },
        pet: { ...DEFAULT_CONFIG.pet, ...(source.pet || {}) },
        ootd: {
            ...DEFAULT_CONFIG.ootd,
            ...(source.ootd || {}),
            items: normalizeOotdItems(source.ootd?.items),
        },
        inspiration: {
            ...DEFAULT_CONFIG.inspiration,
            ...(source.inspiration || {}),
            items: normalizeInspirationItems(source.inspiration?.items),
        },
        announcement: { ...DEFAULT_CONFIG.announcement, ...(source.announcement || {}) },
        footer: { ...DEFAULT_CONFIG.footer, ...(source.footer || {}) },
        about: { ...DEFAULT_CONFIG.about, ...(source.about || {}) },
        login: { ...DEFAULT_CONFIG.login, ...(source.login || {}) },
        poke: {
            ...DEFAULT_CONFIG.poke,
            ...(source.poke || {}),
            headingLines: Array.isArray(source.poke?.headingLines)
                ? source.poke.headingLines.filter(Boolean)
                : DEFAULT_CONFIG.poke.headingLines,
            participants: normalizePokeParticipants(source.poke?.participants),
        },
    };
}
