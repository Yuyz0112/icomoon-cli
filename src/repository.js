const fs = require('fs-extra');
const path = require('path');
const { logger, getAbsolutePath } = require('./util');
const pipeline = require('./pipeline');

const repository = async (options = {}) => {
  try {
    const {
      icons: inputIcons,
      selectionPath,
      repositoryPath
    } = options;
    if (inputIcons && inputIcons.length) {
      throw new Error('Can not input icons in repository mode');
    }

    if (!repositoryPath) {
      throw new Error('Please input a repository path');
    }

    if (!selectionPath) {
      throw new Error('Please config a valid selection file path.');
    }
    const absoluteSelectionPath = getAbsolutePath(selectionPath);
    const selection = await fs.readJSON(absoluteSelectionPath);
    const { icons } = selection;
    const selectedIcons = icons.map(icon => icon.properties.name);
    const absoluteRepositoryPath = getAbsolutePath(repositoryPath);
    const files = await fs.readdir(absoluteRepositoryPath);

    let newIcons = [];
    let deletionIndexes = [];
  
    selectedIcons.forEach((selectedIcon, index) => {
      if (!files.find(item => path.basename(item, '.svg') === selectedIcon)) {
        deletionIndexes.push(index);
      }
    });
  
    // new icons
    files.forEach(item => {
      if (item.startsWith('.')) {
        return;
      }
          
      const filename = item.replace(path.extname(item), '');
      const foundIndex = selectedIcons.findIndex(s => s === filename);
  
      if (foundIndex < 0) {
        newIcons.push(item);
      }
    });

    if (!newIcons.length && !deletionIndexes.length) {
      logger('Repository mode has no changes to icons, returning');
      return;
    }

    newIcons = newIcons.map(i => path.join(repositoryPath, i));
    if (newIcons.length >= 1 && newIcons.length < 4) {
      logger('Repository mode adding new icons...');
      newIcons.forEach(file => logger(file));
    } else if (newIcons.length >= 4) {
      logger('Repository mode adding ', newIcons.length,' new icons.');
    }

    if (deletionIndexes.length) {
      logger('Repository, icons deleted:', deletionIndexes.length);

      const trimmedIcons = icons.reduceRight((accu, here, idx) => {
        if (deletionIndexes.includes(idx)) {
          accu.splice(idx, 1);
        }
        return accu;
      }, [...icons]);
      const newSelection = {
        ...selection,
        icons: trimmedIcons
      };
  
      await fs.writeJSON(absoluteSelectionPath, newSelection, { spaces: 2 });
    }

    return pipeline({ ...options, icons: newIcons });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = repository;