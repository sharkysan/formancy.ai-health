/**
 * The release of the HL7® FHIR® standard every resource this module writes
 * is written for: R4, whose technical version is 4.0.1, "FHIR Release 4
 * (Technical Correction #1)", published on 30 October 2019
 * (https://hl7.org/fhir/R4/, read on 17 October 2026).
 *
 * Written as R4's FHIRVersion code system writes it, because that is the form
 * a CapabilityStatement, a StructureDefinition and an ImplementationGuide
 * state their release in, each bound to it as required: three numbers, as a
 * string. 'R4' is a name and not a code there, nor is '4.0'; '4.0.0' is the
 * release before the correction.
 *
 * Independent of this package's npm version. A release of this package that
 * changes how a resource is written keeps it; one that writes for another
 * FHIR release changes it, and that is a breaking change for every host.
 *
 * `as const` keeps its type the literal wherever a host puts it: a bare
 * `const` is a literal TypeScript widens to `string` at the first `let`.
 */
export const FHIR_VERSION = '4.0.1' as const
