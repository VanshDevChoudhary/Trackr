import {
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  AndroidConfig,
} from 'expo/config-plugins';

const HC_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_EXERCISE',
];

const withHealthConnect: ConfigPlugin = (config) => {
  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('connect-client')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "androidx.health.connect:connect-client:1.1.0-alpha10"`
      );
    }
    return mod;
  });

  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    for (const perm of HC_PERMISSIONS) {
      const exists = manifest['uses-permission'].some(
        (entry: AndroidConfig.Manifest.ManifestUsesPermission) =>
          entry.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': perm },
        } as AndroidConfig.Manifest.ManifestUsesPermission);
      }
    }

    // intent filter so Health Connect knows this app reads health data
    const app = manifest.application?.[0];
    if (app) {
      if (!app.activity) app.activity = [];

      const intentExists = app.activity.some(
        (a: AndroidConfig.Manifest.ManifestActivity) =>
          a.$?.['android:name'] === 'androidx.health.connect.client.PermissionController'
      );

      if (!intentExists) {
        app.activity.push({
          $: { 'android:name': 'androidx.health.connect.client.PermissionController' } as Record<string, string>,
          'intent-filter': [
            {
              action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }],
            },
          ],
        } as AndroidConfig.Manifest.ManifestActivity);
      }
    }

    return mod;
  });

  return config;
};

export default withHealthConnect;
