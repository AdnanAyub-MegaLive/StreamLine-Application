const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const androidDir = path.join(__dirname, '..', '..', 'android');
const logsDir = path.join(__dirname, '..', '..', 'logs');
const isWindows = process.platform === 'win32';
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';

// One log file per build session — overwritten (not appended) at the start
// of every build, so it always reflects only the most recent run. Multiple
// gradlew tasks in the same session (e.g. clean + installDebug) are appended
// into that same freshly-truncated file.
function createBuildLogger(logName) {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, logName);
  const logStream = fs.createWriteStream(logFile, { flags: 'w' });

  function runTask(gradleArgs) {
    return new Promise((resolve, reject) => {
      const header = `\n=== ${new Date().toISOString()} — ${gradlew} ${gradleArgs.join(' ')} ===\n\n`;
      process.stdout.write(header);
      logStream.write(header);

      const child = spawn(gradlew, gradleArgs, { cwd: androidDir, shell: isWindows });

      child.stdout.on('data', chunk => {
        process.stdout.write(chunk);
        logStream.write(chunk);
      });

      child.stderr.on('data', chunk => {
        process.stderr.write(chunk);
        logStream.write(chunk);
      });

      child.on('close', code => {
        const footer = `\n${gradlew} ${gradleArgs.join(' ')} finished with exit code ${code}.\n`;
        process.stdout.write(footer);
        logStream.write(footer);

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${gradlew} ${gradleArgs.join(' ')} exited with code ${code}`));
        }
      });
    });
  }

  function close() {
    return new Promise(resolve => {
      console.log(`Full build log written to: ${logFile}`);
      logStream.end(resolve);
    });
  }

  return { runTask, close, logFile };
}

module.exports = { createBuildLogger, androidDir, logsDir, gradlew, isWindows };
