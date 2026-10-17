/**
 * A referral letter, in Swiss German, as a Formancy Report 0.1.0
 * definition, and the data a host would resolve it with: what the corpus
 * renders a PDF from (0008).
 *
 * Everything is made up. The patient, the practitioner and the clinic are
 * invented, the dates arbitrary, the text says it means nothing, and
 * nothing in the report computes, scores or suggests: it prints what the
 * data says, and no clinical logic (CLAUDE.md). It reads one header
 * record -- who is referred, by whom, to whom, when and why -- and a
 * detail list of what the letter says under each heading, printed as a
 * table, with a page header, a page footer that counts the pages, and a
 * closing line.
 */
import type { ReportData, ResolveOptions } from '@formancy/report-runtime'
import type { ReportDefinition } from '@formancy/report-spec'

const header = (field: string) => ({ kind: 'field', field: { dataset: 'header', field } }) as const
const detail = (field: string) => ({ kind: 'field', field: { dataset: 'detail', field } }) as const
const words = (text: string) => ({ kind: 'text', text }) as const

/** 20 mm, in the points a report stores, rounded to the hundredth as report-spec's mmToPt rounds it. */
const MARGIN = 56.69

export const REFERRAL_REPORT: ReportDefinition = {
  reportSpecVersion: '0',
  id: 'zuweisung',
  title: 'Zuweisung',
  locale: 'de-CH',
  page: { size: 'A4', orientation: 'portrait', margins: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
  styles: [
    { id: 'title', size: 16, bold: true },
    { id: 'heading', size: 11, bold: true },
    { id: 'small', size: 8, color: '#555555' },
  ],
  datasets: {
    header: {
      id: 'referral',
      fields: [
        { id: 'patient', type: 'string', label: 'Patientin', nullable: false },
        { id: 'born', type: 'date', label: 'Geburtsdatum', nullable: false },
        { id: 'referrer', type: 'string', label: 'Zuweisend', nullable: false },
        { id: 'recipient', type: 'string', label: 'Empfänger', nullable: false },
        { id: 'referredOn', type: 'date', label: 'Datum', nullable: false },
        { id: 'question', type: 'string', label: 'Fragestellung', nullable: false },
      ],
    },
    detail: {
      id: 'sections',
      fields: [
        { id: 'topic', type: 'string', label: 'Thema', nullable: false },
        { id: 'note', type: 'string', label: 'Angaben', nullable: false },
      ],
    },
  },
  parameters: [],
  assets: [],
  aggregates: [],
  regions: {
    reportHeader: [
      { id: 'title', kind: 'text', style: 'title', content: [words('Zuweisung')] },
      { id: 'recipient', kind: 'text', content: [words('An: '), header('recipient')] },
      { id: 'referrer', kind: 'text', content: [words('Von: '), header('referrer')] },
      { id: 'referred-on', kind: 'text', content: [words('Datum: '), { ...header('referredOn'), format: { kind: 'date', style: 'long' } }] },
      { id: 'header-gap', kind: 'spacer', height: 12 },
    ],
    pageHeader: [{ id: 'page-header', kind: 'text', style: 'small', content: [words('Zuweisung - synthetisches Beispiel, ohne klinische Bedeutung')] }],
    body: [
      { id: 'patient', kind: 'text', content: [words('Patientin: '), header('patient'), words(', geboren am '), { ...header('born'), format: { kind: 'date', style: 'medium' } }] },
      { id: 'question-heading', kind: 'text', style: 'heading', keepWithNext: true, content: [words('Fragestellung')] },
      { id: 'question', kind: 'text', content: [header('question')] },
      {
        id: 'sections',
        kind: 'table',
        dataset: 'detail',
        columns: [
          { id: 'topic', header: 'Thema', width: 120, align: 'left', value: detail('topic') },
          { id: 'note', header: 'Angaben', width: 'fill', align: 'left', value: detail('note') },
        ],
        emptyText: 'Keine Angaben',
        repeatHeader: true,
      },
    ],
    pageFooter: [{ id: 'page-footer', kind: 'text', style: 'small', content: [words('Seite '), { kind: 'pageNumber' }, words(' von '), { kind: 'pageCount' }] }],
    summary: [{ id: 'closing', kind: 'text', content: [words('Freundliche Grüsse, '), header('referrer')] }],
  },
  provenance: { kind: 'blank' },
}

/** The referral's data, as a host captured it: one header record, a detail row per heading, all of it. */
export const REFERRAL_DATA: ReportData = {
  header: {
    patient: 'Synthetica Beispiel',
    born: '1980-02-29',
    referrer: 'Dr. med. Probus Muster',
    recipient: 'Synthetische Klinik, Ambulatorium',
    referredOn: '2026-10-17',
    question: 'Synthetische Fragestellung: die Abklärung eines erfundenen Befunds.',
  },
  detail: [
    { topic: 'Anamnese', note: 'Synthetische Angaben, ohne klinische Bedeutung.' },
    { topic: 'Befunde', note: 'Keine; dieser Text ist erfunden.' },
    { topic: 'Beilagen', note: 'Keine.' },
  ],
  completeness: { complete: true, captured: 3 },
  consistency: 'host-captured',
}

/**
 * How the host resolves it: a final render, its creation date fixed, so
 * that the same report and data print the same PDF, and its zone named,
 * never the machine's.
 */
export const REFERRAL_OPTIONS: ResolveOptions = { mode: 'final', creationDate: '2026-10-17T08:00:00Z', timeZone: 'Europe/Zurich' }

/** The most pages the letter may take: it takes one, and a render that needs more is refused, never cut short. */
export const REFERRAL_MAX_PAGES = 2
