const BASE = "https://api.spoonacular.com";

const buildQS = (params = {}) => {
  const qs = new URLSearchParams();
  qs.set("apiKey", import.meta.env.VITE_SPOONACULAR_KEY);

  // Only include non-empty, non-null values
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      const s = v.filter(Boolean).join(",");
      if (s) qs.set(k, s);
    } else if (String(v).trim() !== "") {
      qs.set(k, v);
    }
  });

  return qs.toString();
};

// NOTE: price ranges are handled client-side using `pricePerServing`
// returned by Spoonacular (cents). ComplexSearch doesn’t support min/max price.
export async function searchRecipes({
  query,
  number = 24,
  offset = 0,
  sort = "popularity",
  cuisines = [],      // array
  diets = [],         // array
  intolerances = [],  // array

  // Nutrition ranges:
  minCalories, maxCalories,
  minProtein,  maxProtein,
  minCarbs,    maxCarbs,
  minFat,      maxFat,
} = {}) {
  const qs = buildQS({
    query,
    number,
    offset,
    sort,
    addRecipeInformation: true,
    fillIngredients: true,

    // arrays -> csv
    cuisine: cuisines,
    diet: diets,
    intolerances,

    // nutrition filters (Spoonacular-supported)
    minCalories, maxCalories,
    minProtein,  maxProtein,
    minCarbs,    maxCarbs,
    minFat,      maxFat,
  });

  const res = await fetch(`${BASE}/recipes/complexSearch?${qs}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  // returns { results, totalResults }
  return {
    results: data.results || [],
    totalResults: data.totalResults ?? (data.results ? data.results.length : 0),
  };
}

export async function getRecipeById(id) {
  const qs = new URLSearchParams();
  qs.set("apiKey", import.meta.env.VITE_SPOONACULAR_KEY);

  const res = await fetch(
    `https://api.spoonacular.com/recipes/${id}/information?${qs}`
  );

  if (!res.ok) {
    throw new Error(`Failed to load recipe details: ${res.status}`);
  }

  return res.json();
}
