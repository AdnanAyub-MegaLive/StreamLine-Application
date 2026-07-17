#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { createBuildLogger, androidDir } = require('./lib/logged-gradle');

const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const isDryRun = args.includes('--dry-run');

async function main() {
  const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

  if (isDryRun) {
    console.log(`\nDry run — would run ${shouldClean ? 'clean + ' : ''}assembleRelease.`);
    console.log(`Dry run complete. Would produce: ${apkPath}`);
    return;
  }

  const logger = createBuildLogger('android-release-build.log');

  try {
    if (shouldClean) {
      await logger.runTask(['clean']);
    }

    await logger.runTask(['assembleRelease']);
  } finally {
    await logger.close();
  }

  if (fs.existsSync(apkPath)) {
    const sizeMb = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1);
    console.log(`\nRelease APK built: ${apkPath} (${sizeMb} MB)`);
  } else {
    console.warn(`\nBuild finished but APK was not found at expected path: ${apkPath}`);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
