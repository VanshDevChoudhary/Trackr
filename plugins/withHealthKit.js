"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withHealthKit = (config) => {
    config = (0, config_plugins_1.withEntitlementsPlist)(config, (mod) => {
        mod.modResults['com.apple.developer.healthkit'] = true;
        mod.modResults['com.apple.developer.healthkit.access'] = [];
        return mod;
    });
    config = (0, config_plugins_1.withInfoPlist)(config, (mod) => {
        mod.modResults.NSHealthShareUsageDescription =
            'Trackr reads your health data to display steps, heart rate, and workout activity.';
        const bgModes = mod.modResults.UIBackgroundModes ?? [];
        if (!bgModes.includes('processing')) {
            bgModes.push('processing');
        }
        mod.modResults.UIBackgroundModes = bgModes;
        return mod;
    });
    return config;
};
exports.default = withHealthKit;
