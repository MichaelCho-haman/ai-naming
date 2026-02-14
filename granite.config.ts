import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: '애기 이름짓기',
  brand: {
    displayName: '애기 이름짓기',
    primaryColor: '#3B82F6',
    icon: '/favicon.ico',
  },
  permissions: [],
  web: {
    port: 3000,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
    },
  },
  outdir: '.next',
});
