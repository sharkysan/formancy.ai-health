// Synthetic formancy forms, whose Questionnaires the validator gate judges
// (0005, 0006): what `@formancy/health-questionnaire`, as built, writes of
// them is the corpus's package output.
//
// Between them they hold every field type, rule and construct version 1
// maps (plan 8.1), which scripts/validator/corpus.test.mjs derives from
// the package itself and holds the forms to. Everything is made up: no
// person, no clinic, no real code, and no clinical logic -- the one
// computed field joins two names, and nothing scores, warns or suggests.

/** A message id's text in Swiss German, French and Italian. */
const words = {
  'about.label': ['Angaben', 'Informations', 'Informazioni'],
  'given_name.label': ['Vorname', 'Prénom', 'Nome'],
  'family_name.label': ['Nachname', 'Nom', 'Cognome'],
  'full_name.label': ['Vollständiger Name', 'Nom complet', 'Nome completo'],
  'history.label': ['Vorgeschichte', 'Antécédents', 'Anamnesi'],
  'weight.label': ['Gewicht in Kilogramm', 'Poids en kilogrammes', 'Peso in chilogrammi'],
  'weight_note.label': ['Bemerkung zum Gewicht', 'Remarque sur le poids', 'Nota sul peso'],
  'children.label': ['Anzahl Kinder', "Nombre d'enfants", 'Numero di figli'],
  'consent.label': ['Einverstanden', "D'accord", "D'accordo"],
  'consent_detail.label': ['Einzelheiten', 'Détails', 'Dettagli'],
  'canton.label': ['Kanton', 'Canton', 'Cantone'],
  'canton.be': ['Bern', 'Berne', 'Berna'],
  'canton.vs': ['Wallis', 'Valais', 'Vallese'],
  'canton.ti': ['Tessin', 'Tessin', 'Ticino'],
  'canton_detail.label': ['Gemeinde im Tessin', 'Commune au Tessin', 'Comune in Ticino'],
  'urgency.label': ['Dringlichkeit', 'Urgence', 'Urgenza'],
  'urgency.routine': ['Normal', 'Normal', 'Normale'],
  'urgency.urgent': ['Dringend', 'Urgent', 'Urgente'],
  'urgent_reason.label': ['Grund der Dringlichkeit', "Motif de l'urgence", "Motivo dell'urgenza"],
  'topics.label': ['Themen', 'Thèmes', 'Temi'],
  'topics.a': ['Thema A', 'Thème A', 'Tema A'],
  'topics.b': ['Thema B', 'Thème B', 'Tema B'],
  'topics.c': ['Thema C', 'Thème C', 'Tema C'],
  'born.label': ['Geburtsdatum', 'Date de naissance', 'Data di nascita'],
  'arrival.label': ['Ankunftszeit', "Heure d'arrivée", "Ora d'arrivo"],
  'seen.label': ['Gesehen am', 'Vu le', 'Visto il'],
  'notice.label': ['Bitte vollständig ausfüllen.', 'Veuillez remplir entièrement.', 'Si prega di compilare completamente.'],
  'address.label': ['Adresse', 'Adresse', 'Indirizzo'],
  'city.label': ['Ort', 'Localité', 'Località'],
  'contacts.label': ['Kontaktpersonen', 'Personnes de contact', 'Persone di contatto'],
  'contact_name.label': ['Name', 'Nom', 'Nome'],
  'contact_calls.label': ['Anrufe pro Woche', 'Appels par semaine', 'Chiamate a settimana'],
  'contact_page.label': ['Kontakt', 'Contact', 'Contatto'],
  'contact_phone.label': ['Telefon', 'Téléphone', 'Telefono'],
  'history_detail.label': ['Einzelheiten zur Vorgeschichte', 'Détails des antécédents', "Dettagli dell'anamnesi"],
  'children_detail.label': ['Angaben zu den Kindern', 'Précisions sur les enfants', 'Dettagli sui figli'],
  'guardian.label': ['Gesetzliche Vertretung', 'Représentant légal', 'Rappresentante legale'],
  'early_arrival.label': ['Grund der frühen Ankunft', "Motif de l'arrivée matinale", "Motivo dell'arrivo anticipato"],
  'seen_detail.label': ['Bemerkung zum Datum', 'Remarque sur la date', 'Nota sulla data'],
}

const LOCALES = ['de-CH', 'fr', 'it']

/** The catalogues of `words`, one per locale. */
function catalogues() {
  return Object.fromEntries(LOCALES.map((locale, index) => [locale, Object.fromEntries(Object.entries(words).map(([id, texts]) => [id, texts[index]]))]))
}

const t = (id) => ({ $t: id })
const option = (value, id) => ({ value, label: t(id) })

/**
 * A referral intake, in spec 4, written in Swiss German and translated into
 * French and Italian: every field type version 1 maps, a bound of each
 * kind, each rule version 1 maps, each operator and answer type an
 * enableWhen is written with, and a page a skip rule walks past.
 */
export const intake = {
  specVersion: '4',
  id: 'referral-intake',
  title: 'Zuweisung',
  model: {
    fields: [
      {
        key: 'about',
        type: 'page',
        label: t('about.label'),
        fields: [
          { key: 'given_name', type: 'text', label: t('given_name.label'), required: true, minLength: 1, maxLength: 80 },
          { key: 'family_name', type: 'text', label: t('family_name.label'), maxLength: 80 },
          { key: 'full_name', type: 'text', label: t('full_name.label') },
          { key: 'history', type: 'textarea', label: t('history.label'), maxLength: 2000 },
          { key: 'weight', type: 'number', label: t('weight.label'), min: 0.5, max: 300 },
          { key: 'weight_note', type: 'text', label: t('weight_note.label') },
          { key: 'children', type: 'number', label: t('children.label'), step: 1, min: 0, max: 20, widget: 'slider' },
          { key: 'consent', type: 'checkbox', label: t('consent.label') },
          { key: 'canton', type: 'select', label: t('canton.label'), options: [option('BE', 'canton.be'), option('VS', 'canton.vs'), option('TI', 'canton.ti')] },
          { key: 'canton_detail', type: 'text', label: t('canton_detail.label') },
          { key: 'consent_detail', type: 'textarea', label: t('consent_detail.label') },
          { key: 'urgency', type: 'radio', label: t('urgency.label'), required: true, options: [option('routine', 'urgency.routine'), option('urgent', 'urgency.urgent')] },
          { key: 'topics', type: 'selectboxes', label: t('topics.label'), required: true, minItems: 1, maxItems: 2, options: [option('a', 'topics.a'), option('b', 'topics.b'), option('c', 'topics.c')] },
          { key: 'urgent_reason', type: 'textarea', label: t('urgent_reason.label') },
          { key: 'born', type: 'date', label: t('born.label'), earliest: '1900-01-01', latest: '2026-10-17' },
          { key: 'arrival', type: 'time', label: t('arrival.label'), earliest: '07:00', latest: '18:30' },
          { key: 'seen', type: 'datetime', label: t('seen.label'), earliest: '2026-01-01T00:00:00Z' },
          { key: 'campaign', type: 'hidden' },
          { key: 'notice', type: 'static', label: t('notice.label') },
          { key: 'address', type: 'group', label: t('address.label'), fields: [{ key: 'city', type: 'text', label: t('city.label') }] },
          {
            key: 'contacts',
            type: 'repeater',
            label: t('contacts.label'),
            required: true,
            minItems: 1,
            maxItems: 5,
            fields: [
              { key: 'contact_name', type: 'text', label: t('contact_name.label'), required: true },
              { key: 'contact_calls', type: 'number', label: t('contact_calls.label'), step: 1, min: 0, max: 50 },
            ],
          },
          // After every question they read, so that the indices the broken
          // entries name stay where they are: one enableWhen of each answer
          // type and operator the package writes.
          { key: 'history_detail', type: 'textarea', label: t('history_detail.label') },
          { key: 'children_detail', type: 'text', label: t('children_detail.label') },
          { key: 'guardian', type: 'text', label: t('guardian.label') },
          { key: 'early_arrival', type: 'text', label: t('early_arrival.label') },
          { key: 'seen_detail', type: 'text', label: t('seen_detail.label') },
        ],
      },
      { key: 'contact_page', type: 'page', label: t('contact_page.label'), fields: [{ key: 'contact_phone', type: 'text', label: t('contact_phone.label') }] },
    ],
  },
  logic: {
    rules: [
      { target: 'full_name', kind: 'computed', cel: "given_name + ' ' + family_name" },
      { target: 'weight_note', kind: 'visible', cel: 'weight >= 150' },
      { target: 'consent_detail', kind: 'visible', cel: "consent == true && canton != 'VS'" },
      { target: 'canton_detail', kind: 'visible', cel: "canton == 'TI'" },
      { target: 'urgent_reason', kind: 'visible', cel: "urgency == 'urgent' || 'c' in topics" },
      { target: 'contact_page', kind: 'skip', cel: "urgency == 'routine'" },
      { target: 'history_detail', kind: 'visible', cel: "history != 'keine'" },
      { target: 'children_detail', kind: 'visible', cel: 'children > 2' },
      { target: 'guardian', kind: 'visible', cel: "born > '2008-10-17'" },
      { target: 'early_arrival', kind: 'visible', cel: "arrival <= '07:30'" },
      { target: 'seen_detail', kind: 'visible', cel: "seen < '2026-06-01T00:00:00Z'" },
    ],
  },
  i18n: { defaultLocale: 'de-CH', messages: catalogues() },
}

/** What the host says of the intake: published as version 3, active, in three languages. */
export const intakeContext = { base: 'https://forms.synthetic.invalid', version: '3', status: 'active', languages: LOCALES }

/**
 * The same kind of form in spec 1, which every later spec reads: plain
 * strings, no catalogue, not yet published.
 */
export const minimal = {
  specVersion: '1',
  id: 'minimal-v1',
  title: 'Minimal',
  model: {
    fields: [
      { key: 'reason', type: 'text', label: 'Reason', required: true },
      { key: 'weight', type: 'number', label: 'Weight in kilograms' },
      { key: 'consent', type: 'checkbox', label: 'Consent' },
      { key: 'colour', type: 'radio', label: 'Colour', options: [{ value: 'red', label: 'Red' }, { value: 'blue', label: 'Blue' }] },
      { key: 'size', type: 'select', label: 'Size', options: [{ value: 's', label: 'Small' }, { value: 'l', label: 'Large' }] },
      { key: 'born', type: 'date', label: 'Born' },
      { key: 'source', type: 'hidden' },
      { key: 'intro', type: 'static', label: 'A synthetic form.' },
      { key: 'box', type: 'group', label: 'Box', fields: [{ key: 'inside', type: 'text', label: 'Inside' }] },
      { key: 'rows', type: 'repeater', label: 'Rows', fields: [{ key: 'row_note', type: 'textarea', label: 'Note' }] },
      { key: 'last', type: 'page', label: 'Last', fields: [{ key: 'remarks', type: 'textarea', label: 'Remarks' }] },
    ],
  },
}

/** A form never published: no version, a draft. */
export const minimalContext = { base: 'https://forms.synthetic.invalid', status: 'draft' }
