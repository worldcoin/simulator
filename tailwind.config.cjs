const plugin = require("tailwindcss/plugin");

const mirrorHexColors = (colors) =>
  Object.fromEntries(
    colors.map((color, index) => {
      if (!/#[a-f0-9]{6}/.test(color)) {
        throw new Error(
          'All colors should be lowercase hexadecimal strings 7 characters long with "#" sign at the beginning',
        );
      }

      if (colors.indexOf(color) !== index) {
        throw new Error("Colors should be unique");
      }

      if (colors[index - 1] > color) {
        throw new Error("Colors should be sorted alphabetically");
      }

      return [color.substring(1), color];
    }),
  );

module.exports = {
  content: ["./src/**/*.tsx"],

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

  theme: {
    borderRadius: {
      2.5: "calc(2.5 * 1rem / 16)",
      8: "calc(8 * 1rem / 16)",
      4: "calc(4 * 1rem / 16)",
      10: "calc(10 * 1rem / 16)",
      12: "calc(12 * 1rem / 16)",
      16: "calc(16 * 1rem / 16)",
      24: "calc(24 * 1rem / 16)",
      30: "calc(30 * 1rem / 16)",
      34: "calc(34 * 1rem / 16)",
      40: "calc(40 * 1rem / 16)",
      full: "9999px",
      none: "0",
    },

    borderWidth: {
      DEFAULT: "1px",
      2: "2px",
      6: "6px",
    },

    colors: {
      ...mirrorHexColors([
        "#000000",
        "#0d049a",
        "#183c4a",
        "#191c20",
        "#4940e0",
        "#777e90",
        "#bbbec7",
        "#d1d3d4",
        "#dadada",
        "#f0edf9",
        "#f1f2f2",
        "#f9f9f9",
        "#f9fbfc",
        "#fbfbfb",
        "#ff6471",
        "#ffffff",
      ]),

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
        'fade-in': {
          '0%': {opacity: 0, visibility: 'hidden'},
          '100%': {opacity: 1, visibility: 'visible'}
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
    },

    fontFamily: {
      main: ["Inter", "sans-serif"],
    },

    fontSize: {
      10: "calc(10 * 1rem / 16)",
      11: "calc(11 * 1rem / 16)",
      12: "calc(12 * 1rem / 16)",
      14: "calc(14 * 1rem / 16)",
      15: "calc(15 * 1rem / 16)",
      16: "calc(16 * 1rem / 16)",
      18: "calc(18 * 1rem / 16)",
      20: "calc(20 * 1rem / 16)",
      24: "calc(24 * 1rem / 16)",
      32: "calc(32 * 1rem / 16)",
      40: "calc(40 * 1rem / 16)",
    },

    transitionDuration: {
      DEFAULT: "200ms",
      500: "500ms",
    },
  },
};
