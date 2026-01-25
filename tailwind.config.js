/****
 * Config Tailwind minimale pour le thème wp-corbidev-corbisier-theme.
 * 100 % front, aucune logique WordPress / Kernel.
 */

module.exports = {
  content: [
    "./*.php",
    "./**/*.php",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#020617",
          card: "#020A1A",
          text: "#E5E7EB",
          muted: "#94A3B8",

          bgLight: "#EAF1FA",
          cardLight: "#DCE7F5",
          textLight: "#020617",
          mutedLight: "#475569",

          primary: "#2563EB",
          accent: "#38BDF8",
        },
      },
    },
  },
  plugins: [],
};
