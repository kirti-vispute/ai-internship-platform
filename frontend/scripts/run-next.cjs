const path = require('node:path');

// Windows Application Control can block the native SWC binary.
if (process.platform === 'win32') {
  process.env.NEXT_TEST_WASM_DIR = path.dirname(
    require.resolve('@next/swc-wasm-nodejs')
  );
}

require('next/dist/bin/next');
