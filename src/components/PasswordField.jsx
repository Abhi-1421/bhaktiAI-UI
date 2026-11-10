import { useState } from 'react';
import Field from './Field.jsx';
import { passwordChecks } from '../utils/validators.js';

const LEVELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function EyeIcon({ off }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

// Password input with show/hide toggle. `showRules` adds a strength meter and checklist.
export default function PasswordField({
  id,
  label,
  required,
  error,
  hint,
  showRules = false,
  value,
  ...input
}) {
  const [visible, setVisible] = useState(false);
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length;
  const level = !value ? 0 : score <= 2 ? 1 : score === 3 ? 2 : score === 4 ? 3 : 4;

  const describedBy =
    [error ? `${id}-error` : hint ? `${id}-hint` : null, showRules ? `${id}-rules` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const rules = showRules && (
    <div id={`${id}-rules`}>
      <div className="meter" data-level={level} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="meter-label">
        {level ? `Strength: ${LEVELS[level]}` : 'Use a mix of letters, numbers and symbols'}
      </p>
      <ul className="rules">
        {checks.map((c) => (
          <li key={c.id} data-ok={c.ok}>
            <span aria-hidden="true">{c.ok ? '✓' : '○'}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint} footer={rules}>
      <div className="input-wrap">
        <input
          id={id}
          name={id}
          className="input"
          type={visible ? 'text' : 'password'}
          value={value}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...input}
        />
        <button
          type="button"
          className="toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <EyeIcon off={visible} />
        </button>
      </div>
    </Field>
  );
}
