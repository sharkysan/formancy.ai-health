# @formancy/health-core

The core of Formancy Health. Today it holds one thing: the release of the
HL7® FHIR® standard that every resource the module writes is written for.
No framework, no Node, no network.

```ts
import { FHIR_VERSION } from '@formancy/health-core'

FHIR_VERSION // '4.0.1': R4, with its technical correction
```

`FHIR_VERSION` is written as R4's FHIRVersion code system writes it, the
form a `CapabilityStatement` states its release in, and its type is the
literal `'4.0.1'`, not `string`. It is independent of this package's npm
version: it changes only when the module writes for another FHIR release,
and that is a breaking change. The core itself -- FHIR R4 JSON that keeps
every digit of a decimal, and the refusal of a version it does not know --
is not here yet.

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.

Source-available, not open source: see [`LICENSE.md`](../../LICENSE.md).
