# 🚀 Release Checklist

## ✅ **Prima di Creare un Nuovo Tag**

### 1. **📝 Aggiorna README.md**
- [ ] Aggiungi la nuova versione nel Changelog con data corrente
- [ ] Descrivi le nuove funzionalità nella sezione appropriata
- [ ] Aggiorna badge e statistiche se necessario
- [ ] Verifica che tutti i link funzionino

### 2. **🔍 Verifica Modifiche**
- [ ] Testa tutte le nuove funzionalità in locale
- [ ] Controlla che non ci siano errori TypeScript
- [ ] Verifica build locale: `npm run build`
- [ ] Testa app Electron se ci sono modifiche: `npm run electron:build`

### 3. **📦 Processo Release**
```bash
# 1. Committa tutte le modifiche incluso README
git add .
git commit -m "🚀 Prepare release v1.x"

# 2. Pusha su main per update GitHub Pages
git push origin main

# 3. Crea e pusha il tag per trigger release Electron
git tag v1.x
git push origin v1.x
```

### 4. **🔄 Verifica Post-Release**
- [ ] Controlla che GitHub Pages si aggiorni correttamente
- [ ] Verifica che GitHub Actions completi senza errori
- [ ] Controlla che i binari vengano generati nella release
- [ ] Testa download di almeno un binario

---

## 📋 **Template Changelog Entry**

```markdown
## [v1.x] - YYYY-MM-DD
### ✨ Nuove Funzionalità
- **Feature Name**: Descrizione feature

### 🔧 Miglioramenti  
- **Improvement**: Descrizione miglioramento

### 🐛 Correzioni
- **Fix**: Descrizione fix

### 🛠️ Modifiche Tecniche
- **Technical Change**: Descrizione modifica tecnica
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
