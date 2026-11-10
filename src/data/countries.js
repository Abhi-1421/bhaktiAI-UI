// iso, name, dial code (no "+"), optional allowed national-number lengths,
// and optional extras (pattern = extra format check, ex = placeholder example).
// Countries without `len` fall back to a generic 6-14 digit check.
const c = (iso, name, dial, len = null, extra = {}) => ({ iso, name, dial, len, ...extra });

export const COUNTRIES = [
  c('AR', 'Argentina', '54'),
  c('AU', 'Australia', '61', [9]),
  c('AT', 'Austria', '43'),
  c('BH', 'Bahrain', '973', [8]),
  c('BD', 'Bangladesh', '880', [10]),
  c('BE', 'Belgium', '32'),
  c('BT', 'Bhutan', '975', [7, 8]),
  c('BR', 'Brazil', '55', [10, 11]),
  c('CA', 'Canada', '1', [10], { pattern: /^[2-9]\d{9}$/, ex: '4165550123' }),
  c('CL', 'Chile', '56', [9]),
  c('CN', 'China', '86', [11]),
  c('CO', 'Colombia', '57', [10]),
  c('CZ', 'Czechia', '420', [9]),
  c('DK', 'Denmark', '45', [8]),
  c('EG', 'Egypt', '20'),
  c('FI', 'Finland', '358'),
  c('FR', 'France', '33', [9]),
  c('DE', 'Germany', '49'),
  c('GH', 'Ghana', '233', [9]),
  c('GR', 'Greece', '30', [10]),
  c('HK', 'Hong Kong', '852', [8]),
  c('IN', 'India', '91', [10], { pattern: /^[6-9]\d{9}$/, ex: '9876543210' }),
  c('ID', 'Indonesia', '62'),
  c('IE', 'Ireland', '353'),
  c('IL', 'Israel', '972'),
  c('IT', 'Italy', '39'),
  c('JP', 'Japan', '81', [9, 10]),
  c('KE', 'Kenya', '254', [9]),
  c('KW', 'Kuwait', '965', [8]),
  c('MY', 'Malaysia', '60'),
  c('MV', 'Maldives', '960', [7]),
  c('MX', 'Mexico', '52', [10]),
  c('NP', 'Nepal', '977', [10]),
  c('NL', 'Netherlands', '31', [9]),
  c('NZ', 'New Zealand', '64'),
  c('NG', 'Nigeria', '234', [10]),
  c('NO', 'Norway', '47', [8]),
  c('OM', 'Oman', '968', [8]),
  c('PK', 'Pakistan', '92', [10]),
  c('PE', 'Peru', '51', [9]),
  c('PH', 'Philippines', '63', [10]),
  c('PL', 'Poland', '48', [9]),
  c('PT', 'Portugal', '351', [9]),
  c('QA', 'Qatar', '974', [8]),
  c('RU', 'Russia', '7', [10]),
  c('SA', 'Saudi Arabia', '966', [9]),
  c('SG', 'Singapore', '65', [8]),
  c('ZA', 'South Africa', '27', [9]),
  c('KR', 'South Korea', '82', [9, 10]),
  c('ES', 'Spain', '34', [9]),
  c('LK', 'Sri Lanka', '94', [9]),
  c('SE', 'Sweden', '46'),
  c('CH', 'Switzerland', '41', [9]),
  c('TW', 'Taiwan', '886'),
  c('TH', 'Thailand', '66', [8, 9]),
  c('TR', 'Turkey', '90', [10]),
  c('UA', 'Ukraine', '380', [9]),
  c('AE', 'United Arab Emirates', '971', [9]),
  c('GB', 'United Kingdom', '44', [9, 10]),
  c('US', 'United States', '1', [10], { pattern: /^[2-9]\d{9}$/, ex: '2015550123' }),
  c('VN', 'Vietnam', '84'),
].sort((a, b) => a.name.localeCompare(b.name));

export const flagOf = (iso) =>
  [...iso].map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))).join('');

export const findCountry = (iso) =>
  COUNTRIES.find((x) => x.iso === iso) || COUNTRIES.find((x) => x.iso === 'US');

// Pre-selects the country that matches the browser's language/region.
export function defaultCountryIso() {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region && COUNTRIES.some((x) => x.iso === region)) return region;
  } catch {
    /* ignore */
  }
  return 'US';
}
