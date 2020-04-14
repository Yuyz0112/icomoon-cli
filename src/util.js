const path = require('path');

const logger = (...args) => {
  console.log('[icomoon-cli]', ...args);
};

const getAbsolutePath = inputPath => {
  let absoluteSelectionPath = inputPath;
  if (!path.isAbsolute(inputPath)) {
    if (!process.env.PWD) {
      process.env.PWD = process.cwd();
    }
    absoluteSelectionPath = path.resolve(process.env.PWD, inputPath);
  }
  return absoluteSelectionPath;
};


module.exports.getAbsolutePath = getAbsolutePath;
module.exports.logger = logger;