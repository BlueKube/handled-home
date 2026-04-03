import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.handledhome.app',
  appName: 'Handled Home',
  webDir: 'dist',
  ios: {
    scheme: 'handledhome',
    contentInset: 'always',
    backgroundColor: '#0a1628',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
