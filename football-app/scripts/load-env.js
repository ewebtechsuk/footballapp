const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let cached = false;

const loadEnv = () => {
  if (cached) {
    return;
  }

  const projectRoot = path.resolve(__dirname, '..');
  const envFiles = [
    { name: '.env', override: false },
    { name: '.env.local', override: true },
  ];

  envFiles.forEach(({ name, override }) => {
    const envPath = path.join(projectRoot, name);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override });
    }
  });

  cached = true;
};

module.exports = loadEnv;
