# 🚀 Release Checklist

## ✅ **Prima di Creare un Nuovo Tag**

### 1. **🎯 Aggiorna package.json (OBBLIGATORIO)**
- [ ] **CRITICAL**: Incrementa la versione in `package.json` (es. da 2.3.1 a 2.3.2)
- [ ] Verifica che la nuova versione segua semantic versioning

### 2. **📝 Aggiorna README.md (OBBLIGATORIO)**
- [ ] **CRITICAL**: Aggiorna sezione Download con la nuova versione negli artifact names
- [ ] Aggiungi la nuova versione nel Changelog con data corrente
- [ ] Descrivi le nuove funzionalità nella sezione appropriata
- [ ] Aggiorna badge e statistiche se necessario
- [ ] Verifica che tutti i link funzionino

### 3. **🔍 Verifica Modifiche**
- [ ] Testa tutte le nuove funzionalità in locale
- [ ] Controlla che non ci siano errori TypeScript
- [ ] Verifica build locale: `npm run build`
- [ ] Testa app Electron se ci sono modifiche: `npm run electron:build`
- [ ] Esegui portability check: `node scripts/check-portability.cjs`

### 4. **📦 Processo Release**
```bash
# 1. OBBLIGATORIO: Committa package.json E README aggiornati
git add package.json README.md
git commit -m "🚀 Prepare release v2.x.x - Update version and docs"

# 2. Committa eventuali altre modifiche
git add .
git commit -m "🚀 Additional changes for v2.x.x"

# 3. Pusha su main per update GitHub Pages
git push origin main

# 4. Crea e pusha il tag per trigger release Electron
git tag v2.x.x
git push origin v2.x.x
```

### 5. **🔄 Verifica Post-Release**
- [ ] Controlla che GitHub Pages si aggiorni correttamente
- [ ] Verifica che GitHub Actions completi senza errori
- [ ] Controlla che i binari vengano generati nella release CON LA VERSIONE CORRETTA nel nome
- [ ] Testa download di almeno un binario
- [ ] Verifica che gli artifact abbiano nomi tipo: `effort-dashboard-v2.x.x-portable-win32-x64.exe`

---

## 📋 **Template Changelog Entry**

---

## 📋 **Template Changelog Entry**

```markdown
## [v2.x.x] - YYYY-MM-DD
### ✨ Nuove Funzionalità
- **Feature Name**: Descrizione feature

### 🔧 Miglioramenti  
- **Improvement**: Descrizione miglioramento

### 🐛 Correzioni
- **Fix**: Descrizione fix
```

---

## ⚠️ **PROMEMORIA CRITICI**

### � **DA NON DIMENTICARE MAI**
1. **package.json version**: Deve essere aggiornata PRIMA di creare il tag
2. **README.md download links**: Devono riflettere la nuova versione negli artifact names
3. **Sincronizzazione**: package.json, README e tag devono avere la stessa versione
4. **GitHub Actions**: NON pushare gli artifact manualmente, li creerà GitHub automaticamente

### 📁 **Nomi Artifact Attesi**
Gli artifact Windows dovranno avere questi nomi pattern:
- `effort-dashboard-v2.x.x-portable-win32-x64.exe`
- `effort-dashboard-v2.x.x-portable-win32-ia32.exe` 
- `effort-dashboard-v2.x.x-portable-win32-universal.exe`
- `effort-dashboard-v2.x.x-setup.exe`

### 🔄 **Workflow Completo**
```
1. Modifica codice/features
2. AGGIORNA package.json version
3. AGGIORNA README.md (download + changelog)
4. Test locale
5. Commit + push
6. Crea tag
7. Verifica release automatica
```

---

## 🎯 **Promemoria Importante**

**⚠️ NON DIMENTICARE MAI DI AGGIORNARE IL README PRIMA DI CREARE UN TAG!**

Il README è la prima cosa che vedono gli utenti e deve sempre essere aggiornato con:
- Versione corrente
- Nuove funzionalità
- Link corretti
- Badge aggiornati

---

*Questo file serve come promemoria per mantenere il progetto professionale e aggiornato.* 🚀
