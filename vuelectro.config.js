const path = require('path');
const { dependencies } = require('./package.json');

// Obfuscation configuration common for both main and renderer processes
const universalObfuscatorConfig = {
  sourceMap: process.env.VUELECTRO_ENV !== 'build',
  sourceMapMode: 'separate',
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  debugProtectionInterval: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: false,
  shuffleStringArray: true,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 2,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
  target: 'node',
};

module.exports = {
  cleanOutputDir: true, // Whether to clean output directories before building source files or not

  // Configuration for the renderer process
  vRenderer: {
    // Specify the node modules you need for webpack to bundle into Vue renderer here (others will be defined as webpack externals)
    // If you plan to disable nodeIntegration, make sure to include all of your dependencies here
    bundleIn: ['core-js', 'vue', 'vue-router', 'vuex'],
    obfuscate: false, // Whether to obfuscate the renderer process or not (recommended)

    // Obfuscation configuration for renderer process goes here
    // Visit https://www.npmjs.com/package/javascript-obfuscator for instructions
    obfuscatorConfig: universalObfuscatorConfig,
  },

  // Configuration for the main process
  vMain: {
    bundle: false, // Whether to webpack the main process or not
    obfuscate: false, // Whether to obfuscate the main process or not (recommended)
    productionSourceMap: false, // Source map support for production in main process (Valid for both webpack and obfuscator)

    // An array of all the source files for the main process. Make sure to define each new main process source file you create here.
    // Also make sure to keep all your source files INSIDE the ./src/ directory
    // Path should be relative to ./src/ directory. Vuelectro will mirror the filenames and directory structure to your output automatically
    srcFiles: [
      'electron-main.js',
      'preload.js',
      'ipc/index.js',
      'helpers/axios.js',
      'helpers/store.js',
      'helpers/cron.js',
      'helpers/events.js',
    ],

    // webpack configuration for main process goes here
    // Visit https://webpack.js.org/guides/getting-started/#using-a-configuration for instructions
    webpackConfig: {
      devtool: 'source-map',
      target: 'electron-main',
      externals: {
        'electron-devtools-installer': "require('electron-devtools-installer')",
        ...Object.keys(dependencies || {}).reduce(
          (moduleObj, module) => (
            (moduleObj[module] = `require('${module}')`), moduleObj
          ),
          {},
        ),
      },
      entry: {
        'electron-main': path.join(process.cwd(), 'src', 'electron-main.js'),
        preload: path.join(process.cwd(), 'src', 'preload.js'),
      },
      output: {
        filename: '[name].js',
        path: path.join(process.cwd(), 'app'),
      },
      node: {
        global: false,
        __filename: false,
        __dirname: false,
      },
    },

    // Obfuscation configuration for main process goes here
    // Visit https://www.npmjs.com/package/javascript-obfuscator for instructions
    obfuscatorConfig: {
      ...universalObfuscatorConfig,
      sourceMap: true,
    },
  },

  // electron-builder configuration goes here
  // Visit https://www.electron.build/configuration/configuration for instructions
  electron_builder: {
    appId: 'com.tabeazy.connector',
    productName: 'Tabeazy Connector',
    artifactName: 'connector_v${version}.${ext}',
    directories: {
      output: 'dist_electron',
    },
    win: {
      target: [
        {
          target: 'nsis',
          arch: ['x64', 'ia32'],
        },
      ],
    },
    publish: [
      {
        provider: 'github',
        owner: 'hariaakash',
        repo: 'tabeazy-connector',
      },
    ],
    files: [
      '!src${/*}',
      '!public${/*}',
      '!resources${/*}',
      '!babel.config.js',
      '!vue.config.js',
      '!vuelectro.config.js',
      '!vuelectro.js',
    ],
    extraResources: [
      { from: 'resources', to: '.' },
      {
        from: './node_modules/node-adodb/lib/adodb.js',
        to: 'adodb.js',
      },
    ],
  },
};
