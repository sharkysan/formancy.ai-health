// The demo's referral (0012): the synthetic form the demo at
// formancy.ai/health/ starts from, the answers it starts with, and what a
// synthetic host says of them -- the Questionnaire it publishes, the
// response, and the CH ORF document that carries the response. The
// validator gate judges what the packages, as built, make of it
// (scripts/validator/corpus.mjs), and the demo's build hands the same
// data to the page, so that what the page shows before anything is
// changed is what the gate judged.
//
// Plain data, and nothing else: every value is one JSON carries as it is,
// since the demo's build writes it into the page as JSON. No function, no
// FhirNumber, nothing made here: the corpus and the page each call the
// packages with it.
//
// Everything is made up. The patient, the practitioner and the practice
// are the corpus's own (`CH_ORF_PEOPLE`, scripts/validator/ch-orf.mjs),
// under names of this document's own, with no AHV number at all; the
// Composition's type and category are HL7's codes, as every CH ORF
// document here has them (`CH_ORF_CODES`), so no SNOMED CT code is written
// (scripts/terminology.test.mjs). No field asks for an identifier: the
// phone is the practice's, and its answer is noughts. Nothing is clinical:
// one rule shows a field when a box is ticked, and nothing computes,
// scores, warns or suggests (CLAUDE.md, "No clinical logic").
//
// Written in Swiss German and translated into French, Italian and English,
// the four languages the demo is in. The options of the patient's language
// name each language in its own words, the same in every catalogue: a
// plain string would have no translation at all, and health-questionnaire
// refuses a text missing in a language the host asks for.

import { CH_ORF_CODES, CH_ORF_PEOPLE } from './ch-orf.mjs'

/** The languages the demo's form is written in, its default first, as BCP 47 tags in their canonical case. */
export const DEMO_LANGUAGES = ['de-CH', 'fr', 'it', 'en']

/** Each language the patient may speak, by its own name. */
const ENDONYMS = { de: 'Deutsch', fr: 'Français', it: 'Italiano', en: 'English' }

/** A message id's text in each of `DEMO_LANGUAGES`, in its order. */
const words = {
  'question.label': ['Fragestellung an die Fachperson', 'Question au spécialiste', 'Quesito per lo specialista', 'Question for the specialist'],
  'specialty.label': ['Fachgebiet', 'Spécialité', 'Specialità', 'Specialty'],
  'specialty.dermatology': ['Dermatologie', 'Dermatologie', 'Dermatologia', 'Dermatology'],
  'specialty.cardiology': ['Kardiologie', 'Cardiologie', 'Cardiologia', 'Cardiology'],
  'specialty.orthopaedics': ['Orthopädie', 'Orthopédie', 'Ortopedia', 'Orthopaedics'],
  'specialty.ophthalmology': ['Ophthalmologie', 'Ophtalmologie', 'Oftalmologia', 'Ophthalmology'],
  'language.label': [
    'Sprache der Patientin oder des Patienten',
    'Langue de la patiente ou du patient',
    'Lingua della o del paziente',
    "The patient's language",
  ],
  // A language by its own name, in every catalogue.
  ...Object.fromEntries(Object.entries(ENDONYMS).map(([code, name]) => [`language.${code}`, DEMO_LANGUAGES.map(() => name)])),
  'interpreter.label': ['Dolmetschen nötig', 'Interprète nécessaire', 'Interprete necessario', 'An interpreter is needed'],
  'interpreter_language.label': ['Sprache für das Dolmetschen', "Langue d'interprétation", "Lingua dell'interpretariato", 'Language to interpret'],
  'available_from.label': ['Termin möglich ab', 'Rendez-vous possible dès le', 'Appuntamento possibile dal', 'Appointment possible from'],
  'contact_phone.label': [
    'Telefon der Praxis für Rückfragen',
    'Téléphone du cabinet pour les questions',
    'Telefono dello studio per domande',
    'Practice phone for questions',
  ],
}

const t = (id) => ({ $t: id })
const option = (value, id) => ({ value, label: t(id) })

/**
 * The referral, in spec 4: a question for the specialist, the specialty,
 * the patient's language, whether an interpreter is needed and for which
 * language, when an appointment is possible, and the practice's phone.
 * No `page` field, so that formancy draws it as one form, not as a
 * wizard of one step.
 */
export const demoReferral = {
  specVersion: '4',
  id: 'demo-referral',
  title: 'Zuweisung',
  model: {
    fields: [
      { key: 'question', type: 'textarea', label: t('question.label'), required: true, maxLength: 2000 },
      {
        key: 'specialty',
        type: 'select',
        label: t('specialty.label'),
        required: true,
        options: [
          option('dermatology', 'specialty.dermatology'),
          option('cardiology', 'specialty.cardiology'),
          option('orthopaedics', 'specialty.orthopaedics'),
          option('ophthalmology', 'specialty.ophthalmology'),
        ],
      },
      {
        key: 'language',
        type: 'radio',
        label: t('language.label'),
        options: [option('de', 'language.de'), option('fr', 'language.fr'), option('it', 'language.it'), option('en', 'language.en')],
      },
      { key: 'interpreter', type: 'checkbox', label: t('interpreter.label') },
      { key: 'interpreter_language', type: 'text', label: t('interpreter_language.label'), maxLength: 80 },
      { key: 'available_from', type: 'date', label: t('available_from.label'), earliest: '2026-01-01' },
      { key: 'contact_phone', type: 'text', label: t('contact_phone.label'), maxLength: 40 },
    ],
  },
  logic: { rules: [{ target: 'interpreter_language', kind: 'visible', cel: 'interpreter == true' }] },
  i18n: {
    defaultLocale: 'de-CH',
    messages: Object.fromEntries(
      DEMO_LANGUAGES.map((language, index) => [language, Object.fromEntries(Object.entries(words).map(([id, texts]) => [id, texts[index]]))]),
    ),
  },
}

/** What the host says of the referral form: published as version 1, active, in the demo's four languages. */
export const demoReferralContext = { base: 'https://forms.synthetic.invalid', version: '1', status: 'active', languages: DEMO_LANGUAGES }

/**
 * The answers the demo starts with, as formancy's engine holds them
 * (`engine.value()`): every question answered, the interpreter's language
 * shown by the ticked box.
 */
export const demoReferralAnswers = {
  question: 'Synthetische Fragestellung, ohne klinische Bedeutung',
  specialty: 'dermatology',
  language: 'fr',
  interpreter: true,
  interpreter_language: 'Französisch',
  available_from: '2026-11-02',
  contact_phone: '000 000 00 00',
}

/**
 * Each entry's name in the demo's CH ORF document, and the document's
 * identifier: lowercase urn:uuids of the demo's own, since a document's
 * identifier "is never re-used".
 */
export const DEMO_NAMES = {
  document: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e00',
  composition: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e01',
  patient: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e02',
  response: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e03',
  serviceRequest: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e04',
  role: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e05',
  practitioner: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e06',
  organization: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e07',
  order: 'urn:uuid:d3a1e5c2-7b4f-4c9e-a6d8-2f1b3c4d5e10',
}

/**
 * What the host says of the answers: completed, of the patient, written
 * down by the author's role, given by the patient, at a time the host's
 * clock gave. The CH ORF profile the response claims is not here: it is
 * health-ch's constant, which the corpus and the page each add.
 */
export const demoResponseContext = {
  questionnaire: demoReferralContext,
  status: 'completed',
  authored: '2026-10-17T10:00:00+02:00',
  subject: { reference: DEMO_NAMES.patient },
  author: { reference: DEMO_NAMES.role },
  source: { reference: DEMO_NAMES.patient },
}

/**
 * What the host says of the referral, everything a CH ORF document of
 * health-ch's holds but the answers, which the caller adds under
 * `DEMO_NAMES.response`: a routine order of the corpus's practitioner,
 * for the corpus's patient.
 */
export const demoChOrfContext = {
  identifier: DEMO_NAMES.document,
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: {
    fullUrl: DEMO_NAMES.composition,
    status: 'final',
    ...CH_ORF_CODES,
    date: '2026-10-17T10:00:00+02:00',
    title: 'Zuweisung',
    sectionTitle: 'Auftrag',
  },
  patient: { fullUrl: DEMO_NAMES.patient, ...CH_ORF_PEOPLE.patient },
  author: {
    fullUrl: DEMO_NAMES.role,
    practitioner: { fullUrl: DEMO_NAMES.practitioner, ...CH_ORF_PEOPLE.practitioner },
    organization: { fullUrl: DEMO_NAMES.organization, ...CH_ORF_PEOPLE.organization },
  },
  serviceRequests: [
    {
      fullUrl: DEMO_NAMES.serviceRequest,
      placer: { system: 'urn:ietf:rfc:3986', value: DEMO_NAMES.order },
      status: 'active',
      intent: 'order',
      priority: 'routine',
      authoredOn: '2026-10-17T10:00:00+02:00',
    },
  ],
}
