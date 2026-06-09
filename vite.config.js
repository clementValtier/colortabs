import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import terser from '@rollup/plugin-terser';

// ---------------------------------------------------------------------------
// Plugin : injection version/name/description depuis package.json
// ---------------------------------------------------------------------------
function manifestPlugin() {
  return {
    name: 'manifest-plugin',
    writeBundle() {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf-8'));

      manifest.name = pkg.displayName || pkg.name;
      manifest.version = pkg.version;
      manifest.description = pkg.description;

      fs.writeFileSync(
        path.resolve('dist/manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Config principale
// ---------------------------------------------------------------------------
export default defineConfig(({ mode }) => ({
  root: 'src',
  publicDir: path.resolve('src/public'),
  build: {
    outDir: path.resolve('dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup:    path.resolve('src/scripts/popup.js'),
        options:  path.resolve('src/scripts/options.js'),
        switcher: path.resolve('src/scripts/switcher.js'),
      },
      output: {
        entryFileNames: 'scripts/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
      plugins: mode === 'production'
        ? [terser({ compress: { drop_console: true } })]
        : [],
    },
  },
  plugins: [
    manifestPlugin(),
  ],
}));
