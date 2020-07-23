const { join, relative, sep, extname, resolve, dirname } = require('path');
const { existsSync, statSync } = require('fs-extra');
const enhancedResolve = require('enhanced-resolve');

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

function startsWith(prevString, nextString) {
  return prevString.indexOf(nextString) === 0;
}

function startsWithArr(prevString, nextStringArr = []) {
  return nextStringArr.some(nextString => startsWith(prevString, nextString));
}

function loadAsFile(module) {
  if (existsSync(module) && statSync(module).isFile()) {
    return module;
  }
  for (let e of extensions) {
    if (existsSync(module + e) && statSync(module + e).isFile()) {
      return module;
    }
  }
}

function loadAsDirectory(module) {
  if (!existsSync(module)) {
    return;
  }
  let stat = statSync(module);
  if (stat.isDirectory()) {
    for (let e of extensions) {
      const indexFile = join(module, `index${e}`);
      if (existsSync(indexFile) && statSync(indexFile).isFile()) {
        return join(module, 'index');
      }
    }
  } else if (stat.isFile()) {
    return loadAsFile(module);
  }
}

/**
 * Resolve relative path.
 * @param {string} script
 * @param {string} dependency
 * @return {string}
 */
function relativeModuleResolve(script, dependency) {
  if (startsWithArr(dependency, ['./', '../', '/', '.\\', '..\\', '\\'])) {
    let dependencyPath = join(script, dependency);
    return relative(
      script,
      loadAsFile(dependencyPath) || loadAsDirectory(dependencyPath)
    );
  } else throw new Error('The page source path does not meet the requirements');
};

/**
 * Use '/' as path sep regardless of OS when outputting the path to code
 * @param {string} filepath
 */
function normalizeOutputFilePath(filepath) {
  return filepath.replace(/\\/g, '/');
}

function getRelativePath(filePath) {
  let relativePath;
  if (filePath[0] === sep) {
    relativePath = `.${filePath}`;
  } else if (filePath[0] === '.') {
    relativePath = filePath;
  } else {
    relativePath = `.${sep}${filePath}`;
  }
  return relativePath;
}

function removeExt(path) {
  const ext = extname(path);
  return path.slice(0, path.length - ext.length);
}

function getDepPath(rootDir, entryPath, componentFilePath) {
  const srcPath = dirname(entryPath);
  if (componentFilePath[0] === sep ) {
    return join(rootDir, srcPath, componentFilePath);
  } else {
    return resolve(rootDir, srcPath, componentFilePath);
  }
}

/**
 * Resolve absolute path
 * @param  {...any} files
 */
function absoluteModuleResolve(...files) {
  return enhancedResolve.create.sync({
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.json']
  })(...files);
}

/**
 * get more specific files in miniapp
 * @param {string} platform
 * @param {array<string>} extensions
 */
function getPlatformExtensions(platform, extensions = []) {
  return [
    ...platform ? extensions.map((ext) => `.${platform}${ext}`) : [],
    ...extensions,
  ];
}

module.exports = {
  relativeModuleResolve,
  normalizeOutputFilePath,
  getRelativePath,
  removeExt,
  getDepPath,
  absoluteModuleResolve,
  getPlatformExtensions
};
