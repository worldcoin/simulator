const plugin = require("tailwindcss/plugin");
const defaultTheme = require("tailwindcss/defaultTheme");

// Design tokens come straight from Nucleus, the cross-platform World design
// system that World App consumes on iOS and Android, so the simulator stays in
// sync with the real app. https://github.com/worldcoin/nucleus
const primitives = require("@worldcoin/nucleus/nucleus-primitive-colors.json");
const semantic = require("@worldcoin/nucleus/nucleus-semantic-colors-light.json");
const fonts = require("@worldcoin/nucleus/nucleus-fonts.json");

/** `grey950: "#1F1F1F"` -> `{ grey: { 950: "#1F1F1F" } }` (white/black stay flat). */
const palette = Object.entries(primitives).reduce((acc, [key, value]) => {
    const match = /^([a-z]+)(\d+)$/.exec(key);
    if (!match) {
        acc[key] = value;
        return acc;
    }
    const [, hue, step] = match;
    acc[hue] = { ...(acc[hue] ?? {}), [step]: value };
    return acc;
}, {});

/** Resolve `{primitive.color.grey.950}` style references to their hex value. */
const resolve = (value) => {
    const ref = /^\{primitive\.color\.([a-z]+)(?:\.(\d+))?\}$/.exec(value);
    if (!ref) return value;
    const [, hue, step] = ref;
    return step ? palette[hue][step] : palette[hue];
};

/**
 * `foregroundPrimary` -> `fg.primary`, `backgroundSecondary` -> `surface.secondary`,
 * `strokeSecondary` -> `stroke.secondary`, `statusError` -> `status.error`, ...
 */
const semanticGroups = Object.entries(semantic).reduce((acc, [key, value]) => {
    const [, group, name] = /^([a-z]+)([A-Z][a-zA-Z]+)$/.exec(key);
    const groupKey = { background: "surface", foreground: "fg" }[group] ?? group;
    acc[groupKey] = { ...(acc[groupKey] ?? {}), [name.toLowerCase()]: resolve(value) };
    return acc;
}, {});

/** Nucleus type scale: `text-h2`, `text-b1`, `text-l2`, ... carry size, weight, tracking and leading. */
const fontSize = Object.fromEntries(
    Object.entries(fonts).map(([token, t]) => [
        token,
        [
            t.size,
            {
                lineHeight: String(t.lineHeight),
                letterSpacing: t.letterSpacing,
                fontWeight: String(t.weight),
            },
        ],
    ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],

    theme: {
        colors: {
            transparent: "transparent",
            current: "currentColor",
            ...palette,
            // World App adds a single off-white step below the Nucleus ramp for pills and tiles.
            grey: { ...palette.grey, 50: "#F9FAFB" },
            ...semanticGroups,
        },

        fontSize,

        fontFamily: {
            sans: ["var(--font-world)", ...defaultTheme.fontFamily.sans],
        },

        borderRadius: {
            none: "0",
            2: "2px",
            4: "4px",
            6: "6px",
            8: "8px",
            10: "10px",
            12: "12px",
            14: "14px",
            16: "16px",
            20: "20px",
            24: "24px",
            28: "28px",
            32: "32px",
            40: "40px",
            full: "9999px",
        },

        borderWidth: {
            DEFAULT: "1px",
            0: "0",
            2: "2px",
            4: "4px",
        },

        boxShadow: {
            // CredentialCard: black @15%, y 4, blur 12
            card: "0 4px 12px rgba(0, 0, 0, 0.15)",
            // Bottom sheet: black @4%, y -2, blur 10
            sheet: "0 -2px 10px rgba(0, 0, 0, 0.04)",
            // Toast: #243981 @10%, y 10, blur 30
            toast: "0 10px 30px rgba(36, 57, 129, 0.1)",
            none: "none",
        },

        extend: {
            fontWeight: {
                light: "300",
                regular: "350",
                medium: "500",
                semibold: "600",
                bold: "650",
            },

            animation: {
                indicator: "spin 0.4s linear infinite",
                shimmer: "shimmer 1.6s ease-in-out infinite",
                "fade-in": "fade-in 200ms ease-out forwards",
            },

            keyframes: {
                shimmer: {
                    "0%": { backgroundPosition: "200% 0" },
                    "100%": { backgroundPosition: "-200% 0" },
                },
                "fade-in": {
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
            },

            gridTemplateColumns: {
                "1fr/auto": "1fr auto",
                "auto/1fr": "auto 1fr",
                "auto/1fr/auto": "auto 1fr auto",
            },

            gridTemplateRows: {
                "1fr/auto": "1fr auto",
                "auto/1fr": "auto 1fr",
                "auto/1fr/auto": "auto 1fr auto",
            },

            screens: {
                xs: "500px",
            },

            spacing: {
                4.5: "1.125rem",
                13: "3.25rem",
                15: "3.75rem",
                18: "4.5rem",
            },

            transitionProperty: {
                press: "transform, opacity, background-color, color",
            },

            transitionDuration: {
                DEFAULT: "200ms",
                100: "100ms",
                500: "500ms",
            },
        },
    },

    plugins: [
        plugin(({ addUtilities, theme }) =>
            addUtilities({
                ".area-span-full": { gridArea: "1/1/-1/-1" },
                ".scrollbar-hidden": {
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                },
                ".no-select": {
                    "-webkit-user-select": "none",
                    "user-select": "none",
                },
                // World App uses continuous (squircle) corners; CSS can't, so the
                // closest we get is the plain radius plus this softer press curve.
                ".ease-press": {
                    transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                },
                // Skeleton placeholder, mirrors World App's ShimmeringRectangleView.
                ".shimmer": {
                    backgroundImage: `linear-gradient(90deg, ${theme("colors.grey.100")} 0%, ${theme("colors.grey.200")} 50%, ${theme("colors.grey.100")} 100%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.6s ease-in-out infinite",
                },
                // Gold foil used for the "Human" wordmark on the credential card.
                ".text-foil-gold": {
                    backgroundImage:
                        "linear-gradient(100deg, #6b4c1a 0%, #b8893a 30%, #e2c27a 50%, #b8893a 70%, #6b4c1a 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                },
            }),
        ),
    ],
};
