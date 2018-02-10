# icomoon-cli

icomoon-cli is a cross platform command line tool which help you upload your new icons into an existed icomoon set.

Since icomoon do not provide any public API to use, you may found it's hard to integrate icomoon into your current workflow. icomoon-cli was made to solve this.

## dependencies

icomoon-cli will use your local Chrome to interact with icomoon in headless mode, so you need to make sure the latest version Chrome browser was installed.

Another dependency is the LTS version Node.js.

## cli usage

If you like to use icomoon-cli as a cli, simply installed it via npm and use with following commands

```shell
Install: npm i -g icomoon-cli

Usage: icomoon-cli [command]
Commands:
  --version        output the version number
  -h, --help       output usage information
  -i, --icons      paths to icons need to be imported, separated by comma
  -s, --selection  path to icomoon selection file
  -n, --names      rename icons, separated by comma, matched by index
  -o, --output     output directory
  -f, --force      force override current icon when icon name duplicated
  -v, --visible    run a GUI chrome instead of headless mode

Example Usage: icomoon-cli -i test-assets/1.svg,test-assets/2.svg -s test-assets/selection.json -n newname1,newname2 -o output
```

## programmatic usage

If you like to integrate icomoon-cli into your workflow, it's recommended to use in the programmatic way

```js
// Install: npm i icomoon-cli

// Usage
const pipeline = require('icomoon-cli');
pipeline({
  icons: ['test-assets/1.svg', 'test-assets/2.svg'],
  names: ['new1', 'new2'],
  selectionPath: 'test-assets/selection.json',
  outputDir: 'output',
  forceOverride: true,
  // visible: true,
  whenFinished (result) {
    // you can get the absolute path of output directory via result.outputDir
  }
});
```

You can hack the downloaded icomoon files in a callback property `whenFinished`, or just use `Promise` to control your code since pipeline will return a promise.
