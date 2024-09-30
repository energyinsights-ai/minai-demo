// https://nuxt.com/docs/api/configuration/nuxt-config


import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

const ddeTheme = definePreset(Aura, {
  semantic: {
    primary: {
      "50": "#e8e9ec",
      "100": "#d1d3da",
      "200": "#a3a6b5",
      "300": "#757a8f",
      "400": "#474d6a",
      "500": "#192145",
      "600": "#141a37",
      "700": "#0f1429",
      "800": "#0a0d1c",
      "900": "#05070e"
    }
}
});

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr:false,
  runtimeConfig: {
    public: {
      flaskBaseUrl: process.env.FLASK_BASE_URL || 'http://localhost:5000'
    }
  },
  compatibilityDate: '2024-04-03',
  modules: [
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    "@nuxtjs/leaflet",
    "@nuxtjs/tailwindcss"
  ],
  components: [
    {
      path: '~/components', // will get any components nested in let's say /components/test too
      pathPrefix: false,
    },
  ],
  plugins: [
    '~/plugins/chart.js',
  ],
  primevue: {
    options: {
        theme: {
            preset: ddeTheme
        }
    }
  },
})