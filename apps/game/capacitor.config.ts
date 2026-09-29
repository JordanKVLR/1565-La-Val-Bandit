import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native app shells for Google Play and the App Store. They wrap the same web build.
 * Build and sync with: pnpm --filter @m1565/game cap:sync
 * Change `appId` before the first store upload: it cannot be changed afterwards.
 */
const config: CapacitorConfig = {
  appId: 'com.armatura1565.game',
  appName: 'Armatura 1565',
  webDir: 'dist-native',
  backgroundColor: '#1b1410',
  android: { backgroundColor: '#1b1410' },
  ios: { backgroundColor: '#1b1410', contentInset: 'never' },
};

export default config;
