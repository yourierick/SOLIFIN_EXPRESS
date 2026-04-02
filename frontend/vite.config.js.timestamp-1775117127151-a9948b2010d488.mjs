// vite.config.js
import { defineConfig } from "file:///C:/SOLIFIN/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/SOLIFIN/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { compression } from "file:///C:/SOLIFIN/frontend/node_modules/vite-plugin-compression2/dist/index.mjs";
import { VitePWA } from "file:///C:/SOLIFIN/frontend/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: "gzip",
      exclude: [/\.(br)$/, /\.(gz)$/]
    }),
    compression({
      algorithm: "brotliCompress",
      exclude: [/\.(br)$/, /\.(gz)$/]
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Augmenter la limite de taille pour les fichiers volumineux
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        // 50 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
                // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
                // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
                // 1 heure
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "SOLIFIN Express",
        short_name: "SOLIFIN",
        description: "Application SOLIFIN Express",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        icons: [
          {
            src: "assets/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png"
          },
          {
            src: "assets/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "assets/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        start_url: "/",
        display: "standalone",
        orientation: "portrait"
      }
    })
  ],
  build: {
    sourcemap: false,
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React et les bibliothèques associées
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Séparer les bibliothèques Material UI
          "mui-vendor": [
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-data-grid",
            "@mui/x-date-pickers",
            "@emotion/react",
            "@emotion/styled"
          ],
          // Séparer les bibliothèques de graphiques
          "chart-vendor": ["chart.js", "react-chartjs-2", "recharts"],
          // Séparer les bibliothèques d'icônes
          "icons-vendor": [
            "@heroicons/react",
            "@fortawesome/fontawesome-svg-core",
            "@fortawesome/free-brands-svg-icons",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/react-fontawesome",
            "react-icons"
          ],
          // Séparer les bibliothèques utilitaires
          "utils-vendor": [
            "axios",
            "date-fns",
            "dompurify",
            "zustand",
            "file-saver"
          ],
          // Séparer les bibliothèques UI
          "ui-vendor": [
            "@headlessui/react",
            "bootstrap",
            "react-bootstrap",
            "swiper",
            "framer-motion"
          ],
          // Séparer les bibliothèques de traitement média
          "media-vendor": [
            "@ffmpeg/core",
            "@ffmpeg/ffmpeg",
            "@ffmpeg/util",
            "react-player",
            "video-react"
          ]
        },
        // Optimiser le format des noms de fichiers de sortie pour éviter la détection
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/chunk-[hash].js",
        assetFileNames: "assets/[hash].[ext]",
        // Obfusquer les noms de fonctions et variables dans le build
        minifyInternalExports: true
      },
      // Configuration pour éviter la détection par les bloqueurs
      plugins: [
        // Plugin pour remplacer les termes sensibles dans le code
        {
          name: "anti-adblock",
          generateBundle(options, bundle) {
            Object.keys(bundle).forEach((fileName) => {
              if (fileName.endsWith(".js")) {
                const chunk = bundle[fileName];
                if (chunk.type === "chunk") {
                  chunk.code = chunk.code.replace(/ads/g, "publications").replace(/advertisement/g, "promotion").replace(/banner/g, "showcase").replace(/sponsor/g, "partner");
                }
              }
            });
          }
        }
      ]
    }
  },
  // Optimiser le cache des dépendances
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxTT0xJRklOXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxTT0xJRklOXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9TT0xJRklOL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgeyBjb21wcmVzc2lvbiB9IGZyb20gXCJ2aXRlLXBsdWdpbi1jb21wcmVzc2lvbjJcIjtcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgIGFsZ29yaXRobTogXCJnemlwXCIsXHJcbiAgICAgIGV4Y2x1ZGU6IFsvXFwuKGJyKSQvLCAvXFwuKGd6KSQvXSxcclxuICAgIH0pLFxyXG4gICAgY29tcHJlc3Npb24oe1xyXG4gICAgICBhbGdvcml0aG06IFwiYnJvdGxpQ29tcHJlc3NcIixcclxuICAgICAgZXhjbHVkZTogWy9cXC4oYnIpJC8sIC9cXC4oZ3opJC9dLFxyXG4gICAgfSksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGNsaWVudHNDbGFpbTogdHJ1ZSxcclxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcclxuICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXHJcbiAgICAgICAgLy8gQXVnbWVudGVyIGxhIGxpbWl0ZSBkZSB0YWlsbGUgcG91ciBsZXMgZmljaGllcnMgdm9sdW1pbmV1eFxyXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA1MCAqIDEwMjQgKiAxMDI0LCAvLyA1MCBNQlxyXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nb29nbGVhcGlzXFwuY29tLyxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZ29vZ2xlLWZvbnRzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsIC8vIDEgYW5cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzpwbmd8anBnfGpwZWd8c3ZnfGdpZnx3ZWJwKSQvLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZXMtY2FjaGVcIixcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCwgLy8gMzAgam91cnNcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzpqc3xjc3MpJC8sXHJcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiU3RhbGVXaGlsZVJldmFsaWRhdGVcIixcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJzdGF0aWMtcmVzb3VyY2VzXCIsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA3LCAvLyA3IGpvdXJzXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwvYXBpXFwvLyxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrRmlyc3RcIixcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJhcGktY2FjaGVcIixcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAsIC8vIDEgaGV1cmVcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBuZXR3b3JrVGltZW91dFNlY29uZHM6IDEwLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXCJmYXZpY29uLmljb1wiLCBcImFwcGxlLXRvdWNoLWljb24ucG5nXCIsIFwibWFzay1pY29uLnN2Z1wiXSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiBcIlNPTElGSU4gRXhwcmVzc1wiLFxyXG4gICAgICAgIHNob3J0X25hbWU6IFwiU09MSUZJTlwiLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkFwcGxpY2F0aW9uIFNPTElGSU4gRXhwcmVzc1wiLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiBcIiMxOTc2ZDJcIixcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZmZcIixcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwiYXNzZXRzL2ljb25zL2ljb24tNzJ4NzIucG5nXCIsXHJcbiAgICAgICAgICAgIHNpemVzOiBcIjcyeDcyXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwiYXNzZXRzL2ljb25zL2ljb24tMTkyeDE5Mi5wbmdcIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiBcImFzc2V0cy9pY29ucy9pY29uLTUxMng1MTIucG5nXCIsXHJcbiAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxyXG4gICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgIG9yaWVudGF0aW9uOiBcInBvcnRyYWl0XCIsXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgLy8gQXVnbWVudGVyIGxhIGxpbWl0ZSBkJ2F2ZXJ0aXNzZW1lbnQgcG91ciBsZXMgY2h1bmtzXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgLy8gU1x1MDBFOXBhcmVyIFJlYWN0IGV0IGxlcyBiaWJsaW90aFx1MDBFOHF1ZXMgYXNzb2NpXHUwMEU5ZXNcclxuICAgICAgICAgIFwicmVhY3QtdmVuZG9yXCI6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXSxcclxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIE1hdGVyaWFsIFVJXHJcbiAgICAgICAgICBcIm11aS12ZW5kb3JcIjogW1xyXG4gICAgICAgICAgICBcIkBtdWkvbWF0ZXJpYWxcIixcclxuICAgICAgICAgICAgXCJAbXVpL2ljb25zLW1hdGVyaWFsXCIsXHJcbiAgICAgICAgICAgIFwiQG11aS94LWRhdGEtZ3JpZFwiLFxyXG4gICAgICAgICAgICBcIkBtdWkveC1kYXRlLXBpY2tlcnNcIixcclxuICAgICAgICAgICAgXCJAZW1vdGlvbi9yZWFjdFwiLFxyXG4gICAgICAgICAgICBcIkBlbW90aW9uL3N0eWxlZFwiLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIGRlIGdyYXBoaXF1ZXNcclxuICAgICAgICAgIFwiY2hhcnQtdmVuZG9yXCI6IFtcImNoYXJ0LmpzXCIsIFwicmVhY3QtY2hhcnRqcy0yXCIsIFwicmVjaGFydHNcIl0sXHJcbiAgICAgICAgICAvLyBTXHUwMEU5cGFyZXIgbGVzIGJpYmxpb3RoXHUwMEU4cXVlcyBkJ2ljXHUwMEY0bmVzXHJcbiAgICAgICAgICBcImljb25zLXZlbmRvclwiOiBbXHJcbiAgICAgICAgICAgIFwiQGhlcm9pY29ucy9yZWFjdFwiLFxyXG4gICAgICAgICAgICBcIkBmb3J0YXdlc29tZS9mb250YXdlc29tZS1zdmctY29yZVwiLFxyXG4gICAgICAgICAgICBcIkBmb3J0YXdlc29tZS9mcmVlLWJyYW5kcy1zdmctaWNvbnNcIixcclxuICAgICAgICAgICAgXCJAZm9ydGF3ZXNvbWUvZnJlZS1zb2xpZC1zdmctaWNvbnNcIixcclxuICAgICAgICAgICAgXCJAZm9ydGF3ZXNvbWUvcmVhY3QtZm9udGF3ZXNvbWVcIixcclxuICAgICAgICAgICAgXCJyZWFjdC1pY29uc1wiLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIHV0aWxpdGFpcmVzXHJcbiAgICAgICAgICBcInV0aWxzLXZlbmRvclwiOiBbXHJcbiAgICAgICAgICAgIFwiYXhpb3NcIixcclxuICAgICAgICAgICAgXCJkYXRlLWZuc1wiLFxyXG4gICAgICAgICAgICBcImRvbXB1cmlmeVwiLFxyXG4gICAgICAgICAgICBcInp1c3RhbmRcIixcclxuICAgICAgICAgICAgXCJmaWxlLXNhdmVyXCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgLy8gU1x1MDBFOXBhcmVyIGxlcyBiaWJsaW90aFx1MDBFOHF1ZXMgVUlcclxuICAgICAgICAgIFwidWktdmVuZG9yXCI6IFtcclxuICAgICAgICAgICAgXCJAaGVhZGxlc3N1aS9yZWFjdFwiLFxyXG4gICAgICAgICAgICBcImJvb3RzdHJhcFwiLFxyXG4gICAgICAgICAgICBcInJlYWN0LWJvb3RzdHJhcFwiLFxyXG4gICAgICAgICAgICBcInN3aXBlclwiLFxyXG4gICAgICAgICAgICBcImZyYW1lci1tb3Rpb25cIixcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAvLyBTXHUwMEU5cGFyZXIgbGVzIGJpYmxpb3RoXHUwMEU4cXVlcyBkZSB0cmFpdGVtZW50IG1cdTAwRTlkaWFcclxuICAgICAgICAgIFwibWVkaWEtdmVuZG9yXCI6IFtcclxuICAgICAgICAgICAgXCJAZmZtcGVnL2NvcmVcIixcclxuICAgICAgICAgICAgXCJAZmZtcGVnL2ZmbXBlZ1wiLFxyXG4gICAgICAgICAgICBcIkBmZm1wZWcvdXRpbFwiLFxyXG4gICAgICAgICAgICBcInJlYWN0LXBsYXllclwiLFxyXG4gICAgICAgICAgICBcInZpZGVvLXJlYWN0XCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gT3B0aW1pc2VyIGxlIGZvcm1hdCBkZXMgbm9tcyBkZSBmaWNoaWVycyBkZSBzb3J0aWUgcG91ciBcdTAwRTl2aXRlciBsYSBkXHUwMEU5dGVjdGlvblxyXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIsXHJcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwiYXNzZXRzL2NodW5rLVtoYXNoXS5qc1wiLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiBcImFzc2V0cy9baGFzaF0uW2V4dF1cIixcclxuICAgICAgICAvLyBPYmZ1c3F1ZXIgbGVzIG5vbXMgZGUgZm9uY3Rpb25zIGV0IHZhcmlhYmxlcyBkYW5zIGxlIGJ1aWxkXHJcbiAgICAgICAgbWluaWZ5SW50ZXJuYWxFeHBvcnRzOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBDb25maWd1cmF0aW9uIHBvdXIgXHUwMEU5dml0ZXIgbGEgZFx1MDBFOXRlY3Rpb24gcGFyIGxlcyBibG9xdWV1cnNcclxuICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgIC8vIFBsdWdpbiBwb3VyIHJlbXBsYWNlciBsZXMgdGVybWVzIHNlbnNpYmxlcyBkYW5zIGxlIGNvZGVcclxuICAgICAgICB7XHJcbiAgICAgICAgICBuYW1lOiAnYW50aS1hZGJsb2NrJyxcclxuICAgICAgICAgIGdlbmVyYXRlQnVuZGxlKG9wdGlvbnMsIGJ1bmRsZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1wbGFjZXIgbGVzIHRlcm1lcyBzZW5zaWJsZXMgZGFucyBsZXMgZmljaGllcnMgZ1x1MDBFOW5cdTAwRTlyXHUwMEU5c1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhidW5kbGUpLmZvckVhY2goZmlsZU5hbWUgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNodW5rID0gYnVuZGxlW2ZpbGVOYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChjaHVuay50eXBlID09PSAnY2h1bmsnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNodW5rLmNvZGUgPSBjaHVuay5jb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL2Fkcy9nLCAncHVibGljYXRpb25zJylcclxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvYWR2ZXJ0aXNlbWVudC9nLCAncHJvbW90aW9uJylcclxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvYmFubmVyL2csICdzaG93Y2FzZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL3Nwb25zb3IvZywgJ3BhcnRuZXInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuICB9LFxyXG4gIC8vIE9wdGltaXNlciBsZSBjYWNoZSBkZXMgZFx1MDBFOXBlbmRhbmNlc1xyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlQLFNBQVMsb0JBQW9CO0FBQzlRLE9BQU8sV0FBVztBQUNsQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLGVBQWU7QUFJeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLE1BQ1YsV0FBVztBQUFBLE1BQ1gsU0FBUyxDQUFDLFdBQVcsU0FBUztBQUFBLElBQ2hDLENBQUM7QUFBQSxJQUNELFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLFNBQVMsQ0FBQyxXQUFXLFNBQVM7QUFBQSxJQUNoQyxDQUFDO0FBQUEsSUFDRCxRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUCxjQUFjO0FBQUEsUUFDZCxhQUFhO0FBQUEsUUFDYix1QkFBdUI7QUFB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
