// Use system fonts for better compatibility in CI environments
// where Google Fonts may not be accessible
export const inter = {
	className: "font-sans",
	style: {
		fontFamily:
			'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	},
	variable: "--font-sans",
};
