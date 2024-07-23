import { cp, glob, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { cmd } from '../helpers/cmd.js';

/**
 * Builds the lib.
 * @return {Promise<void>}
 */
async function build() {
  const sourcePath = './src';
  const destinationPath = './dist';

  await removeDestination(destinationPath);

  try {
    const typescriptIndexFilePath = await buildTypescriptIndexFile(sourcePath);
    await compileTypescript();
    await copyTypescriptFiles(sourcePath, destinationPath);
    await removeTypescriptIndexFile(typescriptIndexFilePath);
    await copyScssFiles(sourcePath, destinationPath);
    await buildScssIndexFile(destinationPath);
    await buildPackageJsonFile(destinationPath);
  } catch (error) {
    await removeDestination(destinationPath);
    throw error;
  }

  console.log('Library built with success !');
}

/**
 * Removes the destination folder.
 *
 * @param {string} destinationPath
 * @return {Promise<void>}
 */
async function removeDestination(destinationPath) {
  await rm(destinationPath, { recursive: true, force: true });
}

/**
 * Builds the typescript index file used to export all public APIs.
 *
 * @param {string} cwd
 * @return {Promise<string>}
 */
async function buildTypescriptIndexFile(cwd = process.cwd()) {
  console.log('Building typescript index file...');

  const content = (await Array.fromAsync(glob('./**/!(*.spec|*.test|*.private).ts', { cwd })))
    .map((path) => {
      return `export * from './${path.slice(0, -3)}.js';`;
    })
    .join('\n');

  if (content === '') {
    throw new Error('Nothing exported.');
  }

  const indexFilePath = join(cwd, 'index.ts');
  await writeFile(indexFilePath, content + '\n');

  return indexFilePath;
}

/**
 * Compiles the typescript files.
 *
 * @param {string | undefined } cwd
 * @return {Promise<void>}
 */
async function compileTypescript(cwd = process.cwd()) {
  console.log('Compiling typescript...');

  await cmd('tsc', ['-p', './tsconfig.build.json'], { cwd });
}

/**
 * Copies typescript files into the destination.
 *
 * @param {string} sourcePath
 * @param {string} destinationPath
 * @return {Promise<void>}
 */
async function copyTypescriptFiles(sourcePath, destinationPath) {
  console.log('Copying typescript files...');

  for await (const path of glob('./**/!(*.spec|*.test).ts', { cwd: sourcePath })) {
    await cp(join(sourcePath, path), join(destinationPath, path));
  }
}

/**
 * Builds the typescript index file used to export all public APIs.
 *
 * @param {string} cwd
 * @return {Promise<void>}
 */
async function buildScssIndexFile(cwd = process.cwd()) {
  console.log('Building scss index file...');

  const content = (await Array.fromAsync(glob('./**/!(*.private).scss', { cwd })))
    .map((path) => {
      return `@forward './${path.slice(0, -5)}';`;
    })
    .join('\n');

  if (content === '') {
    console.log('=> No scss file to export.');
  } else {
    const indexFilePath = join(cwd, 'index.scss');
    await writeFile(indexFilePath, content + '\n');
  }
}

/**
 * Copies scss files into the destination.
 *
 * @param {string} sourcePath
 * @param {string} destinationPath
 * @return {Promise<void>}
 */
async function copyScssFiles(sourcePath, destinationPath) {
  console.log('Copying scss files...');

  for await (const path of glob('./**/!(*.private).scss', { cwd: sourcePath })) {
    // await cp(join(sourcePath, path), join(destinationPath, path));
    await writeFile(
      join(destinationPath, path),
      fixScssFileContent(await readFile(join(sourcePath, path), { encoding: 'utf8' })),
    );
  }
}

/**
 * Fixes the content of a scss file.
 *
 * @param {string} content
 * @return {string}
 */
function fixScssFileContent(content) {
  return content.replace(/@(use|import)\s+['"]([^'"]*)['"]/g, (_, type, importPath) => {
    if (isAbsolute(importPath)) {
      throw new Error(`Import path ${importPath} cannot be absolute.`);
    }

    if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
      importPath = `./${importPath}`;
    }

    if (importPath.endsWith('.scss')) {
      importPath = importPath.slice(0, -5);
    }

    return `@${type} '${fixScssFilePath(importPath)}'`;
  });
}

/**
 * Fixes a scss file path.
 *
 * @param {string} path
 * @return {string}
 */
function fixScssFilePath(path) {
  if (!path.startsWith('@')) {
    if (isAbsolute(path)) {
      throw new Error(`Import path ${path} cannot be absolute.`);
    }

    if (!path.startsWith('./') && !path.startsWith('../')) {
      path = `./${path}`;
    }
  }

  if (path.endsWith('.scss')) {
    path = path.slice(0, -5);
  }

  return path;
}

/**
 * Removes the index file.
 *
 * @param {string} indexFilePath
 * @return {Promise<void>}
 */
async function removeTypescriptIndexFile(indexFilePath) {
  await rm(indexFilePath);
}

/**
 * Generates the package.json to publish.
 *
 * @param {string} destinationPath
 * @param {string} cwd
 * @return {Promise<void>}
 */
async function buildPackageJsonFile(destinationPath, cwd = process.cwd()) {
  console.log('Building package.json...');

  const fileName = 'package.json';

  /**
   * @type any
   */
  const pkg = JSON.parse(await readFile(join(cwd, fileName), { encoding: 'utf8' }));

  const indexTypesPath = './types/index.d.ts';

  Object.assign(pkg, {
    exports: {
      '.': {
        types: indexTypesPath,
        default: './index.js',
      },
    },
    typings: indexTypesPath,
    types: indexTypesPath,
  });

  await writeFile(join(destinationPath, fileName), JSON.stringify(pkg, null, 2));
}

/*-----------------------------------*/

build();
