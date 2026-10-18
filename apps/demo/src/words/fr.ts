/**
 * The page in French: "vous", and a no-break space before `:` and `;`, as
 * French typography asks and formancy's own French keeps.
 */
import type { Words } from './index.js'

export const fr = {
  name: 'Français',
  language: 'Langue',
  skip: 'Aller à la démo',
  title: 'Formancy Health – Démo',
  lead: 'Formancy Health exporte les formulaires formancy, les réponses d’une personne à ceux-ci et les PDF que rend Formancy Report en ressources du standard HL7® FHIR®, adaptées aux profils d’un pays : pour l’instant, CH Core et CH ORF, ceux de la Suisse. Ici, il s’exécute dans votre navigateur, sur une demande de transfert fictive.',
  banner:
    'Cette démo fonctionne avec des données fictives, et les données réelles de patients n’y ont pas leur place. Ce que vous saisissez est transformé ici, dans votre navigateur, en ressources FHIR : cette page ne l’envoie nulle part et n’en conserve rien. Si vous rechargez ou fermez la page, vos réponses sont perdues.',
  formancy: { 'form.submit': 'Vers les ressources' },
  form: {
    heading: 'Le formulaire',
    intro: (formancy) => `Une demande de transfert fictive, dessinée par le moteur de rendu React de formancy ${formancy}. Modifiez une réponse, et les ressources sont refaites à partir de votre saisie.`,
    sample: 'Les réponses de l’exemple, inchangées : chaque ressource affichée est une entrée du corpus synthétique que le contrôle du validateur juge en CI, octet pour octet.',
    changed: 'Modifié par vous : la QuestionnaireResponse et le document CH ORF sont ce que les paquets font de vos réponses, et rien ne les a validés.',
    reset: 'Revenir aux réponses de l’exemple',
    made: 'La QuestionnaireResponse et le document CH ORF sont faits à partir de vos réponses.',
    refused: (count) => `Vos réponses sont refusées (refus : ${count}), donc le document CH ORF n’est pas fait.`,
  },
  resources: {
    intro: 'Chaque ressource est faite ici, dans votre navigateur, par le paquet nommé avec elle. Un paquet qui refuse dit pourquoi en anglais, et cette page montre ses refus tels quels.',
    show: 'Afficher le JSON',
    asJson: (resource) => `${resource} en JSON`,
    download: (file) => `Télécharger ${file}`,
    madeBy: (maker) => `Fait par ${maker}.`,
    corpus: (file) => `C’est l’entrée du corpus ${file}, octet pour octet.`,
    refusedBy: (maker) => `Refusé par ${maker} :`,
    failed: 'Le paquet a échoué sur une erreur qui n’est pas un de ses refus, et rien n’a été fait.',
  },
  questionnaire: {
    heading: 'Le Questionnaire',
    intro: 'Un Questionnaire SDC du formulaire, dans ses quatre langues. Il ne dépend pas des réponses.',
  },
  response: {
    heading: 'Les réponses, en QuestionnaireResponse',
    intro: 'Les réponses à ce Questionnaire, revendiquant le profil de réponse de CH ORF, telles que le document CH ORF les porte.',
  },
  document: {
    heading: 'La demande de transfert, en document CH ORF',
    intro:
      'La demande et ses réponses en document CH ORF. Sa patiente, son auteur et son mandat sont fictifs et fixes : aucun champ ne demande un identifiant. Il porte le Questionnaire par son canonical, pas en lui-même, et aucun PDF : la lettre est un document à part.',
    notMade: 'Pas fait : les réponses sont refusées, et un document CH ORF les porte.',
  },
  letter: {
    heading: 'La lettre, en document',
    intro: (report) => `La lettre fictive du corpus, que Formancy Report ${report} a rendue lors de la construction de cette page. Elle ne change pas avec vos réponses ; le Bundle de document qui l’entoure est fait ici, dans votre navigateur.`,
    placement: 'Où vont les octets du PDF',
    data: 'Dans la pièce jointe de la DocumentReference',
    binary: 'Dans un Binary à côté',
  },
  refused: {
    heading: 'Refusé exprès',
    intro: 'Des entrées fixes, chacune cassée d’une seule façon et passée ici par le paquet qui la refuse. Vous n’y avez rien saisi, et chaque refus est celui du paquet.',
    cases: {
      version: { heading: 'Un formulaire dans une version de la spec que rien ici ne lit', what: 'Le formulaire dit être écrit dans la version 5 de la spec de formancy.' },
      unmapped: {
        heading: 'Une règle que la correspondance ne peut pas dire',
        what: 'Le formulaire ne montre la langue d’interprétation que si un interprète est nécessaire et que la langue de la patiente ou du patient n’est pas l’allemand : un != sous &&, qu’un enableWhen de SDC ne peut pas dire pour une question restée sans réponse.',
      },
      ahv: { heading: 'Un numéro AVS dont le chiffre de contrôle est faux', what: 'La patiente porte un numéro AVS dont le dernier chiffre n’est pas celui que donnent ses autres chiffres.' },
      gln: { heading: 'Un GLN dont le chiffre de contrôle est faux', what: 'Le GLN du médecin se termine par un chiffre que ses autres chiffres ne donnent pas.' },
      unproved: { heading: 'La lettre déclarée PDF/A-2b', what: 'Le PDF de la lettre est déclaré PDF/A-2b, et aucun contrôle ici n’a prouvé que Formancy Report le produit.' },
    },
  },
  about: {
    heading: 'À propos de cette démo',
    evaluation: 'Cette démo sert à évaluer le logiciel, pas à soigner des patientes et des patients.',
    purpose: 'Formancy Health dit en une phrase, en anglais, ce qu’il n’est pas ; cette page la montre telle que ses règles la tiennent :',
    conformance: (v) =>
      `Ce que cela montre, et ce que cela ne montre pas. En CI, le validateur HL7 FHIR ${v.validator} vérifie hors ligne les ressources que ce code fait d’un corpus de test synthétique : le Questionnaire contre SDC ${v.sdc} sur FHIR R4 ${v.r4} ; la QuestionnaireResponse contre son Questionnaire, SDC ${v.sdc} et le profil de réponse de CH ORF ${v.chOrf}, et le document CH ORF contre CH ORF ${v.chOrf} et CH Core ${v.chCore}, avec CH Term ${v.chTerm} ; les Bundles de document de la lettre contre FHIR R4 ${v.r4}. Le contrôle du validateur en CI échoue si le validateur trouve une erreur, ou un avertissement que son registre n’accepte pas avec une raison. Les réponses d’exemple dont part cette page sont dans ce corpus, et chaque ressource aussi, telle qu’elle s’affiche avant votre première modification. Ce que vous saisissez ici n’est pas validé : cette page n’exécute aucun validateur, et un document fait de votre saisie peut ne pas être conforme. Hors ligne, le validateur ne vérifie les codes que contre les systèmes de codes que ces paquets contiennent : un code LOINC ou SNOMED CT, et une étiquette de langue, ne sont pas vérifiés. Ce n’est pas une certification, ni une approbation de HL7 ou de HL7 Switzerland.`,
    register: 'Les avertissements que le registre accepte, et pourquoi',
    affiliation: 'CH Core et CH ORF sont des guides d’implémentation publiés par HL7 Switzerland. Formancy Health n’est ni affilié à HL7, à HL7 Switzerland ou à eHealth Suisse, ni approuvé ou certifié par eux.',
    licence: 'Formancy Health est source-available : libre à lire, à évaluer et pour développer, payant en production. Ce n’est pas de l’open source.',
  },
  footer: { repository: 'Le dépôt', licence: 'La licence', notices: 'Licences et avis des tiers' },
  broken: 'La démo s’est arrêtée sur une erreur, et plus rien n’est fait. Recharger la page la recommence.',
} satisfies Words
