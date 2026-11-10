import Field from './Field.jsx';
import { COUNTRIES, findCountry, flagOf } from '../data/countries.js';
import { phoneHint } from '../utils/validators.js';

// Country-code dropdown + phone number textbox.
export default function PhoneField({
  id = 'phone',
  label = 'Phone number',
  required,
  error,
  countryIso,
  onCountryChange,
  value,
  onChange,
  onBlur,
}) {
  const country = findCountry(countryIso);
  const maxLen = country.len ? Math.max(...country.len) : 14;
  const hint = phoneHint(country);
  const describedBy = error ? `${id}-error` : `${id}-hint`;

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <div className="phone">
        <div className="cc">
          <span aria-hidden="true">
            {flagOf(country.iso)} +{country.dial}
          </span>
          <span className="caret" aria-hidden="true">
            ▾
          </span>
          <select
            id={`${id}-country`}
            aria-label="Country code"
            value={country.iso}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {flagOf(c.iso)} {c.name} (+{c.dial})
              </option>
            ))}
          </select>
        </div>
        <input
          id={id}
          name={id}
          className="input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={country.ex || 'Enter phone number'}
          value={value}
          maxLength={maxLen}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
        />
      </div>
    </Field>
  );
}
