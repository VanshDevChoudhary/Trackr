"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const HC_PERMISSIONS = [
    'android.permission.health.READ_STEPS',
    'android.permission.health.READ_HEART_RATE',
    'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
    'android.permission.health.READ_EXERCISE',
];
const withHealthConnect = (config) => {
    config = (0, config_plugins_1.withAppBuildGradle)(config, (mod) => {
        if (!mod.modResults.contents.includes('connect-client')) {
            mod.modResults.contents = mod.modResults.contents.replace(/dependencies\s*\{/, `dependencies {\n    implementation "androidx.health.connect:connect-client:1.1.0-alpha10"`);
        }
        return mod;
    });
    config = (0, config_plugins_1.withAndroidManifest)(config, (mod) => {
        const manifest = mod.modResults.manifest;
        if (!manifest['uses-permission']) {
            manifest['uses-permission'] = [];
        }
        for (const perm of HC_PERMISSIONS) {
            const exists = manifest['uses-permission'].some((entry) => entry.$?.['android:name'] === perm);
            if (!exists) {
                manifest['uses-permission'].push({
                    $: { 'android:name': perm },
                });
            }
        }
        // add intent filter to main activity so Health Connect can find this app
        const app = manifest.application?.[0];
        if (app && app.activity) {
            const mainActivity = app.activity.find((a) => a.$?.['android:name'] === '.MainActivity');
            if (mainActivity) {
                if (!mainActivity['intent-filter'])
                    mainActivity['intent-filter'] = [];
                const hasHcFilter = mainActivity['intent-filter'].some((f) => f.action?.some((a) => a.$?.['android:name'] === 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'));
                if (!hasHcFilter) {
                    mainActivity['intent-filter'].push({
                        action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }],
                    });
                }
            }
        }
        return mod;
    });
    return config;
};
exports.default = withHealthConnect;
