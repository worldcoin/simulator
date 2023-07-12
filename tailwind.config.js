const plugin = require("tailwindcss/plugin");
const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    borderRadius: {
      2.5: "calc(2.5 * 1rem / 16)",
      5: "calc(5 * 1rem / 16)",
      8: "calc(8 * 1rem / 16)",
      9: "calc(9 * 1rem / 16)",
      4: "calc(4 * 1rem / 16)",
      10: "calc(10 * 1rem / 16)",
      12: "calc(12 * 1rem / 16)",
      16: "calc(16 * 1rem / 16)",
      18: "calc(18 * 1rem / 16)",
      20: "calc(20 * 1rem / 16)",
      24: "calc(24 * 1rem / 16)",
      30: "calc(30 * 1rem / 16)",
      34: "calc(34 * 1rem / 16)",
      36: "calc(36 * 1rem / 16)",
      40: "calc(40 * 1rem / 16)",
      full: "9999px",
      none: "0",
    },

    borderWidth: {
      DEFAULT: "1px",
      2: "2px",
      4: "4px",
      6: "6px",
    },

    boxShadow: {
      input: "0px 10px 30px rgba(25, 28, 32, 0.1)",
    },

    colors: {
      black: "#000000",
      error: {
        100: "#FFF5F7",
        700: "#FF5A76"
      },
      gray: {
        0: '#FFFFFF',
        50: "#F9FAFB",
        100: "#F3F4F5",
        200: "#EBECEF",
        300: "#D6D9DD",
        400: "#9BA3AE",
        500: "#657080",
        900: "#191C20",
      },
      icons: {
        blue: {
          primary: "#4940E0",
          secondary: "#F0F0FD",
        },
        purple: {
          primary: "#9D50FF",
          secondary: "#F7F1FF",
        }
      },
      info: {
        100: "#F5F6FD",
        700: "#506DFF",
      },
      success: {
        700: "#00C313"
      },
      warning: {
        100: '#FFF5E6',
        700: "#FFB11B"
      },
      white: "#FFFFFF",
      current: "currentColor",
      transparent: "transparent",
    },

    extend: {
      animation: {
        "pulse-short": "pulse 900ms cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-short-delay-300":
          "pulse 900ms 300ms cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-short-delay-600":
          "pulse 900ms 600ms cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-short": "fade-in 500ms cubic-bezier(.53,.04,.68,.33) forwards",
        "fade-in-long": "fade-in 600ms cubic-bezier(.53,.04,.68,.33) forwards",
        "circle-left":
          "move-right 1.4s cubic-bezier(.38,.29,.28,1.59) forwards",
        "circle-right":
          "move-left 1.1s cubic-bezier(.38,.29,.28,1.59) forwards",
      },

      gridTemplateColumns: {
        "1fr/auto": "1fr auto",
        "1fr/minmax(0/360)/1fr": "1fr minmax(0, calc(360 * .25rem)) 1fr",
        "auto/1fr": "auto 1fr",
        "auto/1fr/auto": "auto 1fr auto",
      },

      gridTemplateRows: {
        "1fr/auto": "1fr auto",
        "auto/1fr": "auto 1fr",
        "auto/1fr/auto": "auto 1fr auto",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: 0, visibility: "hidden" },
          "100%": { opacity: 1, visibility: "visible" },
        },

        "move-left": {
          "0%": { right: "-120%", opacity: 0, transform: "rotate(360deg)" },
          "100%": { right: "-30%", opacity: 1, transform: "rotate(0deg)" },
        },

        "move-right": {
          "0%": { left: "-120%", opacity: 0, transform: "rotate(360deg)" },
          "100%": { left: "-90px", opacity: 1, transform: "rotate(0deg)" },
        },
      },

      screens: {
        xs: "500px",
      },

      spacing: {
        1.5: "calc(1.5 * 1rem / 4)",
        15: "calc(15 * 1rem / 4)",
        4.5: "calc(4.5 * 1rem / 4)",
        25: "calc(25 * .25rem)",
        full: "100%",
        "screen-x": "100vw",
        "screen-y": "100vh",
      },

      transitionProperty: {
        position: "top, right, left, bottom",
        "transform/opacity": "transform, opacity",
        "visibility/opacity": "visibility, opacity",
      },

      width: {
        "max-content": "max-content",
      },

      lineHeight: {
        "1px": "1px",
      },
    },

    fontFamily: {
      rubik: ["var(--font-rubik)", ...defaultTheme.fontFamily.sans],
      sora: ["var(--font-sora)", ...defaultTheme.fontFamily.sans],
    },

    fontSize: {
      h1: ["calc(32 * 1rem / 16)", { lineHeight: "120%", fontWeight: 600 }],
      h2: ["calc(26 * 1rem / 16)", { lineHeight: "120%", fontWeight: 600 }],
      h3: ["calc(20 * 1rem / 16)", { lineHeight: "120%" }],
      s1: ["calc(18 * 1rem / 16)", { lineHeight: "120%" }],
      s2: ["calc(16 * 1rem / 16)", { lineHeight: "120%", fontWeight: 500 }],
      s3: ["calc(14 * 1rem / 16)", { lineHeight: "120%", fontWeight: 500 }],
      s4: ["calc(12 * 1rem / 16)", { lineHeight: "120%" }],
      b1: ["calc(18 * 1rem / 16)", { lineHeight: "130%" }],
      b2: ["calc(16 * 1rem / 16)", { lineHeight: "130%" }],
      b3: ["calc(14 * 1rem / 16)", { lineHeight: "130%" }],
      b4: ["calc(12 * 1rem / 16)", { lineHeight: "130%" }],
      5: ["calc(5 * 1rem / 16)", { lineHeight: "6px" }],
      7: ["calc(7 * 1rem / 16)", { lineHeight: "8px" }],
      10: "calc(10 * 1rem / 16)",
      11: "calc(11 * 1rem / 16)",
      12: "calc(12 * 1rem / 16)",
      14: "calc(14 * 1rem / 16)",
      15: "calc(15 * 1rem / 16)",
      16: "calc(16 * 1rem / 16)",
      18: "calc(18 * 1rem / 16)",
      20: "calc(20 * 1rem / 16)",
      24: "calc(24 * 1rem / 16)",
      26: "calc(26 * 1rem / 16)",
      30: "calc(30 * 1rem / 16)",
      32: "calc(32 * 1rem / 16)",
      40: "calc(40 * 1rem / 16)",
    },

    transitionDuration: {
      DEFAULT: "200ms",
      500: "500ms",
    },
  },

  plugins: [
    plugin(({ addUtilities }) =>
      addUtilities({
        ".area-span-full": { gridArea: "1/1/-1/-1" },
        ".scrollbar-hidden": {
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        },
      }),
    ),
  ],
};
