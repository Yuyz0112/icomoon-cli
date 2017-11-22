const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pipeline = require('./index');

const names = ['new1', 'new2'];

console.log('============= Start test =============');
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
    console.log('============= Assertion passed =============');
  }
});
