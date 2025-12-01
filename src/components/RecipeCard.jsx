export default function RecipeCard({ recipe, onOpen }) {
  return (
    <button
      onClick={() => onOpen(recipe.id)}
      className="recipe-card w-full text-left border border-gray-200 rounded-xl p-3 bg-white shadow-sm"
      style={{ display: "flex", gap: 12, alignItems: "center" }}
    >
      <img src={recipe.image} alt={recipe.title} width="96" height="96" className="rounded-lg object-cover" loading="lazy" />

      <div className="flex-1">
        {/* 2-line clamp + ellipsis */}
        <div
          className="font-semibold"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
          title={recipe.title}
        >
          {recipe.title}
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : ""}{recipe.readyInMinutes && recipe.servings ? " • " : ""}{recipe.servings ? `${recipe.servings} servings` : ""}
        </div>
      </div>
    </button>
  );
}
