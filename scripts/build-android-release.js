#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const androidDir = path.join(__dirname, '..', 'android');
const isWindows = process.platform === 'win32';
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';

const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const isDryRun = args.includes('--dry-run');

function run(command, commandArgs) {
  console.log(`\n> ${command} ${commandArgs.join(' ')}\n`);

  if (isDryRun) {
    return;
  }

  const result = spawnSync(command, commandArgs, {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWindows,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (shouldClean) {
  run(gradlew, ['clean']);
}

run(gradlew, ['assembleRelease']);

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

if (isDryRun) {
  console.log(`\nDry run complete. Would produce: ${apkPath}`);
} else if (fs.existsSync(apkPath)) {
  const sizeMb = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1);
  console.log(`\nRelease APK built: ${apkPath} (${sizeMb} MB)`);
} else {
  console.warn(`\nBuild finished but APK was not found at expected path: ${apkPath}`);
}
