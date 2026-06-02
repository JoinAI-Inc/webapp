const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";
const BASE = `${IMAGE_URL}/new-home`;
const API_BASE_URL = process.env.API_BACKEND_URL || "http://localhost:3001";

type InspirationItem = {
  id: string;
  name: string;
};

type PokeParticipant = {
  name: string;
  id: string;
  followers: string;
};

type OotdItem = {
  imageUrl: string;
  placeholderColor: string;
  label: string;
};

export type SiteThemeConfig = {
  theme: {
    primaryColor: string;
    textColor: string;
    mutedTextColor: string;
    heroBackgroundColor: string;
    mediaShellStart: string;
    mediaShellEnd: string;
    cardBackgroundStart: string;
    cardBackgroundEnd: string;
    ctaGradientStart: string;
    ctaGradientEnd: string;
    ctaFocusColor: string;
  };
  hero: {
    titlePrefix: string;
    titleHighlight: string;
    titleSuffix: string;
    logoPrefix: string;
    subtitlePrefix: string;
    subtitleSuffix: string;
    ctaLabel: string;
    brandIconUrl: string;
    logoImageUrl: string;
    backgroundImageUrl: string;
    ctaBackgroundImageUrl: string;
    rows: string[][];
  };
  redBrand: {
    backgroundColor: string;
    patternImageUrl: string;
    leftBaseImageUrl: string;
    leftOverlayImageUrl: string;
    rightBaseImageUrl: string;
    rightOverlayImageUrl: string;
    iconUrl: string;
    title: string;
    support: string;
    titleColor: string;
    supportColor: string;
  };
  gallery: {
    backgroundColor: string;
    title: string;
    highlight: string;
    suffix: string;
    support: string;
    titleColor: string;
    highlightColor: string;
    supportColor: string;
    cardBackgroundColor: string;
    images: string[];
  };
  pet: {
    backgroundColor: string;
    cloudImageUrl: string;
    topLeftImageUrl: string;
    topRightImageUrl: string;
    bottomLeftImageUrl: string;
    bottomRightImageUrl: string;
    titlePrefix: string;
    titleMiddle: string;
    titleHighlight: string;
    text: string;
    titleColor: string;
    highlightColor: string;
    textColor: string;
  };
  ootd: {
    backgroundColor: string;
    title: string;
    highlight: string;
    suffix: string;
    support: string;
    titleColor: string;
    highlightColor: string;
    supportColor: string;
    cardBackgroundColor: string;
    items: OotdItem[];
  };
  inspiration: {
    backgroundStartColor: string;
    backgroundEndColor: string;
    patternImageUrl: string;
    decorImageUrl: string;
    title: string;
    titleColor: string;
    entryColor: string;
    dividerColor: string;
    note: string;
    noteColor: string;
    specialThanksText: string;
    thanksIconUrl: string;
    items: InspirationItem[];
  };
  announcement: {
    backgroundColor: string;
    imageUrl: string;
    mediaBackgroundImageUrl: string;
    titlePrefix: string;
    titleHighlight: string;
    support: string;
    titleColor: string;
    highlightColor: string;
    supportColor: string;
    supportHighlightColor: string;
  };
  footer: {
    backgroundColor: string;
    backgroundImageUrl: string;
    title: string;
    titleColor: string;
    ctaLabel: string;
    ctaIconUrl: string;
    ctaBackgroundColor: string;
    ctaTextColor: string;
    collageImageUrl: string;
    metaColor: string;
    copyrightText: string;
    recordText: string;
  };
  about: {
    backgroundColor: string;
    backgroundImageUrl: string;
    illustrationUrl: string;
    decorationImageUrl: string;
    heartIconUrl: string;
    accentColor: string;
    textColor: string;
    mutedTextColor: string;
    inputBackgroundColor: string;
    inputBorderColor: string;
    disabledButtonColor: string;
    title: string;
    headlinePrefix: string;
    headlineHighlight: string;
    headlineSuffix: string;
    subheadline: string;
    placeholder: string;
    emailLabel: string;
    email: string;
  };
  poke: {
    backgroundColor: string;
    gradientStartColor: string;
    gradientEndColor: string;
    lanternImageUrl: string;
    headingColor: string;
    headingLines: string[];
    tableHeaderColor: string;
    tableTextColor: string;
    tableBorderColor: string;
    thanksTextColor: string;
    thanksText: string;
    specialThanksText: string;
    xhsIconUrl: string;
    participants: PokeParticipant[];
  };
};

const DEFAULT_ROWS = [
  [
    `${BASE}/img-home-hero-1-1.png`,
    `${BASE}/img-home-hero-1-2.png`,
    `${BASE}/img-home-hero-1-3.png`,
    `${BASE}/img-home-hero-1-4.png`,
    `${BASE}/img-home-hero-1-5.png`,
    `${BASE}/img-home-hero-1-6.png`,
    `${BASE}/img-home-hero-1-7.png`,
    `${BASE}/img-home-hero-1-8.png`,
  ],
  [
    `${BASE}/img-home-hero-2-1.png`,
    `${BASE}/img-home-hero-2-2.png`,
    `${BASE}/img-home-hero-2-3.png`,
    `${BASE}/img-home-hero-2-4.png`,
    `${BASE}/img-home-hero-2-5.png`,
    `${BASE}/img-home-hero-2-6.png`,
    `${BASE}/img-home-hero-2-7.png`,
    `${BASE}/img-home-hero-2-8.png`,
  ],
  [
    `${BASE}/img-home-hero-3-1.png`,
    `${BASE}/img-home-hero-3-2.png`,
    `${BASE}/img-home-hero-3-3.png`,
    `${BASE}/img-home-hero-3-4.png`,
    `${BASE}/img-home-hero-3-5.png`,
    `${BASE}/img-home-hero-3-6.png`,
    `${BASE}/img-home-hero-3-7.png`,
    `${BASE}/img-home-hero-3-8.png`,
  ],
];

const DEFAULT_INSPIRATION_ITEMS = [
  { id: "Yetkitty951004", name: "哈尼桃桃酱" },
  { id: "207305504", name: "李开心的亲子时光" },
  { id: "375785978", name: "绵绵岛" },
  { id: "Hyl95234", name: "Nico匠" },
  { id: "944605407", name: "-是溪溪呀-" },
  { id: "95555262084", name: "米米🌸🌸🌸" },
  { id: "6574283932", name: "是安宁呀！！！" },
  { id: "R44444444", name: "叔系少年老三" },
  { id: "bei185448278", name: "贝贝万事屋" },
  { id: "109627123", name: "鹿儿Tata" },
  { id: "94118559427", name: "数码侦探小何" },
  { id: "959628182", name: "Mici" },
];

const DEFAULT_POKE_PARTICIPANTS = [
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

export const DEFAULT_SITE_THEME: SiteThemeConfig = {
  theme: {
    primaryColor: "#EC2E2E",
    textColor: "#0A0708",
    mutedTextColor: "#39383B",
    heroBackgroundColor: "#FFFFFF",
    mediaShellStart: "#F7F4F2",
    mediaShellEnd: "#EEE9E5",
    cardBackgroundStart: "#D8D8DA",
    cardBackgroundEnd: "#CFCFD3",
    ctaGradientStart: "#FF5C2E",
    ctaGradientEnd: "#E81500",
    ctaFocusColor: "#FFD322",
  },
  hero: {
    titlePrefix: "The most ",
    titleHighlight: "popular fortune",
    titleSuffix: "",
    logoPrefix: "foto in",
    subtitlePrefix: "how to make a foto",
    subtitleSuffix: "that real Chinese would jealous",
    ctaLabel: "Try it free",
    brandIconUrl: `${BASE}/icon-house.png`,
    logoImageUrl: `${BASE}/icon-xiaohongshu.png`,
    backgroundImageUrl: `${BASE}/bg-hero.png`,
    ctaBackgroundImageUrl: `${BASE}/bg-try-it-free-button.png`,
    rows: DEFAULT_ROWS,
  },
  redBrand: {
    backgroundColor: "#DD1E1B",
    patternImageUrl: `${BASE}/lucky-photo-year-pattern.png`,
    leftBaseImageUrl: `${BASE}/lucky-photo-year-left-mountain.png`,
    leftOverlayImageUrl: `${BASE}/bg-mid-autumn.png`,
    rightBaseImageUrl: `${BASE}/lucky-photo-year-right-mountain.png`,
    rightOverlayImageUrl: `${BASE}/bg-dragon-boat.png`,
    iconUrl: `${BASE}/icon-fu.png`,
    title: "furtune Foto of the year now",
    support:
      "Capture the moments in the new year,\nLet every click of the shutter preserve the essence of time. May the coming year be as splendid as a brocade, with all wishes fulfilled.",
    titleColor: "#FFFFFF",
    supportColor: "rgba(255, 255, 255, 0.82)",
  },
  gallery: {
    backgroundColor: "#FFFFFF",
    title: "Also, can",
    highlight: "not just you...",
    suffix: "",
    support:
      "Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.",
    titleColor: "#0A0708",
    highlightColor: "#EC2E2E",
    supportColor: "#39383B",
    cardBackgroundColor: "#F5F5F5",
    images: [
      `${BASE}/img-also-1.png`,
      `${BASE}/img-also-2.png`,
      `${BASE}/img-also-3.png`,
      `${BASE}/img-also-4.png`,
    ],
  },
  pet: {
    backgroundColor: "#FFFFFF",
    cloudImageUrl: `${BASE}/lucky-photo-pet-cloud.png`,
    topLeftImageUrl: `${BASE}/img-also-pet-tl.png`,
    topRightImageUrl: `${BASE}/img-also-pet-tr.png`,
    bottomLeftImageUrl: `${BASE}/img-also-pet-bl.png`,
    bottomRightImageUrl: `${BASE}/img-also-pet-br.png`,
    titlePrefix: "OR,",
    titleMiddle: "Even for",
    titleHighlight: "your pet",
    text:
      "Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.",
    titleColor: "#0A0708",
    highlightColor: "#EC2E2E",
    textColor: "#6D6C70",
  },
  ootd: {
    backgroundColor: "#FFFFFF",
    title: "IN Every",
    highlight: "OOTD",
    suffix: "You LIKE",
    support:
      "Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.",
    titleColor: "#0A0708",
    highlightColor: "#EC2E2E",
    supportColor: "#39383B",
    cardBackgroundColor: "#F5F5F5",
    items: [
      { imageUrl: `${BASE}/lucky-photo-ootd-1.png`, placeholderColor: "#F6C46A", label: "OOTD 1" },
      { imageUrl: `${BASE}/lucky-photo-ootd-2.png`, placeholderColor: "#E96255", label: "OOTD 2" },
      { imageUrl: `${BASE}/lucky-photo-ootd-3.png`, placeholderColor: "#73B69B", label: "OOTD 3" },
    ],
  },
  inspiration: {
    backgroundStartColor: "#DA2524",
    backgroundEndColor: "#C00B0A",
    patternImageUrl: "/bg-insprition.svg",
    decorImageUrl: `${BASE}/lucky-photo-gradient-card-decor.png`,
    title: "Insprition from",
    titleColor: "#C51C1B",
    entryColor: "#E29211",
    dividerColor: "#E29211",
    note: "鼓励大家去follow他们的话和感谢的话",
    noteColor: "#C51C1B",
    specialThanksText: "Special Thanks to",
    thanksIconUrl: "/icon-xhs.svg",
    items: DEFAULT_INSPIRATION_ITEMS,
  },
  announcement: {
    backgroundColor: "#FFFFFF",
    imageUrl: `${BASE}/bg-horse.png`,
    mediaBackgroundImageUrl: `${BASE}/bg-special.png`,
    titlePrefix: "Special",
    titleHighlight: "Announcement",
    support:
      "As part of our commitment to respecting your privacy, **we do not store any photos you upload.** Furthermore, since our service does not require creating a unique Avatar of you, **there is no need to upload multiple photos** —just one is sufficient.",
    titleColor: "#0A0708",
    highlightColor: "#EC2E2E",
    supportColor: "#39383B",
    supportHighlightColor: "rgb(236, 46, 46)",
  },
  footer: {
    backgroundColor: "#EC2E2E",
    backgroundImageUrl: "/landing-footer/lucky-photo-footer-bg.png",
    title: "Get your fortune Foto right now",
    titleColor: "#FFFFFF",
    ctaLabel: "Try it free",
    ctaIconUrl: "/landing-footer/lucky-photo-home-cta-icon-brand.svg",
    ctaBackgroundColor: "#FFFFFF",
    ctaTextColor: "#EC2E2E",
    collageImageUrl: "/landing-footer/lucky-photo-footer-collage.png",
    metaColor: "#E0B2B2",
    copyrightText: "Copyright © 2026 JoinAI. All rights reserved.",
    recordText: "浙ICP备2021040718号-2",
  },
  about: {
    backgroundColor: "#FDF5EA",
    backgroundImageUrl: `${BASE}/bg-home-1.png`,
    illustrationUrl: `${BASE}/img-about-horses.png`,
    decorationImageUrl: "/bg-about-1.svg",
    heartIconUrl: "/icon-heart.png",
    accentColor: "#EC2E2E",
    textColor: "#0A0708",
    mutedTextColor: "#9B9A9D",
    inputBackgroundColor: "#FDF5EA",
    inputBorderColor: "#E4D7C5",
    disabledButtonColor: "#E8E8E8",
    title: "Leave us a message",
    headlinePrefix: "just that your option is",
    headlineHighlight: "precious to us",
    headlineSuffix: "",
    subheadline: "feel free to write down anything",
    placeholder: "Leave us a message...",
    emailLabel: "or sent us an E-Mail:",
    email: "hello@joinai.com",
  },
  poke: {
    backgroundColor: "#FFF9F2",
    gradientStartColor: "#C11010",
    gradientEndColor: "#FFF9F2",
    lanternImageUrl: `${BASE}/img-poke-lantern.png`,
    headingColor: "#FFFFFF",
    headingLines: [
      "This Idea can never be happend without",
      "the inspiration form those awesome people",
      "Best wishes & Big thank-you to them",
    ],
    tableHeaderColor: "#C39E67",
    tableTextColor: "#A16610",
    tableBorderColor: "#C9A86C",
    thanksTextColor: "#C51C1B",
    thanksText: "鼓励大家去follow他们的话和感谢的话",
    specialThanksText: "Special Thanks to",
    xhsIconUrl: "/icon-xhs.svg",
    participants: DEFAULT_POKE_PARTICIPANTS,
  },
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return items.length > 0 ? items : fallback;
}

function asObject(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function normalizeRows(value: unknown): string[][] {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_THEME.hero.rows;
  }

  return Array.from({ length: 3 }, (_, rowIndex) => {
    const row = value[rowIndex];
    if (!Array.isArray(row)) {
      return DEFAULT_SITE_THEME.hero.rows[rowIndex];
    }

    const images = row.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );

    return images.length > 0 ? images : DEFAULT_SITE_THEME.hero.rows[rowIndex];
  });
}

function normalizeOotdItems(value: unknown): OotdItem[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_THEME.ootd.items;
  }

  const items = value
    .map((item, index) => {
      const data = asObject(item);
      const fallback = DEFAULT_SITE_THEME.ootd.items[index] || DEFAULT_SITE_THEME.ootd.items[0];
      return {
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : fallback.imageUrl,
        placeholderColor: asString(data.placeholderColor, fallback.placeholderColor),
        label: asString(data.label, fallback.label),
      };
    })
    .filter((item) => item.imageUrl.trim() || item.placeholderColor.trim());

  return items.length > 0 ? items : DEFAULT_SITE_THEME.ootd.items;
}

function normalizeInspirationItems(value: unknown): InspirationItem[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_THEME.inspiration.items;
  }

  const items = value
    .map((item) => {
      const data = asObject(item);
      return {
        id: asString(data.id, ""),
        name: asString(data.name, ""),
      };
    })
    .filter((item) => item.id && item.name);

  return items.length > 0 ? items : DEFAULT_SITE_THEME.inspiration.items;
}

function normalizePokeParticipants(value: unknown): PokeParticipant[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_THEME.poke.participants;
  }

  const items = value
    .map((item) => {
      const data = asObject(item);
      return {
        name: asString(data.name, ""),
        id: asString(data.id, ""),
        followers: typeof data.followers === "string" ? data.followers : "",
      };
    })
    .filter((item) => item.name && item.id);

  return items.length > 0 ? items : DEFAULT_SITE_THEME.poke.participants;
}

export function normalizeSiteThemeConfig(
  value: unknown,
): SiteThemeConfig {
  const data = asObject(value);
  const theme = asObject(data.theme);
  const hero = asObject(data.hero);
  const redBrand = asObject(data.redBrand);
  const gallery = asObject(data.gallery);
  const pet = asObject(data.pet);
  const ootd = asObject(data.ootd);
  const inspiration = asObject(data.inspiration);
  const announcement = asObject(data.announcement);
  const footer = asObject(data.footer);
  const about = asObject(data.about);
  const poke = asObject(data.poke);

  return {
    theme: {
      primaryColor: asString(theme.primaryColor, DEFAULT_SITE_THEME.theme.primaryColor),
      textColor: asString(theme.textColor, DEFAULT_SITE_THEME.theme.textColor),
      mutedTextColor: asString(theme.mutedTextColor, DEFAULT_SITE_THEME.theme.mutedTextColor),
      heroBackgroundColor: asString(theme.heroBackgroundColor, DEFAULT_SITE_THEME.theme.heroBackgroundColor),
      mediaShellStart: asString(theme.mediaShellStart, DEFAULT_SITE_THEME.theme.mediaShellStart),
      mediaShellEnd: asString(theme.mediaShellEnd, DEFAULT_SITE_THEME.theme.mediaShellEnd),
      cardBackgroundStart: asString(theme.cardBackgroundStart, DEFAULT_SITE_THEME.theme.cardBackgroundStart),
      cardBackgroundEnd: asString(theme.cardBackgroundEnd, DEFAULT_SITE_THEME.theme.cardBackgroundEnd),
      ctaGradientStart: asString(theme.ctaGradientStart, DEFAULT_SITE_THEME.theme.ctaGradientStart),
      ctaGradientEnd: asString(theme.ctaGradientEnd, DEFAULT_SITE_THEME.theme.ctaGradientEnd),
      ctaFocusColor: asString(theme.ctaFocusColor, DEFAULT_SITE_THEME.theme.ctaFocusColor),
    },
    hero: {
      titlePrefix: asString(hero.titlePrefix, DEFAULT_SITE_THEME.hero.titlePrefix),
      titleHighlight: asString(hero.titleHighlight, DEFAULT_SITE_THEME.hero.titleHighlight),
      titleSuffix: typeof hero.titleSuffix === "string" ? hero.titleSuffix : DEFAULT_SITE_THEME.hero.titleSuffix,
      logoPrefix: asString(hero.logoPrefix, DEFAULT_SITE_THEME.hero.logoPrefix),
      subtitlePrefix: asString(hero.subtitlePrefix, DEFAULT_SITE_THEME.hero.subtitlePrefix),
      subtitleSuffix: asString(hero.subtitleSuffix, DEFAULT_SITE_THEME.hero.subtitleSuffix),
      ctaLabel: asString(hero.ctaLabel, DEFAULT_SITE_THEME.hero.ctaLabel),
      brandIconUrl: asString(hero.brandIconUrl, DEFAULT_SITE_THEME.hero.brandIconUrl),
      logoImageUrl: asString(hero.logoImageUrl, DEFAULT_SITE_THEME.hero.logoImageUrl),
      backgroundImageUrl: asString(hero.backgroundImageUrl, DEFAULT_SITE_THEME.hero.backgroundImageUrl),
      ctaBackgroundImageUrl: asString(hero.ctaBackgroundImageUrl, DEFAULT_SITE_THEME.hero.ctaBackgroundImageUrl),
      rows: normalizeRows(hero.rows),
    },
    redBrand: {
      backgroundColor: asString(redBrand.backgroundColor, DEFAULT_SITE_THEME.redBrand.backgroundColor),
      patternImageUrl: asString(redBrand.patternImageUrl, DEFAULT_SITE_THEME.redBrand.patternImageUrl),
      leftBaseImageUrl: asString(redBrand.leftBaseImageUrl, DEFAULT_SITE_THEME.redBrand.leftBaseImageUrl),
      leftOverlayImageUrl: asString(redBrand.leftOverlayImageUrl, DEFAULT_SITE_THEME.redBrand.leftOverlayImageUrl),
      rightBaseImageUrl: asString(redBrand.rightBaseImageUrl, DEFAULT_SITE_THEME.redBrand.rightBaseImageUrl),
      rightOverlayImageUrl: asString(redBrand.rightOverlayImageUrl, DEFAULT_SITE_THEME.redBrand.rightOverlayImageUrl),
      iconUrl: asString(redBrand.iconUrl, DEFAULT_SITE_THEME.redBrand.iconUrl),
      title: asString(redBrand.title, DEFAULT_SITE_THEME.redBrand.title),
      support: asString(redBrand.support, DEFAULT_SITE_THEME.redBrand.support),
      titleColor: asString(redBrand.titleColor, DEFAULT_SITE_THEME.redBrand.titleColor),
      supportColor: asString(redBrand.supportColor, DEFAULT_SITE_THEME.redBrand.supportColor),
    },
    gallery: {
      backgroundColor: asString(gallery.backgroundColor, DEFAULT_SITE_THEME.gallery.backgroundColor),
      title: asString(gallery.title, DEFAULT_SITE_THEME.gallery.title),
      highlight: asString(gallery.highlight, DEFAULT_SITE_THEME.gallery.highlight),
      suffix: typeof gallery.suffix === "string" ? gallery.suffix : DEFAULT_SITE_THEME.gallery.suffix,
      support: asString(gallery.support, DEFAULT_SITE_THEME.gallery.support),
      titleColor: asString(gallery.titleColor, DEFAULT_SITE_THEME.gallery.titleColor),
      highlightColor: asString(gallery.highlightColor, DEFAULT_SITE_THEME.gallery.highlightColor),
      supportColor: asString(gallery.supportColor, DEFAULT_SITE_THEME.gallery.supportColor),
      cardBackgroundColor: asString(gallery.cardBackgroundColor, DEFAULT_SITE_THEME.gallery.cardBackgroundColor),
      images: asStringArray(gallery.images, DEFAULT_SITE_THEME.gallery.images),
    },
    pet: {
      backgroundColor: asString(pet.backgroundColor, DEFAULT_SITE_THEME.pet.backgroundColor),
      cloudImageUrl: asString(pet.cloudImageUrl, DEFAULT_SITE_THEME.pet.cloudImageUrl),
      topLeftImageUrl: asString(pet.topLeftImageUrl, DEFAULT_SITE_THEME.pet.topLeftImageUrl),
      topRightImageUrl: asString(pet.topRightImageUrl, DEFAULT_SITE_THEME.pet.topRightImageUrl),
      bottomLeftImageUrl: asString(pet.bottomLeftImageUrl, DEFAULT_SITE_THEME.pet.bottomLeftImageUrl),
      bottomRightImageUrl: asString(pet.bottomRightImageUrl, DEFAULT_SITE_THEME.pet.bottomRightImageUrl),
      titlePrefix: asString(pet.titlePrefix, DEFAULT_SITE_THEME.pet.titlePrefix),
      titleMiddle: asString(pet.titleMiddle, DEFAULT_SITE_THEME.pet.titleMiddle),
      titleHighlight: asString(pet.titleHighlight, DEFAULT_SITE_THEME.pet.titleHighlight),
      text: asString(pet.text, DEFAULT_SITE_THEME.pet.text),
      titleColor: asString(pet.titleColor, DEFAULT_SITE_THEME.pet.titleColor),
      highlightColor: asString(pet.highlightColor, DEFAULT_SITE_THEME.pet.highlightColor),
      textColor: asString(pet.textColor, DEFAULT_SITE_THEME.pet.textColor),
    },
    ootd: {
      backgroundColor: asString(ootd.backgroundColor, DEFAULT_SITE_THEME.ootd.backgroundColor),
      title: asString(ootd.title, DEFAULT_SITE_THEME.ootd.title),
      highlight: asString(ootd.highlight, DEFAULT_SITE_THEME.ootd.highlight),
      suffix: asString(ootd.suffix, DEFAULT_SITE_THEME.ootd.suffix),
      support: asString(ootd.support, DEFAULT_SITE_THEME.ootd.support),
      titleColor: asString(ootd.titleColor, DEFAULT_SITE_THEME.ootd.titleColor),
      highlightColor: asString(ootd.highlightColor, DEFAULT_SITE_THEME.ootd.highlightColor),
      supportColor: asString(ootd.supportColor, DEFAULT_SITE_THEME.ootd.supportColor),
      cardBackgroundColor: asString(ootd.cardBackgroundColor, DEFAULT_SITE_THEME.ootd.cardBackgroundColor),
      items: normalizeOotdItems(ootd.items),
    },
    inspiration: {
      backgroundStartColor: asString(inspiration.backgroundStartColor, DEFAULT_SITE_THEME.inspiration.backgroundStartColor),
      backgroundEndColor: asString(inspiration.backgroundEndColor, DEFAULT_SITE_THEME.inspiration.backgroundEndColor),
      patternImageUrl: asString(inspiration.patternImageUrl, DEFAULT_SITE_THEME.inspiration.patternImageUrl),
      decorImageUrl: asString(inspiration.decorImageUrl, DEFAULT_SITE_THEME.inspiration.decorImageUrl),
      title: asString(inspiration.title, DEFAULT_SITE_THEME.inspiration.title),
      titleColor: asString(inspiration.titleColor, DEFAULT_SITE_THEME.inspiration.titleColor),
      entryColor: asString(inspiration.entryColor, DEFAULT_SITE_THEME.inspiration.entryColor),
      dividerColor: asString(inspiration.dividerColor, DEFAULT_SITE_THEME.inspiration.dividerColor),
      note: asString(inspiration.note, DEFAULT_SITE_THEME.inspiration.note),
      noteColor: asString(inspiration.noteColor, DEFAULT_SITE_THEME.inspiration.noteColor),
      specialThanksText: asString(inspiration.specialThanksText, DEFAULT_SITE_THEME.inspiration.specialThanksText),
      thanksIconUrl: asString(inspiration.thanksIconUrl, DEFAULT_SITE_THEME.inspiration.thanksIconUrl),
      items: normalizeInspirationItems(inspiration.items),
    },
    announcement: {
      backgroundColor: asString(announcement.backgroundColor, DEFAULT_SITE_THEME.announcement.backgroundColor),
      imageUrl: asString(announcement.imageUrl, DEFAULT_SITE_THEME.announcement.imageUrl),
      mediaBackgroundImageUrl: asString(announcement.mediaBackgroundImageUrl, DEFAULT_SITE_THEME.announcement.mediaBackgroundImageUrl),
      titlePrefix: asString(announcement.titlePrefix, DEFAULT_SITE_THEME.announcement.titlePrefix),
      titleHighlight: asString(announcement.titleHighlight, DEFAULT_SITE_THEME.announcement.titleHighlight),
      support: asString(announcement.support, DEFAULT_SITE_THEME.announcement.support),
      titleColor: asString(announcement.titleColor, DEFAULT_SITE_THEME.announcement.titleColor),
      highlightColor: asString(announcement.highlightColor, DEFAULT_SITE_THEME.announcement.highlightColor),
      supportColor: asString(announcement.supportColor, DEFAULT_SITE_THEME.announcement.supportColor),
      supportHighlightColor: asString(announcement.supportHighlightColor, DEFAULT_SITE_THEME.announcement.supportHighlightColor),
    },
    footer: {
      backgroundColor: asString(footer.backgroundColor, DEFAULT_SITE_THEME.footer.backgroundColor),
      backgroundImageUrl: asString(footer.backgroundImageUrl, DEFAULT_SITE_THEME.footer.backgroundImageUrl),
      title: asString(footer.title, DEFAULT_SITE_THEME.footer.title),
      titleColor: asString(footer.titleColor, DEFAULT_SITE_THEME.footer.titleColor),
      ctaLabel: asString(footer.ctaLabel, DEFAULT_SITE_THEME.footer.ctaLabel),
      ctaIconUrl: asString(footer.ctaIconUrl, DEFAULT_SITE_THEME.footer.ctaIconUrl),
      ctaBackgroundColor: asString(footer.ctaBackgroundColor, DEFAULT_SITE_THEME.footer.ctaBackgroundColor),
      ctaTextColor: asString(footer.ctaTextColor, DEFAULT_SITE_THEME.footer.ctaTextColor),
      collageImageUrl: asString(footer.collageImageUrl, DEFAULT_SITE_THEME.footer.collageImageUrl),
      metaColor: asString(footer.metaColor, DEFAULT_SITE_THEME.footer.metaColor),
      copyrightText: asString(footer.copyrightText, DEFAULT_SITE_THEME.footer.copyrightText),
      recordText: asString(footer.recordText, DEFAULT_SITE_THEME.footer.recordText),
    },
    about: {
      backgroundColor: asString(about.backgroundColor, DEFAULT_SITE_THEME.about.backgroundColor),
      backgroundImageUrl: asString(about.backgroundImageUrl, DEFAULT_SITE_THEME.about.backgroundImageUrl),
      illustrationUrl: asString(about.illustrationUrl, DEFAULT_SITE_THEME.about.illustrationUrl),
      decorationImageUrl: asString(about.decorationImageUrl, DEFAULT_SITE_THEME.about.decorationImageUrl),
      heartIconUrl: asString(about.heartIconUrl, DEFAULT_SITE_THEME.about.heartIconUrl),
      accentColor: asString(about.accentColor, DEFAULT_SITE_THEME.about.accentColor),
      textColor: asString(about.textColor, DEFAULT_SITE_THEME.about.textColor),
      mutedTextColor: asString(about.mutedTextColor, DEFAULT_SITE_THEME.about.mutedTextColor),
      inputBackgroundColor: asString(about.inputBackgroundColor, DEFAULT_SITE_THEME.about.inputBackgroundColor),
      inputBorderColor: asString(about.inputBorderColor, DEFAULT_SITE_THEME.about.inputBorderColor),
      disabledButtonColor: asString(about.disabledButtonColor, DEFAULT_SITE_THEME.about.disabledButtonColor),
      title: asString(about.title, DEFAULT_SITE_THEME.about.title),
      headlinePrefix: asString(about.headlinePrefix, DEFAULT_SITE_THEME.about.headlinePrefix),
      headlineHighlight: asString(about.headlineHighlight, DEFAULT_SITE_THEME.about.headlineHighlight),
      headlineSuffix: asString(about.headlineSuffix, DEFAULT_SITE_THEME.about.headlineSuffix),
      subheadline: asString(about.subheadline, DEFAULT_SITE_THEME.about.subheadline),
      placeholder: asString(about.placeholder, DEFAULT_SITE_THEME.about.placeholder),
      emailLabel: asString(about.emailLabel, DEFAULT_SITE_THEME.about.emailLabel),
      email: asString(about.email, DEFAULT_SITE_THEME.about.email),
    },
    poke: {
      backgroundColor: asString(poke.backgroundColor, DEFAULT_SITE_THEME.poke.backgroundColor),
      gradientStartColor: asString(poke.gradientStartColor, DEFAULT_SITE_THEME.poke.gradientStartColor),
      gradientEndColor: asString(poke.gradientEndColor, DEFAULT_SITE_THEME.poke.gradientEndColor),
      lanternImageUrl: asString(poke.lanternImageUrl, DEFAULT_SITE_THEME.poke.lanternImageUrl),
      headingColor: asString(poke.headingColor, DEFAULT_SITE_THEME.poke.headingColor),
      headingLines: asStringArray(poke.headingLines, DEFAULT_SITE_THEME.poke.headingLines),
      tableHeaderColor: asString(poke.tableHeaderColor, DEFAULT_SITE_THEME.poke.tableHeaderColor),
      tableTextColor: asString(poke.tableTextColor, DEFAULT_SITE_THEME.poke.tableTextColor),
      tableBorderColor: asString(poke.tableBorderColor, DEFAULT_SITE_THEME.poke.tableBorderColor),
      thanksTextColor: asString(poke.thanksTextColor, DEFAULT_SITE_THEME.poke.thanksTextColor),
      thanksText: asString(poke.thanksText, DEFAULT_SITE_THEME.poke.thanksText),
      specialThanksText: asString(poke.specialThanksText, DEFAULT_SITE_THEME.poke.specialThanksText),
      xhsIconUrl: asString(poke.xhsIconUrl, DEFAULT_SITE_THEME.poke.xhsIconUrl),
      participants: normalizePokeParticipants(poke.participants),
    },
  };
}

export async function getSiteTheme() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/site-theme`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_SITE_THEME;
    }

    const material = await response.json();
    return normalizeSiteThemeConfig(material?.config);
  } catch {
    return DEFAULT_SITE_THEME;
  }
}
