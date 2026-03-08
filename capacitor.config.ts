import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betegna.app',
  appName: 'Betegna',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false
    }
  }
};

export default config;
