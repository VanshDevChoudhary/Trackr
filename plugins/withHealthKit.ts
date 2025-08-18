import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';

const withHealthKit: ConfigPlugin = (config) => {
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.healthkit'] = true;
    mod.modResults['com.apple.developer.healthkit.access'] = [];
    return mod;
  });

  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSHealthShareUsageDescription =
      'Trackr reads your health data to display steps, heart rate, and workout activity.';

    const bgModes: string[] = (mod.modResults.UIBackgroundModes as string[]) ?? [];
    if (!bgModes.includes('processing')) {
      bgModes.push('processing');
    }
    mod.modResults.UIBackgroundModes = bgModes;

    return mod;
  });

  return config;
};

export default withHealthKit;
