/** Países (ISO 3166-1 alfa-2). Los nombres salen de Intl en español. */
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );

// Primero los países hispanohablantes: es donde estará la mayoría de jugadores.
const HISPANIC = ["ES", "MX", "AR", "CO", "PE", "VE", "CL", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ", "US"];

let names: Intl.DisplayNames | null = null;
export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  try {
    names ??= new Intl.DisplayNames(["es"], { type: "region" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function countryOptions() {
  const rest = CODES.filter((c) => !HISPANIC.includes(c)).sort((a, b) =>
    countryName(a).localeCompare(countryName(b), "es"),
  );
  return { featured: HISPANIC.map((code) => ({ code, name: countryName(code) })), rest: rest.map((code) => ({ code, name: countryName(code) })) };
}

export const isCountryCode = (c: string) => CODES.includes(c);
