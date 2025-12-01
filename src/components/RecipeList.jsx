import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes, onOpen }) {
  if (!recipes?.length) {
    return <p style={{ color: '#6b7280' }}>No recipes yet — try a search.</p>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12
      }}
    >
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />
      ))}
    </div>
  );
}
