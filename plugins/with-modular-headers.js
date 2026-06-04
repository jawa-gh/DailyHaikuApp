const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Patches the iOS Podfile to add `use_modular_headers!` after the platform
 * line.
 *
 * Required for @react-native-firebase: FirebaseCoreInternal is a Swift pod
 * that needs to import GoogleUtilities, but GoogleUtilities is an Objective-C
 * pod without a default module map. `use_modular_headers!` tells CocoaPods
 * to generate module maps for every pod, which lets Swift code (Firebase's
 * internals) import C/Objective-C dependencies cleanly.
 *
 * IMPORTANT: do NOT combine this with `use_frameworks!`. Earlier iterations
 * tried `useFrameworks: "static"` (in expo-build-properties) plus this; the
 * combination wraps every pod as a framework module, and RNFBApp's source
 * then fails to compile because its `#import <React/RCTBridgeModule.h>`
 * references can't resolve through Clang's framework-module rules. Sticking
 * to `use_modular_headers!` alone keeps pods as static libraries with module
 * maps, which is the sweet spot.
 *
 * Idempotent — re-running prebuild won't add the directive twice.
 */

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        'Podfile',
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn(
          '[with-modular-headers] Podfile not found at',
          podfilePath,
          '— skipping patch.',
        );
        return cfg;
      }

      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes('use_modular_headers!')) {
        console.log(
          '[with-modular-headers] use_modular_headers! already present',
        );
        return cfg;
      }

      if (!/^(platform :ios.*)$/m.test(contents)) {
        console.warn(
          '[with-modular-headers] could not find `platform :ios` line; skipping.',
        );
        return cfg;
      }

      contents = contents.replace(
        /^(platform :ios.*)$/m,
        '$1\nuse_modular_headers!',
      );
      fs.writeFileSync(podfilePath, contents, 'utf8');
      console.log('[with-modular-headers] inserted use_modular_headers!');

      return cfg;
    },
  ]);
};
