import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { en, es, fr, de, it, pt } from "vuetify/locale";

// Vue I18n
import { createI18n } from "vue-i18n";
import { messages, defaultLocale, fallbackLocale } from "./locales";

// Motion
import { MotionPlugin } from "@vueuse/motion";

// Global styles
import "./styles/global.scss";

const lightTheme = {
  dark: false,
  colors: {
    primary: "#1E88E5",
    secondary: "#546E7A",
    accent: "#03A9F4",
    error: "#D32F2F",
    info: "#0288D1",
    success: "#2E7D32",
    warning: "#EF6C00",
    surface: "#FFFFFF",
    "surface-variant": "#F1F5F9",
    "on-surface": "#1A202C",
    "on-surface-variant": "#4A5568",
    background: "#F7FAFC",
    "on-background": "#1A202C",
    outline: "#E2E8F0",
    "outline-variant": "#EDF2F7",
  },
};

const darkTheme = {
  dark: true,
  colors: {
    primary: "#2196F3",
    secondary: "#424242",
    accent: "#FF4081",
    error: "#FF5252",
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FFC107",
    background: "#121212",
    surface: "#212121",
    "surface-variant": "#1e1e1e",
    "on-surface-variant": "#e0e0e0",
    "on-background": "#e0e0e0",
  },
};

// Get saved locale from localStorage or use default
const savedLocale = localStorage.getItem("user-locale") || defaultLocale;

// Get saved theme from localStorage or use default dark theme
const savedTheme = localStorage.getItem("user-theme") || "dark";

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: savedLocale,
  fallbackLocale: fallbackLocale,
  messages,
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
});

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: savedTheme,
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  locale: {
    locale: savedLocale,
    fallback: fallbackLocale,
    messages: { en, es, fr, de, it, pt },
  },
});

const app = createApp(App);

// Suppress benign ResizeObserver errors (common with Vuetify when rapidly changing language/themes)
window.addEventListener("error", (event) => {
  if (event.message && event.message.includes("ResizeObserver loop")) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

app.use(createPinia());
app.use(i18n);
app.use(router);
app.use(vuetify);
app.use(MotionPlugin);

// Set initial HTML lang attribute
document.documentElement.setAttribute("lang", savedLocale);

// Initialize app constants from backend
import { initializeConstants } from "@/config/constants";

// Initialize auth store
import { useAuthStore } from "@/stores/auth";

// Initialize constants before mounting app
initializeConstants()
  .then(async () => {
    const authStore = useAuthStore();
    await authStore.initialize();
    app.mount("#app");
  })
  .catch((error) => {
    console.error("Failed to initialize app:", error);
    // Show error to user instead of mounting with broken state
    document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center; max-width: 500px; padding: 20px;">
        <h1 style="color: #d32f2f;">Failed to Initialize Application</h1>
        <p style="color: #666;">Could not load configuration from backend.</p>
        <p style="color: #999; font-size: 14px;">${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    </div>
  `;
  });