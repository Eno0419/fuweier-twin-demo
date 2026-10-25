import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  // Relative URLs keep the same build usable at / and GitHub Pages /<repository>/.
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          charts: ["echarts"],
          flow: ["@xyflow/react"],
        },
      },
    },
  },
});
