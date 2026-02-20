/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: '#E0E5EC',
                primary: '#E0E5EC',
                secondary: '#E0E5EC',
            },
        },
    },
    plugins: [],
}
