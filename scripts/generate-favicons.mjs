import sharp from 'sharp';
import path from 'path';

const publicDir = './public/favicons';
const svgPath = path.join(publicDir, 'favicon.svg');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon.ico' },
  { size: 64, name: 'favicon-64x64.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

async function generateFavicons() {
  console.log('🎨 Generating favicon set from SVG...\n');

  try {
    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(svgPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: ${name} (${size}×${size})`);
    }

    console.log('\n🎉 Favicon set generated successfully!');
    console.log('\nGenerated files:');
    sizes.forEach(({ name }) => {
      console.log(`  - public/${name}`);
    });
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();
