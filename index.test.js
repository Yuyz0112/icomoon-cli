const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pipeline = require('./index');

const names = ['new1', 'new2'];

pipeline({
  icons: ['test-assets/全屏退出.svg', 'test-assets/最新消息组icon-01.svg'],
  names,
  selectionPath: 'test-assets/selection.json',
  whenFinished (result) {
    const newSelection = JSON.parse(fs.readFileSync(path.resolve(result.outputDir, 'selection.json')));
    assert.deepEqual(
      newSelection.icons.slice(0, names.length).map(icon => icon.properties.name),
      names
    );
  }
});
