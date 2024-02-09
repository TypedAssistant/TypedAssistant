import { join } from "path"

// eslint-disable-next-line no-undef
const content = [join(__dirname, "./**/*.tsx"), join(__dirname, "./**/*.html")]

/** @type {import('tailwindcss').Config} */
export default {
  content,
  theme: {
    extend: {},
  },
  plugins: [],
}
