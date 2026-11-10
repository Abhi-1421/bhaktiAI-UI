import { useCallback, useMemo, useState } from 'react';

// Tiny form helper: errors are derived from the current values on every render,
// but only *shown* once a field has been touched (blurred) or the form submitted.
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => validate(values), [values, validate]);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const touch = useCallback((name) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  const touchAll = useCallback(() => {
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
  }, [values]);

  const shown = (name) => (touched[name] ? errors[name] || '' : '');

  return { values, errors, setValue, touch, touchAll, shown };
}
