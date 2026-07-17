#!/usr/bin/env node
const { createBuildLogger } = require('./lib/logged-gradle');

const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const port = process.env.RCT_METRO_PORT || '8081';

async function main() {
  const logger = createBuildLogger('android-debug-build.log');

  try {
    if (shouldClean) {
      await logger.runTask(['clean']);
    }

    await logger.runTask(['installDebug', `-PreactNativeDevServerPort=${port}`]);
  } finally {
    await logger.close();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
