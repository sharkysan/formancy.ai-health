/** The page in Swiss German: Swiss orthography, so no ß, and "Sie", as a form addresses a stranger. */
import type { Words } from './index.js'

export const de = {
  name: 'Deutsch',
  language: 'Sprache',
  skip: 'Zur Demo springen',
  title: 'Formancy Health – Demo',
  lead: 'Formancy Health exportiert formancy-Formulare, die Antworten einer Person darauf und die PDFs von Formancy Report als Ressourcen des HL7® FHIR®-Standards, zugeschnitten auf die Profile eines Landes: bisher CH Core und CH ORF der Schweiz. Hier läuft es in Ihrem Browser, an einer erfundenen Zuweisung.',
  banner:
    'Diese Demo läuft mit erfundenen Daten, und echte Patientendaten gehören nicht hinein. Was Sie eingeben, wird hier in Ihrem Browser in FHIR-Ressourcen umgewandelt: Diese Seite sendet es nirgendwohin und behält nichts davon. Laden Sie die Seite neu oder schliessen Sie sie, sind Ihre Antworten weg.',
  formancy: { 'form.submit': 'Zu den Ressourcen' },
  form: {
    heading: 'Das Formular',
    intro: (formancy) =>
      `Eine erfundene Zuweisung, gezeichnet von formancys React-Renderer ${formancy}. Aus diesem Formular wird der Questionnaire bei den Ressourcen: jedes Feld ein Item, sein Schlüssel dessen linkId. Ändern Sie eine Antwort, und die Ressourcen werden aus Ihrer Eingabe neu erstellt.`,
    sample:
      'Die Antworten des Beispiels, unverändert: Jede gezeigte Ressource ist ein Eintrag des synthetischen Korpus, den das Validator-Gate der CI prüft, Byte für Byte.',
    changed:
      'Von Ihnen geändert: Die QuestionnaireResponse und das CH-ORF-Dokument sind, was die Pakete aus Ihren Antworten machen, und nichts hat sie validiert.',
    reset: 'Zurück zu den Beispielantworten',
    made: 'Die QuestionnaireResponse und das CH-ORF-Dokument sind aus Ihren Antworten erstellt.',
    refused: (count) => `Ihre Antworten werden abgelehnt (Ablehnungen: ${count}), daher ist das CH-ORF-Dokument nicht erstellt.`,
  },
  resources: {
    intro:
      'Jede Ressource wird hier in Ihrem Browser erstellt, von dem Paket, das bei ihr steht. Ein Paket, das ablehnt, sagt auf Englisch, warum, und diese Seite zeigt seine Ablehnungen so, wie sie sind.',
    show: 'JSON anzeigen',
    asJson: (resource) => `${resource} als JSON`,
    download: (file) => `${file} herunterladen`,
    madeBy: (maker) => `Erstellt von ${maker}.`,
    corpus: (file) => `Es ist der Korpuseintrag ${file}, Byte für Byte.`,
    refusedBy: (maker) => `Abgelehnt von ${maker}:`,
    failed: 'Das Paket ist mit einem Fehler gescheitert, mit dem es nicht ablehnt, und nichts wurde erstellt.',
  },
  questionnaire: {
    heading: 'Der Questionnaire',
    intro:
      'Ein SDC-Questionnaire des Formulars: seine Items in den vier Sprachen des Formulars, sein Titel in der einen Sprache, in der das Formular ihn gibt. Er hängt nicht von den Antworten ab.',
  },
  readOut: {
    heading: 'Was der Questionnaire sagt',
    intro:
      'Gelesen aus dem JSON darunter, der Ressource, die health-questionnaire geschrieben hat, nicht aus dem Formular: jedes Item in seiner Reihenfolge und Verschachtelung, sein Text in der Sprache dieser Seite, sein Typ, ob es Pflicht ist oder sich wiederholt, seine Optionen und wann es gezeigt wird. Der Rest steht nur im JSON, darunter, ob ein Item schreibgeschützt oder verborgen ist, seine Länge und Grenzen und wie oft es beantwortet werden darf. Das ist kein FHIR-Renderer und validiert nichts: Formancy Health macht aus formancy-Formularen Questionnaires und zeichnet keinen.',
    title: 'Titel',
    type: 'Typ',
    types: {
      group: 'eine Gruppe von Items',
      display: 'ein Text zum Lesen, ohne Antwort',
      boolean: 'Ja oder Nein',
      decimal: 'eine Zahl',
      integer: 'eine ganze Zahl',
      date: 'ein Datum',
      dateTime: 'ein Datum mit Uhrzeit',
      time: 'eine Uhrzeit',
      string: 'ein kurzer Text',
      text: 'ein längerer Text',
      choice: 'eine Auswahl unter Optionen',
    },
    required: 'Pflicht',
    repeats: 'Wiederholt sich',
    yes: 'Ja',
    no: 'Nein',
    options: 'Optionen',
    shownWhen: 'Gezeigt, wenn',
    joined: { all: 'alle diese Bedingungen gelten:', any: 'mindestens eine dieser Bedingungen gilt:' },
    is: 'ist',
    isNot: 'ist nicht',
    answered: 'ist beantwortet',
    unanswered: 'ist nicht beantwortet',
    numbers: { '>': 'ist grösser als', '<': 'ist kleiner als', '>=': 'ist mindestens', '<=': 'ist höchstens' },
    moments: { '>': 'ist nach', '<': 'ist vor', '>=': 'ist frühestens', '<=': 'ist spätestens' },
    noText: 'Ohne Text',
    untranslated: (language) => `im Questionnaire nicht ins Deutsche übersetzt: sein eigener Text, in ${language}`,
    unnamedLanguage: 'im Questionnaire nicht ins Deutsche übersetzt: sein eigener Text, in einer Sprache, die er nicht nennt',
    toField: 'Zum Feld im Formular',
    toFieldOf: (field) => `Zum Feld im Formular: ${field}`,
    notShown: 'Das Formular zeigt dieses Feld gerade nicht.',
    unread: 'Diese Seite kann den Questionnaire nicht auslesen; sein JSON steht darunter, so wie es geschrieben wurde.',
  },
  response: {
    heading: 'Die Antworten als QuestionnaireResponse',
    intro: 'Die Antworten auf diesen Questionnaire, mit dem Profil von CH ORF für eine Antwort, so wie das CH-ORF-Dokument sie trägt.',
  },
  document: {
    heading: 'Die Zuweisung als CH-ORF-Dokument',
    intro:
      'Die Zuweisung und ihre Antworten als CH-ORF-Dokument. Patientin, Autor und Auftrag sind erfunden und fest: Kein Feld fragt nach einer Kennung. Es trägt den Questionnaire über seinen Canonical, nicht darin, und kein PDF: Der Brief ist ein Dokument für sich.',
    notMade: 'Nicht erstellt: Die Antworten werden abgelehnt, und ein CH-ORF-Dokument trägt sie.',
  },
  letter: {
    heading: 'Der Brief als Dokument',
    intro: (report) =>
      `Der erfundene Brief des Korpus, den Formancy Report ${report} beim Erstellen dieser Seite gerendert hat. Er ändert sich nicht mit Ihren Antworten; das Dokument-Bundle darum wird hier in Ihrem Browser erstellt.`,
    placement: 'Wohin die Bytes des PDF gehen',
    data: 'In den Anhang der DocumentReference',
    binary: 'In ein Binary daneben',
  },
  refused: {
    heading: 'Absichtlich abgelehnt',
    intro:
      'Feste Eingaben, jede auf eine Weise kaputt und hier durch das Paket geführt, das sie ablehnt. Nichts darin haben Sie eingegeben, und jede Ablehnung ist die des Pakets.',
    cases: {
      version: {
        heading: 'Ein Formular in einer Spec-Version, die hier nichts liest',
        what: 'Das Formular sagt, es sei in Version 5 von formancys Spec geschrieben.',
      },
      unmapped: {
        heading: 'Eine Regel, die die Abbildung nicht sagen kann',
        what: 'Das Formular zeigt die Sprache für das Dolmetschen nur, wenn Dolmetschen nötig ist und die Sprache der Patientin oder des Patienten nicht Deutsch ist: ein != unter &&, das ein enableWhen von SDC für eine unbeantwortete Frage nicht sagen kann.',
      },
      ahv: {
        heading: 'Eine AHV-Nummer mit falscher Prüfziffer',
        what: 'Die Patientin trägt eine AHV-Nummer, deren letzte Ziffer nicht die ist, die ihre übrigen Ziffern ergeben.',
      },
      gln: { heading: 'Eine GLN mit falscher Prüfziffer', what: 'Die GLN des Arztes endet auf einer Ziffer, die ihre übrigen Ziffern nicht ergeben.' },
      unproved: {
        heading: 'Der Brief als PDF/A-2b erklärt',
        what: 'Das PDF des Briefs wird als PDF/A-2b erklärt, und kein Gate hier hat bewiesen, dass Formancy Report das erzeugt.',
      },
    },
  },
  about: {
    heading: 'Über diese Demo',
    evaluation: 'Die Demo dient der Erprobung der Software, nicht der Versorgung von Patientinnen und Patienten.',
    purpose: 'Formancy Health sagt in einem Satz auf Englisch, was es nicht ist; diese Seite zeigt ihn so, wie seine Regeln ihn festhalten:',
    conformance: (v) =>
      `Was das zeigt und was nicht: In der CI prüft der HL7 FHIR Validator ${v.validator} offline die Ressourcen, die dieser Code aus einem synthetischen Testkorpus erzeugt: den Questionnaire gegen SDC ${v.sdc} auf FHIR R4 ${v.r4}; die QuestionnaireResponse gegen ihren Questionnaire, SDC ${v.sdc} und das Profil von CH ORF ${v.chOrf} für eine Antwort, und das CH-ORF-Dokument gegen CH ORF ${v.chOrf} und CH Core ${v.chCore} mit CH Term ${v.chTerm}; die Dokument-Bundles des Briefs gegen FHIR R4 ${v.r4}. Das Validator-Gate der CI schlägt fehl, wenn der Validator einen Fehler findet oder eine Warnung, die sein Register nicht mit Begründung zulässt. Die Beispielantworten, mit denen diese Seite beginnt, gehören zu diesem Korpus, ebenso jede Ressource, wie sie vor Ihrer ersten Änderung erscheint. Was Sie hier eingeben, wird nicht validiert: Diese Seite führt keinen Validator aus, und ein Dokument aus Ihren Eingaben kann vom Leitfaden abweichen. Offline prüft der Validator Codes nur gegen die Codesysteme, die diese Pakete enthalten: Ein Code aus LOINC oder SNOMED CT und ein Sprach-Tag werden nicht geprüft. Das ist keine Zertifizierung und keine Billigung durch HL7 oder HL7 Switzerland.`,
    register: 'Die Warnungen, die das Register zulässt, und warum',
    affiliation:
      'CH Core und CH ORF sind Implementierungsleitfäden von HL7 Switzerland. Formancy Health ist weder mit HL7, HL7 Switzerland noch eHealth Suisse verbunden noch von ihnen gebilligt oder zertifiziert.',
    licence: 'Formancy Health ist source-available: frei zum Lesen, Erproben und Entwickeln, in Produktion kostenpflichtig. Es ist nicht Open Source.',
  },
  footer: { repository: 'Das Repository', licence: 'Die Lizenz', notices: 'Lizenzen und Hinweise Dritter' },
  broken: 'Die Demo ist mit einem Fehler stehen geblieben, und nichts mehr wird erstellt. Laden Sie die Seite neu, beginnt sie von vorn.',
} satisfies Words
