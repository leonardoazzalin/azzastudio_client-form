# Scheda Cliente — Azza Studio

Un modulo clienti statico moderno, premium ed accessibile progettato per **Azza Studio**. Consente la raccolta e l'invio strutturato di dati anagrafici, fiscali, operativi e consensi legali direttamente via email tramite **Web3Forms** (senza alcuna necessità di un server backend o database).

---

## 🚀 COME PUBBLICARE SU GITHUB PAGES

GitHub Pages ti permette di ospitare questo sito in modo completamente gratuito in pochi secondi. Ecco i passaggi per pubblicarlo:

### 1. Crea un nuovo Repository su GitHub
1. Accedi al tuo account su [GitHub](https://github.com).
2. Clicca su **New** (o sul tasto "+" in alto a destra → **New repository**).
3. Scegli un nome per il repository (es. `onboarding` o `scheda-cliente`).
4. Imposta il repository come **Public** (necessario per attivare GitHub Pages gratuitamente).
5. Lascia deselezionate le opzioni "Add a README file", "Add .gitignore" e "Choose a license".
6. Clicca su **Create repository**.

### 2. Carica i file del Progetto
Puoi caricare i file sia da terminale (consigliato per sviluppatori) sia tramite l'interfaccia web di GitHub.

#### Opzione A: Tramite interfaccia web (Drag & Drop)
1. Nella pagina del repository appena creato, clicca sul link **"uploading an existing file"** (sotto "Quick setup").
2. Trascina all'interno della finestra del browser i seguenti file dalla cartella del tuo computer:
   - `index.html`
   - `style.css`
   - `script.js`
   - `logo v2.PNG`
3. Clicca su **Commit changes** in fondo alla pagina.

#### Opzione B: Tramite Git da terminale
Esegui questi comandi all'interno della cartella del progetto:
```bash
# Inizializza il repository locale
git init

# Aggiungi tutti i file
git add .

# Esegui il primo commit
git commit -m "Primo deploy scheda cliente"

# Rinomina il branch in main
git branch -M main

# Associa il repository remoto di GitHub (sostituisci USERNAME e REPO con i tuoi dati reali)
git remote add origin https://github.com/TUO-USERNAME/NOME-REPO.git

# Invia i file al server
git push -u origin main
```

### 3. Attiva GitHub Pages
1. Nel tuo repository su GitHub, vai alla tab ⚙️ **Settings** (Impostazioni) nella barra superiore.
2. Nel menu laterale sinistro, clicca sulla voce **Pages**.
3. Sotto la sezione **Build and deployment**:
   - Alla voce **Source**, seleziona **Deploy from a branch**.
   - Alla voce **Branch**, seleziona **main** e imposta la cartella a **/ (root)**.
   - Clicca su 💾 **Save**.

### 4. Apri il link finale
1. Attendi circa 1-2 minuti che GitHub compili il deploy.
2. Aggiorna la pagina di impostazioni **Pages**: vedrai apparire un banner in alto con il link finale del tuo sito.
   Il link avrà una struttura simile a questa:
   `https://tuo-username.github.io/nome-repo/`

---

## ✉️ COME CONFIGURARE WEB3FORMS

**Web3Forms** si occupa di ricevere i dati inviati dal modulo e inoltrarli direttamente alla tua casella email gratuitamente.

### 1. Ottieni la tua Access Key
1. Vai su [web3forms.com](https://web3forms.com).
2. Nel modulo di registrazione in homepage, inserisci la tua casella email (es. `azzastudio@proton.me`).
3. Riceverai immediatamente un'email contenente la tua **Access Key** personale (una stringa alfanumerica di 36 caratteri).

### 2. Inserisci la Access Key nel Progetto
1. Apri il file [index.html](file:///c:/Users/leoaz/OneDrive/Documenti/azzastudio_contratti_site/index.html) con un editor di testo o codice.
2. Trova la riga dell'input `access_key` (intorno alla riga 225):
   ```html
   <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY_HERE">
   ```
3. Sostituisci `YOUR_ACCESS_KEY_HERE` con la chiave di 36 caratteri ricevuta via email (mantenendo le virgolette). Salva il file.

### 3. Testare prima in Localhost
Puoi verificare il funzionamento del form in locale sul tuo computer prima del deploy:
1. Apri il file `index.html` facendo doppio clic su di esso per visualizzarlo nel browser (o usa un'estensione come Live Server).
2. Compila i campi del modulo e fai clic su **Invia scheda cliente**.
3. Se l'invio ha successo, si aprirà l'overlay di ringraziamento e riceverai l'email di test strutturata in pochi secondi.

### 4. Gestione Dominio (Allowed Domains)
Per motivi di sicurezza, Web3Forms ti permette di bloccare l'invio da domini non autorizzati:
- Di base, **Web3Forms accetta gli invii provenienti da Localhost** e dal primo dominio da cui rileva traffico reale.
- Se sul tuo account Web3Forms attivi la restrizione di dominio (**Domain Restrictions**), assicurati di aggiungere l'indirizzo di GitHub Pages (es. `github.io` o il tuo dominio personalizzato se ne usi uno) tra i domini autorizzati nelle impostazioni della chiave su Web3Forms.

---

## 🎨 Note di Design & UX Mobile
- Il layout è ottimizzato per smartphone e viewport verticali (375px - 430px) eliminando zoom indesiderati su iOS Safari.
- I tooltip informativi si posizionano dinamicamente al body per evitare clipping.
- La trasmissione dei dati rispetta la formattazione a sezioni pulite per una lettura istantanea delle schede ricevute via mail.
