const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pipeline = require('./index');

const runCase = (name, fn) => new Promise((resolve, reject) => {
  function done(err) {
    if (err) {
      console.log('============= Assertion failed =============');
      reject();
      process.exit(1);
    } else {
      console.log('============= Assertion passed =============');
      resolve();
    }
  }
  console.log(`\r\n============= Start test '${name}' =============`);
  fn(done);
});

(async function() {
  await runCase('test with selection file which already has icons', done => {
    const names = ['new1', 'new2'];
    pipeline({
      icons: ['test-assets/1.svg', 'test-assets/2.svg'],
      names,
      selectionPath: 'test-assets/selection.json',
      forceOverride: true,
      whenFinished (result) {
        const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
        assert.deepEqual(
          newSelection.icons.slice(0, names.length).map(icon => icon.properties.name),
          names
        );
        done();
      }
    });
  });

  await runCase('test with selection which does not have icons', done => {
    const names = ['new1', 'new2'];
    pipeline({
      icons: ['test-assets/1.svg', 'test-assets/2.svg'],
      names,
      selectionPath: 'test-assets/selection-empty.json',
      forceOverride: true,
      whenFinished (result) {
        const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
        assert.deepEqual(
          newSelection.icons.map(icon => icon.properties.name),
          names
        );
        done();
      }
    });
  });
})();
