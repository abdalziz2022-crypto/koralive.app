import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goaltime.app',
  appName: 'GoalTime Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
