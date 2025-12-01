import { useState } from 'react';

export default function RecipeSearchBar({ onSearch }) {
  const [q, setQ] = useState('');
  const [diet, setDiet] = useState('');
  const [intolerances, setIntolerances] = useState('');
  const [cuisine, setCuisine] = useState('');

  function submit(e) {
    e.preventDefault();
    onSearch({ query: q, diet, intolerances, cuisine });
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search recipes (e.g., chicken, pasta)…"
        style={{ flex: 2, minWidth: 220, padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
      />
      <select value={diet} onChange={(e) => setDiet(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
        <option value="">Diet</option>
        <option>vegan</option>
        <option>vegetarian</option>
        <option>ketogenic</option>
        <option>paleo</option>
        <option>pescetarian</option>
        <option>gluten free</option>
      </select>
      <input
        value={intolerances}
        onChange={(e) => setIntolerances(e.target.value)}
        placeholder="Intolerances (comma-separated)"
        style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
      />
      <input
        value={cuisine}
        onChange={(e) => setCuisine(e.target.value)}
        placeholder="Cuisine (e.g., Italian)"
        style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
      />
      <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, background: '#111827', color: '#fff' }}>
        Search
      </button>
    </form>
  );
}
