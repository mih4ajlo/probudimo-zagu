import type { OfficeLevel } from "./offices";

// Placeholder copy: what a sleepy office mumbles when the princess shouts.
export const REPLIES: Record<OfficeLevel, readonly string[]> = {
  OJT: ["Samo još pet minuta...", "Ko je upalio svetlo?", "Predmet je u fioci. Negde."],
  VJT: ["Zakazali smo sastanak o buđenju.", "Prvo kafa, pa pravda."],
  AJT: ["Žalba na buđenje je u postupku.", "Rok za buđenje još nije istekao."],
  PJT: ["Posebno smo budni. Posebno retko.", "Tim za buđenje je na godišnjem."],
  VRHOVNO: ["Ovo je moja kancelarija... Dobro, budna sam."],
};
