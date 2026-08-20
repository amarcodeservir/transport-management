export const DEFAULT_BRANDING = {
  name: "Difmo Logistics",
  browser_title: "Difmo Logistics - Transport & Logistics Management",
  logo: "/logo.png",
  favicon: "/logo.png",
  primary_color: "#F7941D",
  secondary_color: "#1B2A5B",
  accent_color: "#2563EB",
  sidebar_color: "#FFFFFF",
  is_default: true,
};

export const THEME_PRESETS = [
  {
    name: "Difmo Sunset & Navy (Default)",
    primary_color: "#F7941D",
    secondary_color: "#1B2A5B",
    accent_color: "#2563EB",
  },
  {
    name: "Ocean & Sun",
    primary_color: "#0E60A8",
    secondary_color: "#1B2A5B",
    accent_color: "#F7941D",
  },
  {
    name: "Emerald Express",
    primary_color: "#10B981",
    secondary_color: "#0F172A",
    accent_color: "#06B6D4",
  },
  {
    name: "Royal Sapphire",
    primary_color: "#3B82F6",
    secondary_color: "#1E1B4B",
    accent_color: "#8B5CF6",
  },
  {
    name: "Ruby Crimson",
    primary_color: "#EF4444",
    secondary_color: "#18181B",
    accent_color: "#F59E0B",
  },
  {
    name: "Neon Midnight",
    primary_color: "#6366F1",
    secondary_color: "#0B0F19",
    accent_color: "#10B981",
  },
  {
    name: "Golden Onyx",
    primary_color: "#D97706",
    secondary_color: "#111827",
    accent_color: "#059669",
  },
];

export const BRANDING_UPDATED_EVENT = "organization-branding-updated";
export const THEME_COLOR_FIELDS = ["primary_color", "secondary_color", "accent_color"];
const BRANDING_CACHE_PREFIX = "organization_branding_v1";

const validHex = (value) => /^#[0-9A-F]{6}$/i.test(String(value || "").trim());
const normalizeHex = (value, fallback) => validHex(value) ? String(value).trim().toUpperCase() : fallback;
const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex, "#000000").slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};
const rgbToHex = ({ r, g, b }) => `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export const mixColors = (source, target, amount) => {
  const from = hexToRgb(source);
  const to = hexToRgb(target);
  return rgbToHex({
    r: from.r + ((to.r - from.r) * amount),
    g: from.g + ((to.g - from.g) * amount),
    b: from.b + ((to.b - from.b) * amount),
  });
};

const relativeLuminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
};

export const getContrastColor = (hex) => relativeLuminance(hex) > 0.42 ? "#111827" : "#FFFFFF";

const hexToHsl = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: lightness * 100 };
  const difference = max - min;
  const saturation = lightness > 0.5 ? difference / (2 - max - min) : difference / (max + min);
  let hue = max === red
    ? ((green - blue) / difference) + (green < blue ? 6 : 0)
    : max === green
      ? ((blue - red) / difference) + 2
      : ((red - green) / difference) + 4;
  hue *= 60;
  return { h: hue, s: saturation * 100, l: lightness * 100 };
};

const hslToHex = ({ h, s, l }) => {
  const saturation = Math.max(0, Math.min(100, s)) / 100;
  const lightness = Math.max(0, Math.min(100, l)) / 100;
  const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
  const segment = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const candidates = segment < 1 ? [chroma, x, 0]
    : segment < 2 ? [x, chroma, 0]
      : segment < 3 ? [0, chroma, x]
        : segment < 4 ? [0, x, chroma]
          : segment < 5 ? [x, 0, chroma]
            : [chroma, 0, x];
  const match = lightness - (chroma / 2);
  return rgbToHex({ r: (candidates[0] + match) * 255, g: (candidates[1] + match) * 255, b: (candidates[2] + match) * 255 });
};

const rotateThemeColor = (hex, degrees, lightness) => {
  const hsl = hexToHsl(hex);
  return hslToHex({ h: hsl.h + degrees, s: Math.max(48, hsl.s), l: lightness });
};

export const resolveBrandingAssetUrl = (value) => {
  const reference = String(value || "").trim();
  if (!reference) return "";
  if (/^(https?:|data:|blob:)/i.test(reference)) return reference;
  if (reference.startsWith("/api/")) {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    try {
      return `${new URL(apiBase, window.location.origin).origin}${reference}`;
    } catch {
      return reference;
    }
  }
  return reference;
};

export const normalizeBranding = (value = {}) => ({
  ...DEFAULT_BRANDING,
  ...value,
  name: value.name || DEFAULT_BRANDING.name,
  browser_title: value.browser_title || value.name || DEFAULT_BRANDING.browser_title,
  logo: resolveBrandingAssetUrl(value.logo) || DEFAULT_BRANDING.logo,
  favicon: resolveBrandingAssetUrl(value.favicon) || DEFAULT_BRANDING.favicon,
  primary_color: normalizeHex(value.primary_color, DEFAULT_BRANDING.primary_color),
  secondary_color: normalizeHex(value.secondary_color, DEFAULT_BRANDING.secondary_color),
  accent_color: normalizeHex(value.accent_color, DEFAULT_BRANDING.accent_color),
  sidebar_color: DEFAULT_BRANDING.sidebar_color,
  is_default: Boolean(value.is_default),
});

const brandingCacheKey = (organizationId) => `${BRANDING_CACHE_PREFIX}:${organizationId}`;

export const readCachedBranding = (organizationId) => {
  if (!organizationId || typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(localStorage.getItem(brandingCacheKey(organizationId)) || "null");
    return cached ? normalizeBranding(cached) : null;
  } catch {
    localStorage.removeItem(brandingCacheKey(organizationId));
    return null;
  }
};

export const cacheBranding = (organizationId, value) => {
  const branding = normalizeBranding(value);
  if (organizationId && typeof window !== "undefined") {
    localStorage.setItem(brandingCacheKey(organizationId), JSON.stringify(branding));
  }
  return branding;
};

export const getThemeStyle = (value) => {
  const branding = normalizeBranding(value);
  return {
    "--brand-primary": branding.primary_color,
    "--brand-primary-hover": mixColors(branding.primary_color, "#000000", 0.14),
    "--brand-primary-soft": mixColors(branding.primary_color, "#FFFFFF", 0.88),
    "--brand-primary-muted": mixColors(branding.primary_color, "#FFFFFF", 0.72),
    "--brand-on-primary": getContrastColor(branding.primary_color),
    "--brand-secondary": branding.secondary_color,
    "--brand-secondary-hover": mixColors(branding.secondary_color, "#000000", 0.12),
    "--brand-on-secondary": getContrastColor(branding.secondary_color),
    "--brand-accent": branding.accent_color,
    "--brand-accent-hover": mixColors(branding.accent_color, "#000000", 0.14),
    "--brand-on-accent": getContrastColor(branding.accent_color),
    "--brand-sidebar": "#FFFFFF",
    "--brand-sidebar-text": "#0F172A",
    "--brand-sidebar-muted": "#64748B",
  };
};

export const extractThemeFromImage = async (source) => {
  if (!source) throw new Error("Logo image is required");
  const { image, objectUrl } = await loadImage(source);
  try {
    const canvas = document.createElement("canvas");
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    const buckets = new Map();

    for (let index = 0; index < pixels.length; index += 16) {
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (alpha < 150 || (r > 242 && g > 242 && b > 242) || (r < 18 && g < 18 && b < 18)) continue;
      const maximum = Math.max(r, g, b);
      const minimum = Math.min(r, g, b);
      const saturation = maximum ? (maximum - minimum) / maximum : 0;
      if (saturation < 0.12 && maximum > 210) continue;
      const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0, saturation: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.saturation += saturation;
      buckets.set(key, bucket);
    }

    const ranked = [...buckets.values()]
      .map((bucket) => ({
        ...bucket,
        color: rgbToHex({ r: bucket.r / bucket.count, g: bucket.g / bucket.count, b: bucket.b / bucket.count }),
        score: bucket.count * (0.65 + (bucket.saturation / bucket.count)),
      }))
      .sort((first, second) => second.score - first.score);

    const colors = [];
    for (const candidate of ranked) {
      const rgb = hexToRgb(candidate.color);
      const distinct = colors.every((color) => {
        const existing = hexToRgb(color);
        return Math.hypot(rgb.r - existing.r, rgb.g - existing.g, rgb.b - existing.b) > 72;
      });
      if (distinct) colors.push(candidate.color);
      if (colors.length === 3) break;
    }

    if (!colors.length) throw new Error("Logo se usable color detect nahi hua");
    const primaryColor = colors[0];
    const secondaryColor = colors[1] || rotateThemeColor(primaryColor, 210, 28);
    return {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: colors[2] || rotateThemeColor(primaryColor, 145, 48),
    };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
};

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  let objectUrl = "";
  image.crossOrigin = "anonymous";
  image.onload = () => resolve({ image, objectUrl });
  image.onerror = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    reject(new Error("Logo image could not be loaded"));
  };
  if (typeof File !== "undefined" && source instanceof File) {
    objectUrl = URL.createObjectURL(source);
    image.src = objectUrl;
  } else {
    image.src = resolveBrandingAssetUrl(source);
  }
});

export const applyDocumentBranding = (value) => {
  const branding = normalizeBranding(value);
  document.title = branding.browser_title;

  let favicon = document.querySelector("link[data-dashboard-favicon]");
  if (!favicon) {
    favicon = document.querySelector("link[rel~='icon']") || document.createElement("link");
    favicon.setAttribute("rel", "icon");
    favicon.setAttribute("data-dashboard-favicon", "true");
    if (!favicon.parentNode) document.head.appendChild(favicon);
  }
  favicon.removeAttribute("type");
  favicon.setAttribute("href", branding.favicon);
  return branding;
};
