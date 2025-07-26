#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const downloadsDir = path.join(projectRoot, 'public', 'downloads');

// Crea la cartella downloads se non esiste
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log('✅ Cartella downloads creata');
}

// Funzione per copiare un file
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`✅ Copiato: ${path.basename(destination)}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore copiando ${path.basename(source)}:`, error.message);
    return false;
  }
}

// Funzione per pulire la cartella downloads
function cleanDownloads() {
  try {
    const files = fs.readdirSync(downloadsDir);
    files.forEach(file => {
      if (file.endsWith('.exe') || file.endsWith('.zip')) {
        fs.unlinkSync(path.join(downloadsDir, file));
        console.log(`🗑️  Rimosso: ${file}`);
      }
    });
  } catch (error) {
    console.log('ℹ️  Cartella downloads già vuota');
  }
}

// Mappa dei file da copiare con i nuovi nomi
const filesToCopy = [
  {
    pattern: /People Dashboard Setup \d+\.\d+\.\d+\.exe$/,
    newName: 'People-Dashboard-Setup.exe'
  },
  {
    pattern: /People Dashboard-\d+\.\d+\.\d+-win\.zip$/,
    newName: 'People-Dashboard-Windows-x64.zip'
  },
  {
    pattern: /People Dashboard-\d+\.\d+\.\d+-ia32-win\.zip$/,
    newName: 'People-Dashboard-Windows-x32.zip'
  }
];

console.log('🚀 Inizio copia file downloads...\n');

// Pulisci la cartella downloads
console.log('🧹 Pulizia cartella downloads...');
cleanDownloads();
console.log('');

// Verifica che la cartella dist esista
if (!fs.existsSync(distDir)) {
  console.error('❌ Cartella dist non trovata. Esegui prima "npm run electron:dist-win"');
  process.exit(1);
}

// Leggi tutti i file nella cartella dist
const distFiles = fs.readdirSync(distDir);
let copiedFiles = 0;

console.log('📁 File trovati in dist:');
distFiles.forEach(file => {
  if (file.endsWith('.exe') || file.endsWith('.zip')) {
    console.log(`   - ${file}`);
  }
});
console.log('');

// Copia i file corrispondenti
console.log('📥 Copia file in downloads:');
filesToCopy.forEach(({ pattern, newName }) => {
  const matchingFile = distFiles.find(file => pattern.test(file));
  
  if (matchingFile) {
    const sourcePath = path.join(distDir, matchingFile);
    const destPath = path.join(downloadsDir, newName);
    
    if (copyFile(sourcePath, destPath)) {
      copiedFiles++;
    }
  } else {
    console.log(`⚠️  File non trovato per pattern: ${pattern}`);
  }
});

console.log(`\n✨ Processo completato! ${copiedFiles} file copiati.`);

if (copiedFiles > 0) {
  console.log('\n📂 File disponibili in public/downloads:');
  const finalFiles = fs.readdirSync(downloadsDir);
  finalFiles.forEach(file => {
    if (file.endsWith('.exe') || file.endsWith('.zip')) {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
      console.log(`   ✅ ${file} (${sizeMB} MB)`);
    }
  });
  
  console.log('\n🎉 I file sono ora disponibili per il download dal web!');
} else {
  console.log('\n⚠️  Nessun file copiato. Verifica che la build di Electron sia completata.');
}
