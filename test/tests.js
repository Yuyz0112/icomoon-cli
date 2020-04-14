const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const { pipeline, repository, getAbsolutePath } = require('../index');

const prepareStagingArea = (originalSelectionPath) => {
  const stagingPath = getAbsolutePath('test/staging');
  const absoluteSelectionPathSrc = getAbsolutePath(originalSelectionPath);
  const selectionPath = path.join(stagingPath, 'selection.json');
  fs.removeSync(stagingPath);
  fs.ensureDirSync(stagingPath);
  fs.copyFileSync(absoluteSelectionPathSrc, selectionPath);
  return selectionPath;
};

const runCase = async ({ desc, testData, testFunction, assertion }) => {
  console.log(`\r\n============= Start test '${desc}' =============`);
  let result = undefined;
  try {
    result = await testFunction(testData)();
  } catch (error) {
    console.log('Test function failed');
    console.error(error);
    return;
  }

  try {
    assertion(testData)(result);
    console.log('============= Assertion passed =============');
  } catch (error) {
    console.log('============= Assertion failed =============');
    console.error(error);
  }
};

const tests = [
  {
    desc: 'test with selection file which already has icons',
    testData: {
      names: ['new1', 'new2']
    },
    testFunction: (testData) => async () => {
      const selectionPath = prepareStagingArea('test/assets/selection.json');

      const { names } = testData;
      return pipeline({
        icons: ['test/assets/1.svg', 'test/assets/2.svg'],
        names,
        selectionPath: selectionPath,
        forceOverride: true,
        outputDir: 'test/staging/output',
      });
    },
    assertion: (testData) => (result) => {
      const { names } = testData;
      const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
      assert.deepEqual(
        newSelection.icons.slice(0, names.length).map(icon => icon.properties.name),
        names
      );
    }
  },
  {
    desc: 'test with selection which does not have icons',
    testData: {
      names: ['new1', 'new2']
    },
    testFunction: (testData) => async () => {
      const selectionPath = prepareStagingArea('test/assets/selection-empty.json');
    
      const { names } = testData;
      return pipeline({
        icons: ['test/assets/1.svg', 'test/assets/2.svg'],
        names,
        selectionPath,
        forceOverride: true,
        outputDir: 'test/staging/output'
      });
    },
    assertion: (testData) => result => {
      const { names } = testData;
      const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
      assert.deepEqual(
        newSelection.icons.map(icon => icon.properties.name),
        names
      );
    }
  },
  {
    desc: 'test repository from empty',
    testFunction: () => async () => {
      const selectionPath = prepareStagingArea('test/assets/selection.json');

      return repository({
        selectionPath,
        repositoryPath: 'test/assets/icons',
        outputDir: 'test/staging/output'
      });
    },
    assertion: () => result => {
      const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
      assert.deepEqual(
        newSelection.icons.map(icon => icon.properties.name),
        ['first', 'second']
      );
    }
  },
  {
    desc: 'test repository deletions',
    testFunction: () => async () => {
      const selectionPath = prepareStagingArea('test/assets/selection.json');
      await fs.ensureDir(getAbsolutePath('test/staging/icons'));
      await fs.copyFile(getAbsolutePath('test/assets/1.svg'), 
        getAbsolutePath('test/staging/icons/lol.svg'));
      return repository({
        selectionPath,
        repositoryPath: 'test/staging/icons',
        outputDir: 'test/staging/output'
      });
    },
    assertion: () => result => {
      const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
      assert.deepEqual(
        newSelection.icons.map(icon => icon.properties.name),
        ['lol']
      );
    }
  }
];

module.exports = async () => {
  for (let i = 0; i < tests.length; i++) {
    await runCase(tests[i]);
  }
  process.exit(0);
};
