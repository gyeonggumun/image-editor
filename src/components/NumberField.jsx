import { useState } from 'react';

export default function NumberField({ label, value, onChange, min = 0, max = 8192, step = 1, suffix = 'px' }) {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    const number = Number(draft);
    if (draft !== null && draft.trim() && Number.isFinite(number) && number >= min && number <= max) onChange(number);
    setDraft(null);
  };
  return <label className="number-field"><span>{label}</span><span className="number-input"><input aria-label={label} type="number" min={min} max={max} step={step} value={draft ?? String(value)} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /><small>{suffix}</small></span></label>;
}
