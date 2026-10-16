# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities through GitHub Security Advisories
("Report a vulnerability" on the Security tab) rather than a public issue.

We aim to acknowledge a report within 3 working days and to provide a
remediation timeline within 10 working days.

Please do not include a working exploit in the initial report; a description of
the vulnerability class and the affected component is enough to begin triage.
And please include no real person's health data: a synthetic form, answer or
resource that shows the problem is enough, and is all we want to hold.

## Scope

Formancy Health turns formancy forms, a person's answers to them and the PDFs
that Formancy Report renders, into resources and documents in the HL7® FHIR®
standard, inside the application of the vendor that runs it. It is a library:
it has no server and no network of its own, and the host supplies identity
and sends what it builds. Forms, answers, questionnaires, profiles,
implementation guide packages, PDFs and the resources a host hands over are
untrusted input even when an administrator wrote them. The areas we consider
highest risk, and are most interested in reports about, follow from that:

- **Health data in diagnostics**: a name, an identifier such as an AHV number
  or a KVNR, an answer, or any other value from a form, a resource or a PDF
  in a log line, an error message, a diagnostic, a test fixture or a
  snapshot. No package is meant to log, and a diagnostic names the field and
  the rule, never the value.
- **An export that fails open**: a resource or a Bundle produced half -- an
  unknown profile, FHIR or implementation guide version, item type, code
  system or reference passed through, guessed or left out rather than
  refused; an answer dropped; a reference left dangling; a PDF declared a
  profile no check proved. An integrity failure, and in scope.
- **Silent wrong values**: a decimal that loses a digit or a trailing zero
  because it passed through JavaScript `Number`, an integer outside its
  type's range, or a date or time given a zone it did not have.
- **Identity from anywhere but the host**: a patient, an organisation, a
  practitioner or a tenant taken from what a browser, a form or an answer
  supplied rather than from the identity the host verified, or a resource
  attributed to the wrong person.
- **Untrusted definitions**: a form, a questionnaire, a profile or an
  implementation guide package that makes a package run code, evaluate an
  expression it carries, or read beyond what it was given. Nothing a
  document carries is meant to run.
- **Parser input**: JSON, and XML wherever a package reads it, that reaches a
  parser unbounded -- in depth, in size, in duplicate keys, in a number read
  through `Number`, or, for XML, through entity expansion or an external
  entity.
- **Resource exhaustion**: items, nesting, answers, attachment bytes or
  Bundle entries that a bound should have refused.
- **Network reach**: anything that makes a package fetch a canonical URL, a
  profile, an implementation guide package or a terminology, or send a
  Bundle anywhere. A canonical and a system URI are identifiers, never
  addresses.

Nothing in the packages is meant to reach the network. A report that found a
way to make Formancy Health do so, on anybody's instruction, is in scope and
serious.
