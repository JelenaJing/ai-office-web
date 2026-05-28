/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/modules/materials-research/**/*.{js,ts,jsx,tsx}',
    './src/modules/research/**/*.{js,ts,jsx,tsx}',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        accent: '#0891B2',
        muted: '#64748B',
        surface: '#F8FAFC',
        warning: '#F97316',
        success: '#16A34A',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
}
