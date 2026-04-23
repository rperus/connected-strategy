#!/usr/bin/env node
/**
 * scripts/generate-icons.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates the required icon sizes from assets/icons/icon.png.
 *
 * Requires: npm install -g sharp  (or install as devDependency)
 * Usage:    node scripts/generate-icons.js
 *
 * Outputs to assets/icons/:
 *   icon.png         (512×512 — source)
 *   icon-256.png     (256×256)
 *   icon-128.png     (128×128)
 *   icon-64.png      (64×64)
 *   icon-32.png      (32×32)
 *   icon-16.png      (16×16)
 *   icon.ico         (multi-size ICO via png-to-ico)
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const ROOT      = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'assets', 'icons');
const SRC_PNG   = path.join(ICONS_DIR, 'icon.png');

if (!fs.existsSync(SRC_PNG)) {
  console.error('ERROR: Source icon not found at', SRC_PNG);
  console.error('Place a 512×512 PNG at assets/icons/icon.png and re-run.');
  process.exit(1);
}

const SIZES = [512, 256, 128, 64, 32, 16];

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (_) {
    console.warn('sharp not found — skipping PNG resize. Install with: npm i -D sharp');
    return generateIcoFallback();
  }

  console.log('Generating PNG sizes…');
  for (const size of SIZES) {
    const outFile = size === 512
      ? SRC_PNG
      : path.join(ICONS_DIR, `icon-${size}.png`);

    if (size !== 512) {
      await sharp(SRC_PNG).resize(size, size).toFile(outFile);
      console.log(`  ✓ icon-${size}.png`);
    }
  }

  // Generate ICO (16, 32, 48, 256)
  try {
    const pngToIco = require('png-to-ico');
    const icoSizes = [16, 32, 64, 256];
    const pngBuffers = await Promise.all(
      icoSizes.map(s => {
        const f = s === 512 ? SRC_PNG : path.join(ICONS_DIR, `icon-${s}.png`);
        return sharp(SRC_PNG).resize(s, s).toBuffer();
      })
    );
    const ico = await pngToIco(pngBuffers);
    fs.writeFileSync(path.join(ICONS_DIR, 'icon.ico'), ico);
    console.log('  ✓ icon.ico');
  } catch (_) {
    console.warn('png-to-ico not available — skipping .ico generation. Install with: npm i -D png-to-ico');
    generateIcoFallback();
  }

  console.log('Done. Icons written to assets/icons/');
}

function generateIcoFallback() {
  const icoPath = path.join(ICONS_DIR, 'icon.ico');
  if (!fs.existsSync(icoPath)) {
    // Copy the PNG as a placeholder (not a real ICO but prevents hard crash)
    fs.copyFileSync(SRC_PNG, icoPath);
    console.log('  ⚠  icon.ico created as PNG copy — replace with a real ICO when sharp is available.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
