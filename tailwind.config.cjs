// tailwind.config.cjs
const v = name => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        line: v('line'),
        fg: v('fg'),
        muted: v('muted'),
        given: v('given'),
        accent: v('accent'),
        'accent-fg': v('accent-fg'),
        'accent-2': v('accent-2'),
      },
    },
  },
  plugins: [],
};
