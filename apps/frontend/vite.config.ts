/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
	},
	server: {
		proxy: {
			"/api": "http://localhost:8787",
			"/auth": "http://localhost:8787",
		},
	},
});
