// Label + control + error/hint wrapper shared by every field.
export default function Field({ id, label, required, optional, error, hint, footer, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="req" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {optional && <span className="opt"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
      {footer}
    </div>
  );
}
