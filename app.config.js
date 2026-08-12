const APP_ENV = process.env.APP_ENV || 'development';

const BUNDLE_ID = {
  development: 'com.tinkermedia.scorecard.dev',
  staging: 'com.tinkermedia.scorecard.staging',
  production: 'com.tinkermedia.scorecard',
}[APP_ENV];

const APP_NAME = {
  development: 'Scorecard (Dev)',
  staging: 'Scorecard (Staging)',
  production: 'Scorecard',
}[APP_ENV];

module.exports = {
  expo: {
    name: APP_NAME,
    slug: 'scorecard',
    version: '1.0.0',
    orientation: 'default',
    icon: './assets/images/icon.png',
    scheme: 'scorecard',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: BUNDLE_ID,
      icon: './assets/images/icon.png',
      supportsTablet: true,
      config: { usesNonExemptEncryption: false }
    },
    android: {
      package: BUNDLE_ID,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/icon.png',
        backgroundImage: './assets/images/icon.png',
        monochromeImage: './assets/images/icon.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'single',
      favicon: './assets/images/icon.png',
    },
    plugins: [
       "expo-audio",
       "expo-font",
      [
        'expo-splash-screen',
        {
          backgroundColor: '#fff',
          image: './assets/images/icon.png',
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: '7080369a-5b0e-41c8-a923-92d48fd461a2',
      },
    },
  },
};