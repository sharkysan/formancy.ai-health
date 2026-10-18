/**
 * The page in Italian, addressed as "voi". formancy 0.5.0 ships no
 * Italian, so the words its renderer draws for the demo's form are given
 * here too (`formancy`), and an Italian page draws none of them in English.
 */
import type { Words } from './index.js'

export const it = {
  name: 'Italiano',
  language: 'Lingua',
  skip: 'Vai alla demo',
  title: 'Formancy Health – Demo',
  lead: 'Formancy Health esporta i moduli formancy, le risposte di una persona e i PDF resi da Formancy Report come risorse dello standard HL7® FHIR®, adattate ai profili di un paese: per ora, CH Core e CH ORF della Svizzera. Qui funziona nel vostro browser, su una richiesta di consulto fittizia.',
  banner:
    'Questa demo funziona con dati fittizi: i dati reali dei pazienti non vanno inseriti qui. Ciò che inserite viene trasformato qui, nel vostro browser, in risorse FHIR: questa pagina non lo invia da nessuna parte e non ne conserva nulla. Se ricaricate o chiudete la pagina, le vostre risposte vanno perse.',
  // 'form.submit' labels the submit control in every language; in Italian
  // 'form.required' too, the hint a required group says, so that a group
  // the form gains is not announced in English.
  formancy: { 'form.submit': 'Alle risorse', 'form.required': 'obbligatorio' },
  form: {
    heading: 'Il modulo',
    intro: (formancy) => `Una richiesta di consulto fittizia, disegnata dal renderer React di formancy ${formancy}. È questo modulo a diventare il Questionnaire tra le risorse: ogni campo un item, la sua chiave il linkId di questo. Modificate una risposta, e le risorse vengono rifatte da ciò che avete inserito.`,
    sample: 'Le risposte dell’esempio, invariate: ogni risorsa mostrata è una voce del corpus sintetico che il controllo del validatore giudica in CI, byte per byte.',
    changed: 'Modificato da voi: la QuestionnaireResponse e il documento CH ORF sono ciò che i pacchetti fanno delle vostre risposte, e nulla li ha validati.',
    reset: 'Torna alle risposte dell’esempio',
    made: 'La QuestionnaireResponse e il documento CH ORF sono fatti dalle vostre risposte.',
    refused: (count) => `Le vostre risposte sono rifiutate (rifiuti: ${count}), quindi il documento CH ORF non è fatto.`,
  },
  resources: {
    intro: 'Ogni risorsa è fatta qui, nel vostro browser, dal pacchetto indicato con essa. Un pacchetto che rifiuta dice perché in inglese, e questa pagina mostra i suoi rifiuti così come sono.',
    show: 'Mostra il JSON',
    asJson: (resource) => `${resource} in JSON`,
    download: (file) => `Scarica ${file}`,
    madeBy: (maker) => `Fatto da ${maker}.`,
    corpus: (file) => `È la voce del corpus ${file}, byte per byte.`,
    refusedBy: (maker) => `Rifiutato da ${maker}:`,
    failed: 'Il pacchetto è fallito con un errore che non è un suo rifiuto, e nulla è stato fatto.',
  },
  questionnaire: {
    heading: 'Il Questionnaire',
    intro: 'Un Questionnaire SDC del modulo: i suoi item nelle quattro lingue del modulo, il titolo nell’unica lingua in cui il modulo lo dà. Non dipende dalle risposte.',
  },
  readOut: {
    heading: 'Che cosa dice il Questionnaire',
    intro:
      'Letto dal JSON qui sotto, la risorsa scritta da health-questionnaire, non dal modulo: ogni item nel suo ordine e annidamento, il suo testo nella lingua di questa pagina, il suo tipo, se è obbligatorio o si ripete, le sue opzioni e quando è mostrato. Il resto sta solo nel JSON, tra cui se un item è di sola lettura o nascosto, la sua lunghezza, i suoi limiti e quante volte può ricevere una risposta. Questo non è un renderer FHIR e non valida nulla: Formancy Health fa Questionnaire dei moduli formancy, e non ne disegna nessuno.',
    title: 'Titolo',
    type: 'Tipo',
    types: {
      group: 'un gruppo di item',
      display: 'un testo da leggere, senza risposta',
      boolean: 'sì o no',
      decimal: 'un numero',
      integer: 'un numero intero',
      date: 'una data',
      dateTime: 'una data con ora',
      time: 'un’ora del giorno',
      string: 'un testo breve',
      text: 'un testo più lungo',
      choice: 'una scelta tra opzioni',
    },
    required: 'Obbligatorio',
    repeats: 'Si ripete',
    yes: 'sì',
    no: 'no',
    options: 'Opzioni',
    shownWhen: 'Mostrato se',
    joined: { all: 'valgono tutte queste condizioni:', any: 'vale almeno una di queste condizioni:' },
    is: 'è',
    isNot: 'non è',
    answered: 'ha una risposta',
    unanswered: 'non ha risposta',
    numbers: { '>': 'è maggiore di', '<': 'è minore di', '>=': 'è almeno', '<=': 'è al massimo' },
    moments: { '>': 'è dopo', '<': 'è prima di', '>=': 'è al più presto', '<=': 'è al più tardi' },
    noText: 'Senza testo',
    untranslated: (language) => `non tradotto in italiano nel Questionnaire: il suo testo, in ${language}`,
    unnamedLanguage: 'non tradotto in italiano nel Questionnaire: il suo testo, in una lingua che non nomina',
    toField: 'Al campo del modulo',
    toFieldOf: (field) => `Al campo del modulo: ${field}`,
    notShown: 'Il modulo non mostra questo campo per ora.',
    unread: 'Questa pagina non riesce a leggere il Questionnaire; il suo JSON è qui sotto, così come è stato scritto.',
  },
  response: {
    heading: 'Le risposte, come QuestionnaireResponse',
    intro: 'Le risposte a quel Questionnaire, con il profilo di risposta di CH ORF, così come il documento CH ORF le porta.',
  },
  document: {
    heading: 'La richiesta, come documento CH ORF',
    intro:
      'La richiesta e le sue risposte come documento CH ORF. La paziente, l’autore e l’incarico sono fittizi e fissi: nessun campo chiede un identificativo. Porta il Questionnaire tramite il suo canonical, non al suo interno, e nessun PDF: la lettera è un documento a sé.',
    notMade: 'Non fatto: le risposte sono rifiutate, e un documento CH ORF le porta.',
  },
  letter: {
    heading: 'La lettera, come documento',
    intro: (report) => `La lettera fittizia del corpus, che Formancy Report ${report} ha reso quando questa pagina è stata costruita. Non cambia con le vostre risposte; il Bundle di documento che la contiene è fatto qui, nel vostro browser.`,
    placement: 'Dove vanno i byte del PDF',
    data: 'Nell’allegato della DocumentReference',
    binary: 'In un Binary accanto',
  },
  refused: {
    heading: 'Rifiutato apposta',
    intro: 'Input fissi, ciascuno rotto in un solo modo ed eseguito qui dal pacchetto che lo rifiuta. Nulla vi è stato inserito da voi, e ogni rifiuto è quello del pacchetto.',
    cases: {
      version: { heading: 'Un modulo in una versione della spec che nulla qui legge', what: 'Il modulo dice di essere scritto nella versione 5 della spec di formancy.' },
      unmapped: {
        heading: 'Una regola che la corrispondenza non sa dire',
        what: 'Il modulo mostra la lingua da interpretare solo se serve un interprete e la lingua della o del paziente non è il tedesco: un != sotto &&, che un enableWhen di SDC non sa dire per una domanda senza risposta.',
      },
      ahv: { heading: 'Un numero AVS con la cifra di controllo sbagliata', what: 'La paziente porta un numero AVS la cui ultima cifra non è quella che danno le altre cifre.' },
      gln: { heading: 'Un GLN con la cifra di controllo sbagliata', what: 'Il GLN del medico termina con una cifra che le sue altre cifre non danno.' },
      unproved: { heading: 'La lettera dichiarata PDF/A-2b', what: 'Il PDF della lettera è dichiarato PDF/A-2b, e nessun controllo qui ha provato che Formancy Report lo produce.' },
    },
  },
  about: {
    heading: 'Su questa demo',
    evaluation: 'Questa demo serve a valutare il software, non a curare pazienti.',
    purpose: 'Formancy Health dice in una frase, in inglese, che cosa non è; questa pagina la mostra come le sue regole la tengono:',
    conformance: (v) =>
      `Che cosa mostra, e che cosa no. In CI, il validatore HL7 FHIR ${v.validator} verifica offline le risorse che questo codice fa di un corpus di test sintetico: il Questionnaire contro SDC ${v.sdc} su FHIR R4 ${v.r4}; la QuestionnaireResponse contro il suo Questionnaire, SDC ${v.sdc} e il profilo di risposta di CH ORF ${v.chOrf}, e il documento CH ORF contro CH ORF ${v.chOrf} e CH Core ${v.chCore}, con CH Term ${v.chTerm}; i Bundle di documento della lettera contro FHIR R4 ${v.r4}. Il controllo del validatore in CI fallisce se il validatore trova un errore, o un avviso che il suo registro non accetta con una ragione. Le risposte d’esempio da cui parte questa pagina sono in quel corpus, e così ogni risorsa, come appare prima della vostra prima modifica. Ciò che inserite qui non è validato: questa pagina non esegue alcun validatore, e un documento fatto dei vostri dati può non essere conforme. Offline, il validatore verifica i codici solo rispetto ai sistemi di codici che quei pacchetti contengono: un codice LOINC o SNOMED CT, e un tag di lingua, non sono verificati. Non è una certificazione, né un’approvazione di HL7 o di HL7 Switzerland.`,
    register: 'Gli avvisi che il registro accetta, e perché',
    affiliation: 'CH Core e CH ORF sono guide di implementazione pubblicate da HL7 Switzerland. Formancy Health non è affiliato a HL7, a HL7 Switzerland o a eHealth Suisse, né approvato o certificato da loro.',
    licence: 'Formancy Health è source-available: libero da leggere, valutare e con cui sviluppare, a pagamento in produzione. Non è open source.',
  },
  footer: { repository: 'Il repository', licence: 'La licenza', notices: 'Licenze e avvisi di terzi' },
  broken: 'La demo si è fermata per un errore, e nulla più viene fatto. Ricaricare la pagina la fa ripartire.',
} satisfies Words
