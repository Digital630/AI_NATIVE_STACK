import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fundmysme.smeflow',
  appName: 'SMEFlow',
  webDir: 'dist',
  server: {
    url: 'https://b736cbaf-7cf1-4a89-ad93-eb1309aa4c05.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    scheme: 'SMEFlow',
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['publicStorage']
    }
  }
};

export default config;
