const fs = require('fs-extra');
const path = require('path');
const Chromy = require('chromy');
const extract = require('extract-zip');

const DEFAULT_TIMEOUT = 60000;
const DEFAULT_INTERVAL = 500;

const PAGE = {
  IMPORT_CONFIG_BUTTON: '.file.unit',
  IMPORT_SELECTION_INPUT: '.file.unit input[type="file"]',
  OVERLAY_CONFIRM: '.overlay button.mrl',
  NEW_SET_BUTTON: '.menuList1 button',
  MENU_BUTTON: 'h1 button .icon-menu',
  MENU: '.menuList2.menuList3',
  ICON_INPUT: '.menuList2.menuList3 .file input[type="file"]',
  FIRST_ICON_BOX: '#set0 .miBox:not(.mi-selected)',
  REMOVE_SET_BUTTON: '.menuList2.menuList3 li:last-child button',
  SELECT_ALL_BUTTON: 'button[ng-click="selectAllNone($index, true)"]',
  REARRANGE_BUTTON: 'button[ng-click="showRearrange($index)"]',
  REARRANGE_ORDER_BUTTON: '.clearfix.ng-pristine label:nth-child(2)',
  CONFIRM_REARRANGE_BUTTON: '.overlay button.mtl',
  GENERATE_LINK: 'a[href="#/select/font"]',
  GLYPH_SET: '#glyphSet0',
  GLYPH_NAME: '.glyphName',
  DOWNLOAD_BUTTON: '.btn4',
};
const DEFAULT_OPTIONS = {
  outputDir: path.join(__dirname, 'output'),
};

const logger = (...args) => {
  console.log('[icomoon-cli]', ...args);
};

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const waitVisible = (c, selector, timeout = DEFAULT_TIMEOUT) => new Promise((resolve, reject) => {
  let count = 0;
  let isVisible = false;
  const timer = setInterval(async () => {
    isVisible = await c.visible(selector);
    if (isVisible || count >= timeout) {
      clearInterval(timer);
      if (!isVisible) {
        reject(`${selector} is not visible after ${timeout}ms.`);
      }
      resolve(true);
    }
    count += DEFAULT_INTERVAL;
  }, DEFAULT_INTERVAL);
});

const getAbsolutePath = inputPath => {
  let absoluteSelectionPath = inputPath;
  if (!path.isAbsolute(inputPath)) {
    absoluteSelectionPath = path.resolve(process.env.PWD, inputPath);
  }
  return absoluteSelectionPath;
};

const checkDownload = dest => new Promise((resolve, reject) => {
  const interval = 1000;
  let downloadSize = 0;
  let timeCount = 0;
  const timer = setInterval(async () => {
    timeCount += interval;
    const exist = await fs.exists(dest);
    if (!exist) {
      return;
    }
    const stats = fs.statSync(dest);
    if (stats.size > 0 && stats.size === downloadSize) {
      clearInterval(timer);
      resolve();
    } else {
      downloadSize = stats.size;
    }
    if (timeCount > DEFAULT_TIMEOUT) {
      reject('Timeout when download file, please check your network.');
    }
  }, interval);
});

const checkDuplicateName = ({ selectionPath, icons, names }, forceOverride) => {
  const iconNames = icons.map((icon, index) => {
    if (names[index]) {
      return names[index];
    }
    return path.basename(icon).replace(path.extname(icon), '');
  });
  const duplicates = [];
  const selection = fs.readJSONSync(selectionPath);
  selection.icons.forEach(({ properties }, index) => {
    if (iconNames.includes(properties.name)) {
      duplicates.push({ name: properties.name, index });
    }
  });
  if (!duplicates.length) {
    return;
  }
  if (forceOverride) {
    selection.icons = selection.icons.filter((icon, index) => !duplicates.some(d => d.index === index));
    fs.writeJSONSync(selectionPath, selection, { spaces: 2 });
  } else {
    throw new Error(`Found duplicate icon names: ${duplicates.map(d => d.name).join(',')}`);
  }
};

async function pipeline(options = {}) {
  try {
    const {
      icons,
      names = [],
      selectionPath,
      forceOverride = false,
      whenFinished,
      visible = false,
    } = options;
    const outputDir = options.outputDir ? getAbsolutePath(options.outputDir) : DEFAULT_OPTIONS.outputDir;
    // prepare stage
    logger('Preparing...');
    if (!icons || !icons.length) {
      if (whenFinished) {
        whenFinished({ outputDir });
      }
      return logger('No new icons found.');
    }
    if (!selectionPath) {
      throw new Error('Please config a valid selection file path.');
    }
    let absoluteSelectionPath = getAbsolutePath(selectionPath);
    checkDuplicateName({
      selectionPath: absoluteSelectionPath,
      icons,
      names,
    }, forceOverride);
    await fs.remove(outputDir);
    await fs.ensureDir(outputDir);
    // download stage
    const c = new Chromy({
      visible,
    });
    logger('Started a new chrome instance, going to load icomoon.io.');
    await c.goto('https://icomoon.io/app/#/select', {
      waitLoadEvent: false,
    });
    await c.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: outputDir,
    });
    await waitVisible(c, PAGE.IMPORT_CONFIG_BUTTON);
    logger('Dashboard is visible, going to upload config file');
    // remove init set
    await c.click(PAGE.MENU_BUTTON);
    await c.click(PAGE.REMOVE_SET_BUTTON);
    await c.setFile(PAGE.IMPORT_SELECTION_INPUT, absoluteSelectionPath);
    await waitVisible(c, PAGE.OVERLAY_CONFIRM);
    await c.click(PAGE.OVERLAY_CONFIRM);
    const selection = fs.readJSONSync(selectionPath);
    if (selection.icons.length === 0) {
      logger('Selection icons is empty, going to create an empty set');
      await c.click(PAGE.NEW_SET_BUTTON);
    }
    logger('Uploaded config, going to upload new icon files');
    await c.click(PAGE.MENU_BUTTON);
    await c.setFile(PAGE.ICON_INPUT, icons.map(getAbsolutePath));
    await waitVisible(c, PAGE.FIRST_ICON_BOX);
    await c.click(PAGE.SELECT_ALL_BUTTON);
    logger('Uploaded and selected all new icons');
    await c.click(PAGE.MENU_BUTTON);
    await c.click(PAGE.REARRANGE_BUTTON);
    await c.click(PAGE.REARRANGE_ORDER_BUTTON);
    await waitVisible(c, PAGE.CONFIRM_REARRANGE_BUTTON);
    await c.click(PAGE.CONFIRM_REARRANGE_BUTTON);
    await c.click(PAGE.SELECT_ALL_BUTTON);
    logger('List Rearranged');
    await c.click(PAGE.GENERATE_LINK);
    await waitVisible(c, PAGE.GLYPH_SET);
    if (names.length) {
      logger('Changed names of icons');
      // update indexedDB
      const executeCode = `
        const request = indexedDB.open('IDBWrapper-storage', 1);
        request.onsuccess = function() {
          const db = request.result;
          const tx = db.transaction('storage', 'readwrite');
          const store = tx.objectStore('storage');
          const keys = store.getAllKeys();
          keys.onsuccess = function() {
            let timestamp;
            keys.result.forEach(function(key) {
              if (typeof key === 'number') {
                timestamp = key;
              }
            });
            const main = store.get(timestamp);
            main.onsuccess = function() {
              const data  = main.result;
              const names = JSON.parse('${JSON.stringify(names)}');
              for (let i = 0; i < names.length; i++) {
                data.obj.iconSets[0].selection[i].name = names[i];
              }
              store.put(data);
            }
          }
        }
      `;
      // sleep to ensure indexedDB is ready
      await sleep(2000);
      await c.evaluate(executeCode);
      // sleep to ensure the code was executed
      await sleep(1000);
    }
    await c.click(PAGE.DOWNLOAD_BUTTON);
    const meta = selection.preferences.fontPref.metadata;
    const zipName = meta.majorVersion
      ? `${meta.fontFamily}-v${meta.majorVersion}.${meta.minorVersion || 0}.zip`
      : `${meta.fontFamily}.zip`;
    logger(`Started to download ${zipName}`);
    const zipPath = path.join(outputDir, zipName);
    await checkDownload(zipPath);
    logger('Successfully downloaded, going to unzip it.');
    await c.close();
    // unzip stage
    extract(zipPath, { dir: outputDir }, async (err) => {
      if (err) {
        throw err;
      }
      await fs.remove(zipPath);
      logger(`Finished. The output directory is ${outputDir}.`);
      if (whenFinished) {
        whenFinished({ outputDir });
      }
    });
  } catch (error) {
    console.error(error);
    Chromy.cleanup();
  }
}

module.exports = pipeline;
