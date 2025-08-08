// scripts/build.js
import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';

// Custom plugin to resolve TypeScript paths from tsconfig.json
const tsconfigPathsPlugin = {
  name: 'tsconfig-paths',
  setup(build) {
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    let tsconfig;
    try {
      tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    } catch (e) {
      console.error(`Error reading tsconfig.json at ${tsconfigPath}:`, e);
      return; // Exit setup if tsconfig can't be read
    }

    const baseUrl = path.resolve(process.cwd(), tsconfig.compilerOptions.baseUrl || '.');
    const paths = tsconfig.compilerOptions.paths || {};

    // First, try to resolve external modules (node_modules)
    build.onResolve({ filter: /.*/, namespace: 'file' }, (args) => {
      if (!args.path.startsWith('.') && !args.path.startsWith('/')) { // Not a relative or absolute path
        // Let esbuild handle node_modules resolution naturally
        return null;
      }
    });

    // Then, try to resolve aliases from tsconfig.paths
    build.onResolve({ filter: /.*/, namespace: 'file' }, args => {
      for (const alias in paths) {
        const aliasPattern = new RegExp(`^${alias.replace('*', '(.*)')}$`);
        const match = args.path.match(aliasPattern);

        if (match) {
          const aliasTarget = paths[alias][0];
          const resolvedPath = path.resolve(
            baseUrl,
            aliasTarget.replace('*', match[1])
          );
          // Add .ts, .tsx, .js, .jsx extensions if not present
          const extensions = ['.ts', '.tsx', '.js', '.jsx'];
          for (const ext of extensions) {
            if (fs.existsSync(resolvedPath + ext)) {
              return { path: resolvedPath + ext };
            }
          }
          if (fs.existsSync(path.join(resolvedPath, 'index.ts'))) { // Handle directory imports
            return { path: path.join(resolvedPath, 'index.ts') };
          }
          // console.warn(`Alias resolved but file not found: ${args.path} -> ${resolvedPath}`);
          return { path: resolvedPath }; // Return path even if not found, let esbuild report error
        }
      }
      return null; // Not an alias, let subsequent plugins or default resolver handle
    });

    // Finally, handle relative imports with explicit extensions
    build.onResolve({ filter: /^\.\.?\//, namespace: 'file' }, args => {
      const resolvedPath = path.resolve(args.resolveDir, args.path);
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        if (fs.existsSync(resolvedPath + ext)) {
          return { path: resolvedPath + ext };
        }
      }
      if (fs.existsSync(path.join(resolvedPath, 'index.ts'))) {
        return { path: path.join(resolvedPath, 'index.ts') };
      }
      return null; // Let esbuild handle if no explicit extension found
    });
  },
};

const entryPoint = 'backend/index.ts'; // Adjust this path if necessary

build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  minify: true,
  external: ['drizzle-orm', 'drizzle-zod', 'zod'], // Keep these external
  plugins: [tsconfigPathsPlugin],
}).catch(() => process.exit(1));
