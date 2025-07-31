#!/usr/bin/env node

console.log('🔍 CONTROLLO PORTABILITÀ APPLICAZIONE ELECTRON\n');

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const issuesFound = [];
const recommendations = [];

function logSuccess(message) {
    console.log(`✅ ${message}`);
}

function logWarning(message) {
    console.log(`⚠️  ${message}`);
    recommendations.push(message);
}

function logError(message) {
    console.log(`❌ ${message}`);
    issuesFound.push(message);
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

function checkPackageJson() {
    logInfo('Controllando package.json...');
    
    const packagePath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Controlla se electron-builder è configurato
    if (!packageJson.build) {
        logError('Configurazione electron-builder mancante nel package.json');
        return;
    }

    logSuccess('Configurazione electron-builder trovata');

    // Controlla target portatile
    const build = packageJson.build;
    if (!build.win || !build.win.target) {
        logWarning('Target Windows non specificato');
    } else {
        const winTargets = Array.isArray(build.win.target) ? build.win.target : [build.win.target];
        const hasPortable = winTargets.some(target => 
            (typeof target === 'string' && target === 'portable') ||
            (typeof target === 'object' && target.target === 'portable')
        );
        
        if (hasPortable) {
            logSuccess('Target portable configurato per Windows');
        } else {
            logWarning('Target portable non trovato - raccomando di aggiungere "portable" ai target Windows');
        }
    }

    // Controlla asar
    if (build.asar === false) {
        logWarning('ASAR disabilitato - i file sono accessibili ma occupa più spazio');
    } else {
        logSuccess('ASAR abilitato per una migliore compressione');
    }

    // Controlla extraResources
    if (build.extraResources) {
        logSuccess(`ExtraResources configurato: ${JSON.stringify(build.extraResources)}`);
    }

    // Controlla nsis configuration
    if (build.nsis) {
        logSuccess('Configurazione NSIS trovata per installer Windows');
        if (build.nsis.oneClick === false) {
            logSuccess('Installer personalizzabile configurato');
        }
    }

    return packageJson;
}

function checkDependencies(packageJson) {
    logInfo('Controllando dipendenze...');
    
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Dipendenze critiche che devono essere incluse nel bundle
    const criticalDeps = [
        'react',
        'react-dom',
        'xlsx'
    ];

    const missingCritical = criticalDeps.filter(dep => !dependencies[dep]);
    if (missingCritical.length > 0) {
        logError(`Dipendenze critiche mancanti: ${missingCritical.join(', ')}`);
    } else {
        logSuccess('Tutte le dipendenze critiche sono presenti');
    }

    // Verifica che Electron sia in devDependencies
    if (!devDependencies.electron && !dependencies.electron) {
        logError('Electron non trovato nelle dipendenze');
    } else if (dependencies.electron) {
        logWarning('Electron è in dependencies - dovrebbe essere in devDependencies');
    } else {
        logSuccess('Electron correttamente configurato in devDependencies');
    }

    logInfo(`Totale dependencies: ${Object.keys(dependencies).length}`);
    logInfo(`Totale devDependencies: ${Object.keys(devDependencies).length}`);
}

function checkElectronConfig() {
    logInfo('Controllando configurazione Electron...');

    const mainPath = path.join(projectRoot, 'electron', 'main.js');
    if (!fs.existsSync(mainPath)) {
        logError('File electron/main.js non trovato');
        return;
    }

    logSuccess('File electron/main.js trovato');

    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Controlla preload script
    if (mainContent.includes('preload')) {
        logSuccess('Preload script configurato');
    } else {
        logWarning('Preload script non configurato - raccomandato per sicurezza');
    }

    // Controlla node integration
    if (mainContent.includes('nodeIntegration: false')) {
        logSuccess('Node integration disabilitata (sicuro)');
    } else if (mainContent.includes('nodeIntegration: true')) {
        logWarning('Node integration abilitata - potenziale rischio sicurezza');
    }

    // Controlla context isolation
    if (mainContent.includes('contextIsolation: true')) {
        logSuccess('Context isolation abilitata (sicuro)');
    } else {
        logWarning('Context isolation non configurata - raccomandato per sicurezza');
    }
}

function checkViteConfig() {
    logInfo('Controllando configurazione Vite...');

    const viteConfigPath = path.join(projectRoot, 'vite.config.js');
    if (!fs.existsSync(viteConfigPath)) {
        logError('File vite.config.js non trovato');
        return;
    }

    logSuccess('File vite.config.js trovato');

    const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Controlla configurazione base path
    if (viteContent.includes('ELECTRON_BUILD')) {
        logSuccess('Configurazione condizionale per Electron trovata');
    } else {
        logWarning('Configurazione Electron non trovata in vite.config.js');
    }
}

function generateRecommendations() {
    logInfo('\n📋 RACCOMANDAZIONI PER MASSIMA PORTABILITÀ:');
    
    const recs = [
        '1. Usare target "portable" per evitare installazione',
        '2. Disabilitare nodeIntegration e abilitare contextIsolation',
        '3. Utilizzare preload script per API sicure',
        '4. Testare su macchine Windows senza Node.js/npm',
        '5. Verificare che tutte le dipendenze siano incluse nel bundle',
        '6. Usare percorsi relativi per risorse Electron',
        '7. Considerare compressione UPX per ridurre dimensioni'
    ];

    recs.forEach(rec => logInfo(rec));
}

// Main execution
try {
    const packageJson = checkPackageJson();
    if (packageJson) {
        checkDependencies(packageJson);
    }
    
    checkElectronConfig();
    checkViteConfig();
    
    generateRecommendations();
    
    console.log('\n📊 RIEPILOGO:');
    console.log(`✅ Controlli passati: ${issuesFound.length === 0 ? 'Tutti' : 'Alcuni'}`);
    
    if (issuesFound.length > 0) {
        console.log(`❌ Problemi trovati: ${issuesFound.length}`);
        issuesFound.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (recommendations.length > 0) {
        console.log(`⚠️  Avvisi: ${recommendations.length}`);
        recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    if (issuesFound.length === 0) {
        console.log('\n🎉 L\'applicazione sembra configurata correttamente per la portabilità!');
    } else {
        console.log('\n🔧 Risolvere i problemi sopra elencati per migliorare la portabilità.');
    }
    
} catch (error) {
    console.error('❌ Errore durante il controllo:', error.message);
    process.exit(1);
}
