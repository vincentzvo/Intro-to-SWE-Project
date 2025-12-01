// Frontend wrapper for talking to the new backend /api/recipes/search
export async function backendSearchRecipes({ filters = {}, fridgeIngredients = [], offset = 0, limit = 24 }) {
  const body = { filters, fridgeIngredients, offset, limit };
  const res = await fetch('/api/recipes/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`backend search failed: ${res.status} ${text}`);
  }
  return res.json();
}
