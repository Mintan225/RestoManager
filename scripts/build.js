import { build } = from 'esbuild';
import { tsconfigPaths } from 'esbuild-plugin-tsconfig-paths';

// Déterminez le point d'entrée de votre backend.
// Si index.ts est directement dans le dossier 'backend', le chemin est 'backend/index.ts'.
// Si index.ts est à la racine du projet, le chemin est 'index.ts'.
const entryPoint = 'backend/index.ts'; // Ajustez ce chemin si nécessaire

build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  minify: true,
  // Assurez-vous que ces dépendances externes sont correctement listées
  external: ['drizzle-orm', 'drizzle-zod', 'zod'],
  plugins: [tsconfigPaths()], // <-- Le plugin est ajouté ici !
}).catch(() => process.exit(1));