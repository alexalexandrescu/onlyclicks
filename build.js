const rimraf = require('rimraf');
const fs = require('fs');
const util = require('util');
const sharp = require('sharp');
const archiver = require('archiver');

const distDir = 'dist';

async function clearDist() {
  await rimraf(distDir);
  await fs.promises.mkdir(distDir);
}

async function copyFiles() {
  const filesToCopy = [
    'manifest.json',
    'background.js',
    'popup.html',
    'popup.css',
  ];

  await Promise.all(
    filesToCopy.map((file) =>
      fs.promises.copyFile(`src/${file}`, `${distDir}/${file}`).then(() =>
        console.log(`Copied ${file} to dist folder.`)
      )
    )
  );
}

async function resizeImage() {
  // Assuming you have an image file in your project directory called 'icon.png'
  const inputImagePath = 'logo.png';

  await sharp(inputImagePath)
    .resize(128, 128)
    .toFile(`${distDir}/128.png`);

  console.log('Image resized.');
}

async function createZip() {
  const output = fs.createWriteStream(`${distDir}.zip`);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  return new Promise((resolve) => {
    output.on('close', () => {
      console.log(`Zip file created: ${distDir}.zip`);
      resolve();
    });

    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

(async () => {
  await clearDist();
  await copyFiles();
  await resizeImage();
  await createZip();
  console.log('Build completed.');
})();
