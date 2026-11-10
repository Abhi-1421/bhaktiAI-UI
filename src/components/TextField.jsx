import Field from './Field.jsx';

export default function TextField({ id, label, required, optional, error, hint, ...input }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <Field id={id} label={label} required={required} optional={optional} error={error} hint={hint}>
      <input
        id={id}
        name={id}
        className="input"
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...input}
      />
    </Field>
  );
}
