import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Motion
import { MotionPlugin } from '@vueuse/motion'

// Global styles
import './styles/global.scss'

const lightTheme = {
  dark: false,
  colors: {
    primary: '#1565C0',
    secondary: '#424242',
    accent: '#0277BD',
    error: '#D32F2F',
    info: '#0288D1',
    success: '#388E3C',
    warning: '#F57C00',
    surface: '#FFFFFF',
    'surface-variant': '#E8E8E8',
    'on-surface': '#1A1A1A',
    'on-surface-variant': '#424242',
    background: '#FAFAFA',
    'on-background': '#1A1A1A',
    outline: '#BDBDBD',
    'outline-variant': '#E0E0E0'
  }
}

const darkTheme = {
  dark: true,
  colors: {
    primary: '#2196F3',
    secondary: '#424242',
    accent: '#FF4081',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
    background: '#121212',
    surface: '#212121',
    'surface-variant': '#1e1e1e',
    'on-surface-variant': '#e0e0e0',
    'on-background': '#e0e0e0'
  }
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: lightTheme,
      dark: darkTheme
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(MotionPlugin)

app.mount('#app')
