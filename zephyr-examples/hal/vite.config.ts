import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { withZephyr } from "vite-plugin-zephyr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), withZephyr() as any],
});
