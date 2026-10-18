/** The page in English. */
import type { Words } from './index.js'

export const en = {
  name: 'English',
  language: 'Language',
  skip: 'Skip to the demo',
  title: 'Formancy Health – Demo',
  lead: 'Formancy Health exports formancy forms, a person’s answers to them and the PDFs Formancy Report renders as resources of the HL7® FHIR® standard, shaped to a country’s profiles: so far, Switzerland’s CH Core and CH ORF. Here it runs in your browser, on a synthetic referral.',
  banner:
    'This demo runs on synthetic data, and real patient data does not belong in it. What you type is turned into FHIR resources here, in your browser: this page sends it nowhere and keeps none of it, so reloading or closing the page loses your answers.',
  formancy: { 'form.submit': 'To the resources' },
  form: {
    heading: 'The form',
    intro: (formancy) => `A synthetic referral, drawn by formancy’s React renderer ${formancy}. Change an answer, and the resources are made again from what you entered.`,
    sample: 'The sample’s answers, unchanged: every resource shown is an entry of the synthetic corpus that CI’s validator gate judges, byte for byte.',
    changed: 'Changed by you: the QuestionnaireResponse and the CH ORF document are what the packages make of your answers, and nothing has validated them.',
    reset: 'Back to the sample answers',
    made: 'The QuestionnaireResponse and the CH ORF document are made from your answers.',
    refused: (count) => `Your answers are refused (refusals: ${count}), so the CH ORF document is not made.`,
  },
  resources: {
    intro: 'Each resource is made here, in your browser, by the package named with it. A package that refuses says why in English, and this page shows its refusals as they are.',
    show: 'Show the JSON',
    asJson: (resource) => `${resource} as JSON`,
    download: (file) => `Download ${file}`,
    madeBy: (maker) => `Made by ${maker}.`,
    corpus: (file) => `It is the corpus entry ${file}, byte for byte.`,
    refusedBy: (maker) => `Refused by ${maker}:`,
    failed: 'The package failed with an error it does not refuse with, and nothing was made.',
  },
  questionnaire: {
    heading: 'The Questionnaire',
    intro: 'An SDC Questionnaire of the form, in its four languages. It does not depend on the answers.',
  },
  response: {
    heading: 'The answers, as a QuestionnaireResponse',
    intro: 'The answers to that Questionnaire, claiming CH ORF’s profile for a response, as the CH ORF document carries them.',
  },
  document: {
    heading: 'The referral, as a CH ORF document',
    intro:
      'The referral and its answers as a CH ORF document. Its patient, author and order are synthetic and fixed: no field asks for an identifier. It carries the Questionnaire by its canonical, not inside, and no PDF: the letter is a document of its own.',
    notMade: 'Not made: the answers are refused, and a CH ORF document carries them.',
  },
  letter: {
    heading: 'The letter, as a document',
    intro: (report) => `The corpus’s synthetic letter, which Formancy Report ${report} rendered when this page was built. It does not change with your answers; the document Bundle around it is made here, in your browser.`,
    placement: 'Where the PDF’s bytes go',
    data: 'In the DocumentReference’s attachment',
    binary: 'In a Binary beside it',
  },
  refused: {
    heading: 'Refused on purpose',
    intro: 'Fixed inputs, each broken in one way and run here through the package that refuses it. Nothing in them is typed by you, and every refusal is the package’s own.',
    cases: {
      version: { heading: 'A form in a spec version nothing here reads', what: 'The form says it is written in version 5 of formancy’s spec.' },
      unmapped: {
        heading: 'A rule the mapping cannot say',
        what: 'The form shows the language to interpret only when an interpreter is needed and the patient’s language is not German: a != under &&, which an SDC enableWhen cannot say for a question left unanswered.',
      },
      ahv: { heading: 'An AHV number whose check digit is wrong', what: 'The patient carries an AHV number whose last digit is not the one its other digits give.' },
      gln: { heading: 'A GLN whose check digit is wrong', what: 'The practitioner’s GLN ends in a digit its other digits do not give.' },
      unproved: { heading: 'The letter declared PDF/A-2b', what: 'The letter’s PDF is declared PDF/A-2b, which no gate here has proved Formancy Report makes.' },
    },
  },
  about: {
    heading: 'About this demo',
    evaluation: 'This demo is for evaluating the software, not for patient care.',
    purpose: 'Formancy Health says what it is not in one sentence, in English, which this page shows as its rules hold it:',
    conformance: (v) =>
      `What this shows, and what it does not. In CI, the HL7 FHIR validator ${v.validator} checks the resources this code makes of a synthetic test corpus, offline: the Questionnaire against SDC ${v.sdc} on FHIR R4 ${v.r4}; the QuestionnaireResponse against its Questionnaire, SDC ${v.sdc} and CH ORF ${v.chOrf}’s profile for a response, and the CH ORF document against CH ORF ${v.chOrf} and CH Core ${v.chCore}, with CH Term ${v.chTerm}; the letter’s document Bundles against FHIR R4 ${v.r4}. CI’s validator gate fails when the validator finds an error, or a warning its register does not accept with a reason. The sample answers this page starts from are in that corpus, and so is every resource as it is shown before you change anything. What you enter here is not validated: this page runs no validator, and a document made of your input may not conform. Offline, the validator checks codes only against the code systems those packages hold: a LOINC or SNOMED CT code, and a language tag, are not checked. This is not a certification, and not an endorsement by HL7 or HL7 Switzerland.`,
    register: 'The warnings the register accepts, and why',
    affiliation: 'CH Core and CH ORF are implementation guides published by HL7 Switzerland. Formancy Health is not affiliated with, endorsed or certified by HL7, HL7 Switzerland or eHealth Suisse.',
    licence: 'Formancy Health is source-available: free to read, evaluate and develop with, paid in production. It is not open source.',
  },
  footer: { repository: 'The repository', licence: 'The licence', notices: 'Third-party licences and notices' },
  broken: 'The demo stopped with an error, and nothing more is made. Reloading the page starts it again.',
} satisfies Words
