#!/usr/bin/env node
const yargs = require('yargs');
const pipeline = require('./index');

const argv = yargs
  .alias('h', 'help')
  .option('s', {
    alias : 'selection',
    demand: true,
    describe: 'path to icomoon selection file',
  })
  .option('i', {
    alias: 'icons',
    describe: 'paths to icons need to be imported, separated by comma',
    default: '',
  })
  .option('n', {
    alias: 'names',
    describe: 'rename icons, separated by comma, matched by index',
    default: '',
  })
  .option('o', {
    alias: 'output',
    default: './output',
    describe: 'output directory',
  })
  .option('f', {
    alias: 'force',
    default: false,
    describe: 'force override current icon when icon name duplicated',
  })
  .option('v', {
    alias: 'visible',
    default: false,
    describe: 'run a GUI chrome instead of headless mode',
  })
  .argv;

pipeline({
  selectionPath: argv.s,
  icons: argv.i.split(','),
  names: argv.n.split(','),
  outputDir: argv.o,
  forceOverride: argv.f,
  visible: argv.visible,
});
