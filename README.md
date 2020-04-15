# icomoon-cli

icomoon-cli is a cross platform command line tool which help you upload your new icons into an existed icomoon set.

Since icomoon do not provide any public API to use, you may found it's hard to integrate icomoon into your current workflow. icomoon-cli was made to solve this.

## SSFBank Fork

Forked version with major changes from the [original version](https://github.com/Yuyz0112/icomoon-cli)
Has a new feature(repository mode), npm package upgrades, async API and refactors that may not end up in upstream original.

WhenFinished is also fully deprecated and removed instead of fully async API for better program control.

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
  -r, --repository folder where icons are maintained, additions and deletions.
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
  forceOverride: true
}).then(result => {
    // result: {
    //  outputDir: '/home/blabla/project/output', // absolute path
    //  didOutput: true // whether anything actually got output. errors get logged.
    // }
});
```

You can hack the downloaded icomoon file using `Promise` to control your code since pipeline will return a promise.

## repository mode

When your use case is a git project with an icon subfolder, icomoon-cli will output based on the additions and deletions of icons to this folder. 

Beware though, this folder can only contain usable icons supported by icomoon, so keep your other files elsewhere. Also, repository() rules out using the icon argument yourself.

```js
// Install: npm i icomoon-cli

// Usage
const { repository } = require('icomoon-cli');
repository(
    {
        selectionPath: 'selection.json',
        repositoryPath: 'SVG',
        outputDir: 'output',
        forceOverride: true
    }
).then(result => {
    // result: {
    //  outputDir: '/home/blabla/project/output',
    //  didOutput: true
    // }
    if (result.didOutput) {
        preProcessSCSS();
        copyFiles();
        cleanUp();
    }
});
```
