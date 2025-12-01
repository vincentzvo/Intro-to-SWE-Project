import { useEffect, useState } from 'react';

export default function RecipeModal({ id, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const apiKey = import.meta.env.VITE_SPOONACULAR_KEY;
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`
        );
        if (!res.ok) throw new Error(`Failed to load recipe: ${res.status}`);
        const d = await res.json();
        if (!ignore) setData(d);
      } catch (e) {
        if (!ignore) setErr(e.message || 'Failed to load recipe');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  if (!id) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 50
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 95vw)',
          maxHeight: '85vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 16,
          padding: 20
        }}
      >
        <button onClick={onClose} style={{ float: 'right' }}>✕</button>
        {loading && <p>Loading…</p>}
        {err && <p style={{ color: 'crimson' }}>{err}</p>}
        {data && (
          <>
            <h2 style={{ marginTop: 0 }}>{data.title}</h2>
            <img
              src={data.image}
              alt={data.title}
              style={{ width: '100%', borderRadius: 12 }}
            />
            <p dangerouslySetInnerHTML={{ __html: data.summary }} />
            <h3 style={{ fontWeight: 'bold' }}>Ingredients</h3>
            <ul>
              {data.extendedIngredients?.map((ing) => (
                <li key={ing.id}>{ing.original}</li>
              ))}
            </ul>
            {data.instructions && (
              <>
                <h3 style={{ fontWeight: 'bold' }}>Instructions</h3>
                <div dangerouslySetInnerHTML={{ __html: data.instructions }} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
