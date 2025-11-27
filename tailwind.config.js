/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./public/**/*.html",
        "./public/**/*.js",
        "./code/**/*.js",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    "50": "#f0fdfa",
                    "100": "#ccfbf1",
                    "200": "#99f6e4",
                    "300": "#5eead4",
                    "400": "#2dd4bf",
                    "500": "#14b8a6",
                    "600": "#0d9488",
                    "700": "#0f766e",
                    "800": "#115e59",
                    "900": "#134e4a"
                },
                slate: {
                    "50": "#f8fafc",
                    "100": "#f1f5f9",
                    "200": "#e2e8f0",
                    "300": "#cbd5e1",
                    "400": "#94a3b8",
                    "500": "#64748b",
                    "600": "#475569",
                    "700": "#334155",
                    "800": "#1e293b",
                    "900": "#0f172a"
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            boxShadow: {
                'apple': '0 4px 24px rgba(0, 0, 0, 0.04)',
                'apple-hover': '0 8px 32px rgba(0, 0, 0, 0.08)',
                'drawer': '-10px 0 30px rgba(0, 0, 0, 0.05)',
            }
        }
    },
    plugins: [],
}
