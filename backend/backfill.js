require('dotenv').config();
const axios = require('axios');
const { upsertRecipes } = require('./services/recipes');

const SPOON_KEY = process.env.SPOONACULAR_KEY || process.env.VITE_SPOONACULAR_KEY;
if (!SPOON_KEY) {
  console.error('SPOONACULAR_KEY or VITE_SPOONACULAR_KEY not set in env - backfill cannot run');
  process.exit(1);
}

async function fetchPage(offset = 0, number = 100) {
  const url = 'https://api.spoonacular.com/recipes/complexSearch';
  const params = {
    apiKey: SPOON_KEY,
    number,
    offset,
    addRecipeInformation: true,
    addRecipeNutrition: true,
    fillIngredients: true,
  };
  const res = await axios.get(url, { params });
  return res.data;
}

async function run() {
  console.log('Starting backfill from Spoonacular...');
  let offset = 0;
  const pageSize = 100;
  let total = Infinity;
  let fetched = 0;
  const recipesToUpsert = [];

  while (offset < total) {
    console.log(`Fetching offset=${offset}...`);
    const data = await fetchPage(offset, pageSize);
    const results = data.results || [];
    if (total === Infinity) total = data.totalResults || results.length;
    if (!results.length) break;

    // Add results (with nutrition) to batch
    recipesToUpsert.push(...results);
    fetched += results.length;

    // Upsert in batches of 50
    if (recipesToUpsert.length >= 50 || offset + pageSize >= total) {
      console.log(`Upserting batch of ${recipesToUpsert.length} recipes...`);
      await upsertRecipes(recipesToUpsert);
      recipesToUpsert.length = 0;
    }

    offset += pageSize;

    // Safety cap: 10,000 recipes
    if (fetched >= 10000) {
      console.log('Reached safety cap of 10,000 recipes');
      break;
    }
  }

  console.log('Backfill complete. Fetched and cached', fetched, 'recipes');
  process.exit(0);
}

run().catch((err) => {
  console.error('Backfill failed', err);
  process.exit(1);
});
