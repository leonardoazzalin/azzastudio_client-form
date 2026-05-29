/**
 * ============================================================
 * AZZA STUDIO — Scheda Cliente | script.js
 * ============================================================
 * Moduli:
 *  1. Selectors & State
 *  2. Header / Scroll behaviour
 *  3. Reveal animations (IntersectionObserver)
 *  4. Section index navigation
 *  5. Conditional fields logic (tipo cliente)
 *  6. Form progress / completion tracker
 *  7. Live summary sidebar
 *  8. Input formatting (CF, P.IVA, tel, textarea autosize)
 *  9. Validation
 * 10. Email body builder
 * 11. Form submit (Web3Forms)
 * 12. UI feedback (loading / success / error)
 * 13. Misc (back-to-top, year, scroll-to, hero parallax)
 * ============================================================
 */

/* ============================================================
   1. SELECTORS & STATE
   ============================================================ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const state = {
  tipoCliente: null,   // 'Persona fisica' | 'Azienda / Attività / Studio' | 'Associazione / Impresa / Società'
  completion: 0,
  submitting: false,
  wasSubmitted: false, // Track if submit button was clicked
};

// DOM refs — lazily resolved on DOMContentLoaded
let form, submitBtn, validationSummary, validationList,
    successOverlay, successMeta,
    headerProgressBar, headerProgressPct,
    ringFill, ringPct, summaryBody,
    backToTop, currentYear;

/* ============================================================
   2. HEADER / SCROLL BEHAVIOUR
   ============================================================ */

function initHeader() {
  const header = $('#header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    // Scrolled class for glass effect
    header.classList.toggle('scrolled', y > 30);

    // Back-to-top button
    if (backToTop) backToTop.hidden = y < 400;

    lastScroll = y;
  }, { passive: true });
}

/* ============================================================
   3. REVEAL ANIMATIONS
   ============================================================ */

function initReveal() {
  const revealEls = $$('.reveal-up, .reveal-clip');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

/* ============================================================
   4. SECTION INDEX NAVIGATION
   ============================================================ */

function initSectionIndex() {
  const sectionIndex = $('#sectionIndex');
  const links = $$('.si-link');
  const sections = [
    $('#hero'),
    $('#intro'),
    $('#tipo-cliente'),
    $('#dati-anagrafici'),
    $('#dati-fatturazione'),
    $('#dati-dominio'),
    $('#consensi'),
  ];

  // Show index after hero
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      sectionIndex.classList.toggle('visible', !e.isIntersecting);
    });
  }, { threshold: 0.2 });

  heroObserver.observe($('#hero'));

  // Active link tracking
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('active', l.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.filter(Boolean).forEach(s => sectionObserver.observe(s));

  // Smooth scroll on click
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ============================================================
   5. CONDITIONAL FIELDS (tipo cliente)
   ============================================================ */

// Elements that appear only for persona fisica
const PERSONA_FIELDS = ['#wrap_nome_cognome', '#wrap_residenza', '#wrap_data_nascita'];
// Elements that appear only for ente (azienda, associazione, ecc.)
const ENTITY_FIELDS  = ['#wrap_ragione_sociale', '#wrap_sede_legale',
                        '#wrap_legale_rappresentante', '#wrap_qualifica_firmatario',
                        '#wrap_contatto_interno'];

// Professional B2B fields
const PROFESSIONAL_FIELDS = ['#wrap_partita_iva', '#wrap_codice_sdi', '#wrap_pec_fatturazione'];

function showField(selector) {
  const el = $(selector);
  if (!el) return;
  el.classList.remove('hidden-field');
  el.classList.add('show-in');
}

function hideField(selector) {
  const el = $(selector);
  if (!el) return;
  el.classList.add('hidden-field');
  el.classList.remove('show-in');
  $$('input, select, textarea', el).forEach(i => {
    i.removeAttribute('required');
    i.classList.remove('error');
  });
  $$('[id$="_error"]', el).forEach(e => { e.hidden = true; e.textContent = ''; });
}

function applyConditionalFields() {
  const tipo = $('input[name="tipo_cliente"]:checked')?.value;
  const scopo = $('input[name="scopo_servizio"]:checked')?.value;

  state.tipoCliente = tipo;
  state.scopoServizio = scopo;

  // 1. Tipo Cliente logic
  if (tipo === 'Persona fisica') {
    PERSONA_FIELDS.forEach(showField);
    ENTITY_FIELDS.forEach(hideField);

    $('#nome_cognome')?.setAttribute('required', '');
    $('#residenza')?.setAttribute('required', '');

    $('#ragione_sociale')?.removeAttribute('required');
    $('#sede_legale')?.removeAttribute('required');
    $('#legale_rappresentante')?.removeAttribute('required');
    $('#qualifica_firmatario')?.removeAttribute('required');
  } else if (tipo) {
    // Azienda / Associazione
    ENTITY_FIELDS.forEach(showField);
    PERSONA_FIELDS.forEach(hideField);

    $('#ragione_sociale')?.setAttribute('required', '');
    $('#sede_legale')?.setAttribute('required', '');
    $('#legale_rappresentante')?.setAttribute('required', '');
    $('#qualifica_firmatario')?.setAttribute('required', '');

    $('#nome_cognome')?.removeAttribute('required');
    $('#residenza')?.removeAttribute('required');
  }

  // 2. Scopo Servizio logic
  if (scopo === 'Professionale / Imprenditoriale') {
    PROFESSIONAL_FIELDS.forEach(showField);
    $('#partita_iva')?.setAttribute('required', '');
  } else {
    // Consumatore privato
    PROFESSIONAL_FIELDS.forEach(hideField);
    $('#partita_iva')?.removeAttribute('required');
    $('#codice_sdi')?.removeAttribute('required');
    $('#pec_fatturazione')?.removeAttribute('required');
  }

  updateEmailSubject();
  updateSummary();
  updateProgress();

  // Clear radio errors if checked
  if (tipo) {
    const errTipo = $('#tipo_cliente_error');
    if (errTipo) errTipo.hidden = true;
  }
  if (scopo) {
    const errScopo = $('#scopo_servizio_error');
    if (errScopo) errScopo.hidden = true;
  }
}

function initConditionalFields() {
  const radiosTipo = $$('input[name="tipo_cliente"]');
  const radiosScopo = $$('input[name="scopo_servizio"]');

  radiosTipo.forEach(radio => {
    radio.addEventListener('change', applyConditionalFields);
  });

  radiosScopo.forEach(radio => {
    radio.addEventListener('change', applyConditionalFields);
  });
}

/* ============================================================
   6. FORM PROGRESS / COMPLETION TRACKER
   ============================================================ */

function getRequiredFields() {
  return $$('#clientForm [required]:not([type="hidden"]):not([type="radio"])').filter(el => {
    // Exclude fields inside hidden wrappers
    return !el.closest('.hidden-field');
  });
}

function getFilledRequired() {
  return getRequiredFields().filter(el => {
    if (el.type === 'checkbox') return el.checked;
    return el.value.trim() !== '';
  });
}

function getOptionalFields() {
  return $$('#clientForm input:not([required]):not([type="hidden"]):not([type="radio"]), #clientForm select:not([required]), #clientForm textarea:not([required])').filter(el => {
    return !el.closest('.hidden-field') && el.id !== 'emailSubject';
  });
}

function calculateCompletion() {
  let totalRequired = 0;
  let filledRequired = 0;

  // 1. Radio groups
  totalRequired += 1;
  if ($('input[name="tipo_cliente"]:checked')) filledRequired += 1;

  totalRequired += 1;
  if ($('input[name="scopo_servizio"]:checked')) filledRequired += 1;

  // 2. Normal required fields
  const otherRequired = $$('#clientForm [required]:not([type="hidden"]):not([type="radio"])').filter(el => {
    return !el.closest('.hidden-field');
  });

  totalRequired += otherRequired.length;
  otherRequired.forEach(el => {
    if (el.type === 'checkbox') {
      if (el.checked) filledRequired += 1;
    } else {
      if (el.value.trim() !== '') filledRequired += 1;
    }
  });

  // 3. Conditional Technical Mandate if domain requested
  const domRichiesto = $('#dominio_richiesto')?.value.trim();
  if (domRichiesto) {
    totalRequired += 1;
    if ($('#mandato_tecnico')?.checked) filledRequired += 1;
  }

  // 4. Optional fields (20% weight)
  const optional = $$('#clientForm input:not([required]):not([type="hidden"]):not([type="radio"]), #clientForm select:not([required]), #clientForm textarea:not([required])').filter(el => {
    if (el.closest('.hidden-field')) return false;
    if (el.id === 'emailSubject') return false;
    if (el.id === 'mandato_tecnico' && !domRichiesto) return false;
    return true;
  });

  const filledOptional = optional.filter(el => el.value.trim() !== '');

  const reqScore = totalRequired > 0 ? (filledRequired / totalRequired) * 80 : 80;
  const optScore = optional.length > 0 ? (filledOptional.length / optional.length) * 20 : 0;

  return Math.round(reqScore + optScore);
}

function updateProgress() {
  const pct = calculateCompletion();
  state.completion = pct;

  // Header progress
  if (headerProgressBar) headerProgressBar.style.width = pct + '%';
  if (headerProgressPct) headerProgressPct.textContent = pct + '%';

  // Ring
  if (ringFill) {
    const dash = (pct / 100) * 100;
    ringFill.setAttribute('stroke-dasharray', `${dash}, 100`);
  }
  if (ringPct) ringPct.textContent = pct + '%';
}

function initProgressTracking() {
  form.addEventListener('input', () => {
    updateProgress();
    updateSummary();
  });

  form.addEventListener('change', () => {
    updateProgress();
    updateSummary();
  });
}

/* ============================================================
   7. LIVE SUMMARY SIDEBAR
   ============================================================ */

const SUMMARY_FIELDS = [
  { id: 'nome_cognome',         label: 'Nome' },
  { id: 'ragione_sociale',      label: 'Ragione sociale' },
  { id: 'scopo_servizio',       label: 'Finalità' },
  { id: 'codice_fiscale',       label: 'Cod. fiscale' },
  { id: 'partita_iva',          label: 'Partita IVA' },
  { id: 'email_principale',     label: 'Email' },
  { id: 'telefono',             label: 'Telefono' },
  { id: 'residenza',            label: 'Residenza' },
  { id: 'sede_legale',          label: 'Sede legale' },
  { id: 'legale_rappresentante', label: 'Legale rappr.' },
  { id: 'dominio_richiesto',    label: 'Dominio rich.' },
  { id: 'nome_progetto',        label: 'Progetto' },
  { id: 'piano_progetto',       label: 'Piano richiesto' },
];

function updateSummary() {
  if (!summaryBody) return;

  const rows = SUMMARY_FIELDS
    .map(f => {
      const el = document.getElementById(f.id);
      if (!el || !el.value.trim()) return null;
      // Skip if in hidden wrapper
      if (el.closest('.hidden-field')) return null;
      return { label: f.label, val: el.value.trim() };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    summaryBody.innerHTML = '<div class="summary-empty">I dati inseriti appariranno qui.</div>';
    return;
  }

  summaryBody.innerHTML = rows.map(r => `
    <div class="summary-row">
      <span class="summary-key">${r.label}</span>
      <span class="summary-val">${escapeHtml(r.val)}</span>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   8. INPUT FORMATTING
   ============================================================ */

// Codice fiscale: uppercase, only alphanumeric
function formatCodiceFiscale(el) {
  el.addEventListener('input', () => {
    const v = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    el.value = v.slice(0, 16);
  });
}

// Partita IVA: only digits
function formatPartitaIva(el) {
  el.addEventListener('input', () => {
    el.value = el.value.replace(/\D/g, '').slice(0, 11);
  });
}

// Telefono: keep + and digits and spaces
function formatTelefono(el) {
  el.addEventListener('input', () => {
    let v = el.value.replace(/[^\d+\s\-\(\)]/g, '');
    el.value = v;
  });
}

// Textarea autosize
function autosizeTextarea(el) {
  el.addEventListener('input', () => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 400) + 'px';
  });
}

function initFormatting() {
  const cf = document.getElementById('codice_fiscale');
  if (cf) formatCodiceFiscale(cf);

  const piva = document.getElementById('partita_iva');
  if (piva) formatPartitaIva(piva);

  const tel = document.getElementById('telefono');
  if (tel) formatTelefono(tel);

  const tel2 = document.getElementById('secondo_telefono');
  if (tel2) formatTelefono(tel2);

  const note = document.getElementById('note');
  if (note) autosizeTextarea(note);
}

/* ============================================================
   9. VALIDATION
   ============================================================ */

const VALIDATORS = {
  email_principale: { fn: isValidEmail, msg: 'Inserisci un indirizzo email valido.' },
  pec:              { fn: v => !v || isValidEmail(v), msg: 'Inserisci un indirizzo PEC valido.' },
  pec_fatturazione: { fn: v => !v || isValidEmail(v), msg: 'Inserisci un indirizzo PEC valido.' },
  email_backup:     { fn: v => !v || isValidEmail(v), msg: 'Inserisci un indirizzo email valido.' },
  email_admin:      { fn: v => !v || isValidEmail(v), msg: 'Inserisci un indirizzo email valido.' },
  codice_fiscale:   { fn: isValidCF, msg: 'Il codice fiscale non è nel formato corretto (16 caratteri).' },
  partita_iva:      { fn: v => !v || isValidPIVA(v), msg: 'La partita IVA deve contenere 11 cifre.' },
  codice_sdi:       { fn: v => !v || isValidSDI(v), msg: 'Il codice SDI deve essere di 7 caratteri alfanumerici.' },
  telefono:         { fn: isValidPhone, msg: 'Inserisci un numero di telefono valido.' },
  secondo_telefono: { fn: v => !v || isValidPhone(v), msg: 'Inserisci un numero di telefono valido.' },
  sito_esistente:   { fn: v => !v || isValidUrl(v), msg: 'Inserisci un URL valido (es. https://www.sito.it).' },
};

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function isValidCF(v) {
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i.test(v.trim());
}

function isValidPIVA(v) {
  return /^\d{11}$/.test(v.trim());
}

function isValidSDI(v) {
  return /^[A-Z0-9]{7}$/i.test(v.trim());
}

function isValidPhone(v) {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(v.trim());
}

function isValidUrl(v) {
  try {
    const trimmed = v.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      new URL('https://' + trimmed);
    } else {
      new URL(trimmed);
    }
    return true;
  } catch {
    return false;
  }
}

function validateField(el) {
  const id = el.id;
  const errEl = document.getElementById(id + '_error');
  let errorMsg = '';

  // Required check
  if (el.hasAttribute('required') && !el.closest('.hidden-field')) {
    if (el.type === 'checkbox' && !el.checked) {
      errorMsg = 'Questo consenso è obbligatorio.';
    } else if (!el.value.trim()) {
      errorMsg = 'Questo campo è obbligatorio.';
    }
  }

  // Custom validators
  if (!errorMsg && el.value.trim() && VALIDATORS[id]) {
    const { fn, msg } = VALIDATORS[id];
    if (!fn(el.value)) errorMsg = msg;
  }

  // Apply error state only if submitted
  if (state.wasSubmitted) {
    el.classList.toggle('error', !!errorMsg);
    if (errEl) {
      errEl.hidden = !errorMsg;
      errEl.textContent = errorMsg;
    }
  } else {
    el.classList.remove('error');
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
  }

  return errorMsg;
}

function validateAll() {
  const errors = [];
  const fieldsToValidate = [
    ...getRequiredFields(),
    ...$$('#clientForm input:not([required]):not([type="hidden"]):not([type="radio"]), #clientForm select:not([required])')
      .filter(el => el.value.trim() && !el.closest('.hidden-field') && VALIDATORS[el.id]),
  ];

  const unique = [...new Set(fieldsToValidate)];

  unique.forEach(el => {
    const msg = validateField(el);
    if (msg) errors.push({ label: getLabelText(el), msg });
  });

  // Radio validations
  const tipoSelected = $('input[name="tipo_cliente"]:checked');
  if (!tipoSelected) {
    errors.push({ label: 'Tipo di cliente', msg: 'Seleziona il tipo di cliente.' });
    const errEl = $('#tipo_cliente_error');
    if (errEl) { errEl.hidden = false; errEl.textContent = 'Seleziona il tipo di cliente.'; }
  } else {
    const errEl = $('#tipo_cliente_error');
    if (errEl) { errEl.hidden = true; }
  }

  const scopoSelected = $('input[name="scopo_servizio"]:checked');
  if (!scopoSelected) {
    errors.push({ label: 'Scopo del servizio', msg: 'Seleziona lo scopo del servizio.' });
    const errEl = $('#scopo_servizio_error');
    if (errEl) { errEl.hidden = false; errEl.textContent = 'Seleziona la finalità del servizio.'; }
  } else {
    const errEl = $('#scopo_servizio_error');
    if (errEl) { errEl.hidden = true; }
  }

  // B2B Billing PEC/SDI logic
  const scopo = scopoSelected?.value;
  if (scopo === 'Professionale / Imprenditoriale') {
    const sdiVal = $('#codice_sdi')?.value.trim();
    const pecFattVal = $('#pec_fatturazione')?.value.trim();
    if (!sdiVal && !pecFattVal) {
      errors.push({ label: 'Fatturazione Elettronica', msg: 'Inserisci il Codice SDI o la PEC di fatturazione.' });
      $('#codice_sdi')?.classList.add('error');
      $('#pec_fatturazione')?.classList.add('error');
      const errSdi = $('#codice_sdi_error');
      if (errSdi) { errSdi.hidden = false; errSdi.textContent = 'Inserisci il Codice SDI o la PEC per fatturazione elettronica.'; }
    }
  }

  // Technical mandate conditional requirement
  const domRichiesto = $('#dominio_richiesto')?.value.trim();
  const mandatoChecked = $('#mandato_tecnico')?.checked;
  if (domRichiesto && !mandatoChecked) {
    errors.push({ label: 'Mandato tecnico', msg: 'L\'autorizzazione alla gestione del dominio è richiesta se desideri registrare un dominio.' });
    $('#mandato_tecnico')?.classList.add('error');
    const errMandato = $('#mandato_tecnico_error');
    if (errMandato) { errMandato.hidden = false; errMandato.textContent = 'L\'autorizzazione è obbligatoria per registrare il dominio.'; }
  }

  return errors;
}

function getLabelText(el) {
  const label = document.querySelector(`label[for="${el.id}"]`);
  if (!label) return el.name || el.id;
  // Clean up label text (remove required mark etc.)
  return label.textContent.replace(/[*✱]/g, '').trim().split('\n')[0].trim();
}

function showValidationSummary(errors) {
  validationSummary.hidden = errors.length === 0;
  validationList.innerHTML = errors.map(e => `<li>${escapeHtml(e.label)}: ${escapeHtml(e.msg)}</li>`).join('');
}

// Inline validation on blur
function initInlineValidation() {
  $$('#clientForm input, #clientForm select, #clientForm textarea').forEach(el => {
    el.addEventListener('blur', () => {
      if (el.type !== 'radio' && el.type !== 'hidden') {
        validateField(el);
        updateProgress();
      }
    });

    // Clear error on focus, input, and change events
    const clearError = () => {
      el.classList.remove('error');
      const errEl = document.getElementById(el.id + '_error');
      if (errEl) { errEl.hidden = true; }
    };

    el.addEventListener('focus', clearError);
    el.addEventListener('input', clearError);
    el.addEventListener('change', clearError);
  });
}

/* ============================================================
   10. EMAIL BODY BUILDER
   ============================================================ */

function val(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.closest('.hidden-field')) return null;
  return el.value.trim() || null;
}

function checkVal(id) {
  const el = document.getElementById(id);
  return el && el.checked ? 'Confermato ✓' : 'Non confermato';
}

function tipoChecked() {
  const r = $('input[name="tipo_cliente"]:checked');
  return r ? r.value : null;
}

function buildEmailBody() {
  const tipo = tipoChecked();
  const scopo = $('input[name="scopo_servizio"]:checked')?.value;
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const section = (title, rows) => {
    const filteredRows = rows.filter(r => r[1]);
    if (filteredRows.length === 0) return '';
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${filteredRows.map(r => `• ${r[0]}: ${r[1]}`).join('\n')}
`;
  };

  const isPersona = tipo === 'Persona fisica';

  let body = `
╔══════════════════════════════════════╗
  NUOVA SCHEDA CLIENTE — AZZA STUDIO
╚══════════════════════════════════════╝

${section('A — TIPO CLIENTE E FINALITÀ', [
    ['Categoria cliente', tipo],
    ['Finalità / Scopo', scopo],
  ])}

${section('B — DATI ANAGRAFICI E IDENTIFICATIVI', [
    ['Nome e cognome',        isPersona ? val('nome_cognome') : null],
    ['Ragione sociale',       !isPersona ? val('ragione_sociale') : null],
    ['Legale rappresentante', !isPersona ? val('legale_rappresentante') : null],
    ['Qualifica firmatario',  !isPersona ? val('qualifica_firmatario') : null],
    ['Codice fiscale',        val('codice_fiscale')],
    ['Partita IVA',           val('partita_iva')],
    ['Residenza',             isPersona ? val('residenza') : null],
    ['Sede legale',           !isPersona ? val('sede_legale') : null],
    ['Email principale',      val('email_principale')],
    ['Telefono',              val('telefono')],
    ['PEC principale',        val('pec')],
    ['Data di nascita',       isPersona ? val('data_nascita') : null],
    ['Documento identità',        val('tipo_documento')],
    ['Numero documento',          val('numero_documento')],
  ])}

${section('C — DATI DI FATTURAZIONE', [
    ['Indirizzo fatturazione',   val('indirizzo_fatturazione')],
    ['Codice SDI',               val('codice_sdi')],
    ['PEC di fatturazione',      val('pec_fatturazione')],
  ])}

${section('D — DOMINIO E HOSTING', [
    ['Nome del brand / progetto', val('nome_progetto')],
    ['Piano richiesto',           val('piano_progetto')],
    ['Sito web esistente',        val('sito_esistente')],
    ['Dominio richiesto',         val('dominio_richiesto')],
    ['Intestatario dominio',      val('intestatario_dominio')],
    ['Email backup amministr.',   val('email_backup')],
    ['Secondo telefono',          val('secondo_telefono')],
    ['Instagram / social',        val('social')],
    ['Referente operativo',       !isPersona ? val('contatto_interno') : null],
    ['Note aggiuntive',           val('note')],
    ['Mandato tecnico',           checkVal('mandato_tecnico')],
  ])}

${section('E — CONFERMA E CONSENSI', [
    ['Veridicità dati',         checkVal('consenso_veridicita')],
    ['Informativa Privacy',     checkVal('consenso_privacy')],
    ['Condizioni & Clausole',   checkVal('consenso_condizioni')],
  ])}

${section('METADATA INVIO', [
    ['Data',     dateStr],
    ['Ora',      timeStr],
    ['Browser',  navigator.userAgent],
    ['Lingua',   navigator.language],
    ['URL',      window.location.href],
  ])}
`;

  return body.trim();
}

function updateEmailSubject() {
  const subjectEl = document.getElementById('emailSubject');
  if (!subjectEl) return;
  const tipo = tipoChecked();
  const nome = tipo === 'Persona fisica'
    ? val('nome_cognome')
    : val('ragione_sociale');
  subjectEl.value = nome
    ? `Nuova scheda cliente — ${nome}`
    : 'Nuova scheda cliente — Azza Studio';
}

/* ============================================================
   11. FORM SUBMIT (Web3Forms)
   ============================================================ */

/**
 * Web3Forms API endpoint.
 * Non richiede backend. Invio gratuito.
 * Documentazione: https://docs.web3forms.com
 */
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

async function handleSubmit(e) {
  e.preventDefault();
  if (state.submitting) return;

  state.wasSubmitted = true;

  // Validate
  const errors = validateAll();
  showValidationSummary(errors);

  if (errors.length > 0) {
    // Scroll to summary
    validationSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Hide validation summary
  validationSummary.hidden = true;

  setLoading(true);

  try {
    // Build form data
    const fd = new FormData();
    // NOTA: La chiave viene letta direttamente dall'input hidden in index.html (YOUR_ACCESS_KEY_HERE)
    fd.append('access_key', $('input[name="access_key"]').value);
    fd.append('subject', document.getElementById('emailSubject').value);
    fd.append('from_name', 'Azza Studio — Form Clienti');
    fd.append('botcheck', '');

    // Append the full structured body as a single text field
    fd.append('message', buildEmailBody());

    // Also append individual fields for Web3Forms dashboard readability
    appendIndividualFields(fd);

    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();

    if (data.success) {
      showSuccess();
    } else {
      throw new Error(data.message || 'Errore di invio');
    }

  } catch (err) {
    console.error('Submit error:', err);
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function appendIndividualFields(fd) {
  const fields = [
    'tipo_cliente', 'scopo_servizio', 'nome_cognome', 'ragione_sociale',
    'legale_rappresentante', 'qualifica_firmatario', 'codice_fiscale', 'partita_iva',
    'residenza', 'sede_legale', 'email_principale', 'telefono', 'pec',
    'data_nascita', 'tipo_documento', 'numero_documento',
    'indirizzo_fatturazione', 'codice_sdi', 'pec_fatturazione',
    'nome_progetto', 'piano_progetto', 'sito_esistente', 'dominio_richiesto', 'intestatario_dominio',
    'email_backup', 'secondo_telefono', 'social', 'contatto_interno', 'note',
  ];

  const tipoR = $('input[name="tipo_cliente"]:checked');
  if (tipoR) fd.append('tipo_cliente', tipoR.value);

  const scopoR = $('input[name="scopo_servizio"]:checked');
  if (scopoR) fd.append('scopo_servizio', scopoR.value);

  fields.slice(2).forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value.trim() && !el.closest('.hidden-field')) {
      fd.append(id, el.value.trim());
    }
  });
}

/* ============================================================
   12. UI FEEDBACK
   ============================================================ */

function setLoading(on) {
  state.submitting = on;
  submitBtn.classList.toggle('loading', on);
  submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
}

function showSuccess() {
  const nome = val('nome_cognome') || val('ragione_sociale') || 'Cliente';
  const now = new Date();

  if (successMeta) {
    successMeta.innerHTML = `
      Inviato il ${now.toLocaleDateString('it-IT')} alle ${now.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}
    `;
  }

  successOverlay.hidden = false;
  document.body.style.overflow = 'hidden';

  // Animate success circle and check
  setTimeout(() => {
    const fill = $('.success-circle-fill');
    const check = $('.success-check');
    if (fill) fill.style.strokeDashoffset = '0';
    if (check) check.style.strokeDashoffset = '0';
  }, 100);
}

function showError(msg) {
  // Show inline error above submit
  const existingErr = $('#submitError');
  if (existingErr) existingErr.remove();

  const errDiv = document.createElement('div');
  errDiv.id = 'submitError';
  errDiv.className = 'validation-summary';
  errDiv.setAttribute('role', 'alert');
  errDiv.innerHTML = `
    <div class="vs-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>
    <div class="vs-content">
      <p class="vs-title">Si è verificato un errore durante l'invio.</p>
      <p style="font-size:0.78rem;color:rgba(255,120,100,0.8);line-height:1.6;">
        ${escapeHtml(msg || 'Riprova tra qualche istante o contattaci direttamente a azzastudio@proton.me')}
      </p>
    </div>
  `;

  submitBtn.parentElement.insertBefore(errDiv, submitBtn);
  errDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ============================================================
   13. MISC
   ============================================================ */

// Current year in footer
function initYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
}

// Back to top
function initBackToTop() {
  if (!backToTop) return;
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Smooth scroll for .scroll-to links
function initScrollTo() {
  $$('.scroll-to').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Hero subtle parallax on mouse move
function initHeroParallax() {
  const heroGlow = $('.hero-glow');
  if (!heroGlow) return;

  document.addEventListener('mousemove', (e) => {
    const xPct = (e.clientX / window.innerWidth - 0.5) * 30;
    const yPct = (e.clientY / window.innerHeight - 0.5) * 20;
    heroGlow.style.transform = `translateX(calc(-50% + ${xPct}px)) translateY(${yPct}px)`;
  }, { passive: true });
}

// Update email subject as user types name
function initSubjectUpdate() {
  ['nome_cognome', 'ragione_sociale'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateEmailSubject);
  });
}

/* ============================================================
   INIT — DOMContentLoaded
   ============================================================ */

// Init Tooltips dinamici agganciati al body
function initTooltips() {
  const triggers = $$('.info-btn');
  let activeTooltip = null;

  triggers.forEach(trigger => {
    const text = trigger.getAttribute('data-help');
    if (!text) return;

    const show = () => {
      if (activeTooltip) activeTooltip.remove();

      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.textContent = text;
      document.body.appendChild(tooltip);
      activeTooltip = tooltip;

      const triggerRect = trigger.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      const tooltipWidth = tooltip.offsetWidth;
      const tooltipHeight = tooltip.offsetHeight;

      let top = triggerRect.top + scrollY - tooltipHeight - 10;
      let left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipWidth / 2);

      if (left < 10) {
        left = 10;
      } else if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }

      if (triggerRect.top - tooltipHeight - 15 < 0) {
        top = triggerRect.bottom + scrollY + 10;
        tooltip.classList.add('tooltip-bottom');
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;

      requestAnimationFrame(() => {
        tooltip.classList.add('visible');
      });
    };

    const hide = () => {
      if (activeTooltip) {
        const tooltipToRemove = activeTooltip;
        tooltipToRemove.classList.remove('visible');
        tooltipToRemove.addEventListener('transitionend', () => {
          tooltipToRemove.remove();
        });
        activeTooltip = null;
      }
    };

    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);
  });
}

// Init Mandato tecnico requirement toggle
function initMandatoToggle() {
  const domInput = $('#dominio_richiesto');
  const reqMark = $('.show-mandato-req');
  if (!domInput || !reqMark) return;

  const updateMandatoReq = () => {
    const hasValue = domInput.value.trim() !== '';
    reqMark.style.display = hasValue ? 'inline' : 'none';
  };

  domInput.addEventListener('input', updateMandatoReq);
}

document.addEventListener('DOMContentLoaded', () => {

  // Resolve DOM refs
  form              = document.getElementById('clientForm');
  submitBtn         = document.getElementById('submitBtn');
  validationSummary = document.getElementById('validationSummary');
  validationList    = document.getElementById('validationList');
  successOverlay    = document.getElementById('successOverlay');
  successMeta       = document.getElementById('successMeta');
  headerProgressBar = document.getElementById('headerProgressBar');
  headerProgressPct = document.getElementById('headerProgressPct');
  ringFill          = document.getElementById('ringFill');
  ringPct           = document.getElementById('ringPct');
  summaryBody       = document.getElementById('summaryBody');
  backToTop         = document.getElementById('backToTop');
  currentYear       = document.getElementById('currentYear');

  // Init modules
  initHeader();
  initReveal();
  initSectionIndex();
  initConditionalFields();
  initProgressTracking();
  initInlineValidation();
  initFormatting();
  initYear();
  initBackToTop();
  initScrollTo();
  initHeroParallax();
  initSubjectUpdate();
  initTooltips();
  initMandatoToggle();

  // Form submit
  if (form) form.addEventListener('submit', handleSubmit);

  // Initial progress and field state
  applyConditionalFields();
  updateProgress();
  updateSummary();

  // Trigger reveal for elements already in viewport
  setTimeout(initReveal, 50);
});
