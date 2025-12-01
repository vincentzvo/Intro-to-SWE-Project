const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.warn('MONGO_URI not set. Backfill and server will fail until configured.');
}

let clientPromise = null;
async function getClient() {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGO_URI, { 
      maxPoolSize: 10,
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
  }
  return clientPromise;
}

function getCollection(db) {
  return db.collection('recipes');
}

async function ensureIndexes() {
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);
  // Index on spoonacular id, text index on title, and maybe on extendedIngredients.name
  await col.createIndex({ spoonacularId: 1 }, { unique: true, background: true });
  await col.createIndex({ title: 'text' }, { background: true });
  await col.createIndex({ 'extendedIngredients.name': 1 }, { background: true });
}

// Build and run a Mongo aggregation to search cached recipes.
async function searchCachedRecipes({ filters = {}, fridgeIngredients = [], offset = 0, limit = 24 }) {
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);

  const match = {};

  // Basic text query
  if (filters.query) {
    match.$text = { $search: filters.query };
  }

  // Price range filters (convert dollars to cents) - only add if actually set
  const priceMin = filters.price?.min && filters.price.min !== "" ? Number(filters.price.min) * 100 : null;
  const priceMax = filters.price?.max && filters.price.max !== "" ? Number(filters.price.max) * 100 : null;
  if (priceMin !== null || priceMax !== null) {
    match['pricePerServing'] = {};
    if (priceMin !== null) match['pricePerServing'].$gte = priceMin;
    if (priceMax !== null) match['pricePerServing'].$lte = priceMax;
  }

  // Price buckets (0-2, 2-5, 5-10, 10+)
  if (filters.priceBuckets && filters.priceBuckets.length > 0) {
    const buckets = [
      { min: 0, max: 200 },      // $0-$2
      { min: 200, max: 500 },    // $2-$5
      { min: 500, max: 1000 },   // $5-$10
      { min: 1000, max: Infinity } // $10+
    ];
    const bucketRanges = filters.priceBuckets.map(idx => buckets[idx]).filter(Boolean);
    if (bucketRanges.length > 0 && !match.$or) {
      match.$or = bucketRanges.map(b => {
        const condition = {};
        if (b.max === Infinity) {
          condition['pricePerServing'] = { $gte: b.min };
        } else {
          condition['pricePerServing'] = { $gte: b.min, $lt: b.max };
        }
        return condition;
      });
    }
  }

  // Calorie range (accept both ui shape: filters.calories.min and mapped shape: filters.minCalories)
  const minCalories = (filters.calories && filters.calories.min) ?? filters.minCalories;
  const maxCalories = (filters.calories && filters.calories.max) ?? filters.maxCalories;
  if ((minCalories !== undefined && minCalories !== "") || (maxCalories !== undefined && maxCalories !== "")) {
    match['nutrition.calories'] = {};
    if (minCalories !== undefined && minCalories !== "") match['nutrition.calories'].$gte = Number(minCalories);
    if (maxCalories !== undefined && maxCalories !== "") match['nutrition.calories'].$lte = Number(maxCalories);
  }

  // Protein range
  const minProtein = (filters.protein && filters.protein.min) ?? filters.minProtein;
  const maxProtein = (filters.protein && filters.protein.max) ?? filters.maxProtein;
  if ((minProtein !== undefined && minProtein !== "") || (maxProtein !== undefined && maxProtein !== "")) {
    match['nutrition.protein'] = {};
    if (minProtein !== undefined && minProtein !== "") match['nutrition.protein'].$gte = Number(minProtein);
    if (maxProtein !== undefined && maxProtein !== "") match['nutrition.protein'].$lte = Number(maxProtein);
  }

  // Carbs range
  const minCarbs = (filters.carbs && filters.carbs.min) ?? filters.minCarbs;
  const maxCarbs = (filters.carbs && filters.carbs.max) ?? filters.maxCarbs;
  if ((minCarbs !== undefined && minCarbs !== "") || (maxCarbs !== undefined && maxCarbs !== "")) {
    match['nutrition.carbs'] = {};
    if (minCarbs !== undefined && minCarbs !== "") match['nutrition.carbs'].$gte = Number(minCarbs);
    if (maxCarbs !== undefined && maxCarbs !== "") match['nutrition.carbs'].$lte = Number(maxCarbs);
  }

  // Fat range
  const minFat = (filters.fat && filters.fat.min) ?? filters.minFat;
  const maxFat = (filters.fat && filters.fat.max) ?? filters.maxFat;
  if ((minFat !== undefined && minFat !== "") || (maxFat !== undefined && maxFat !== "")) {
    match['nutrition.fat'] = {};
    if (minFat !== undefined && minFat !== "") match['nutrition.fat'].$gte = Number(minFat);
    if (maxFat !== undefined && maxFat !== "") match['nutrition.fat'].$lte = Number(maxFat);
  }

  // Diets
  if (filters.diets && filters.diets.length > 0) {
    match['diets'] = { $in: filters.diets };
  }

  // Cuisines
  if (filters.cuisines && filters.cuisines.length > 0) {
    match['cuisines'] = { $in: filters.cuisines };
  }

  const pipeline = [];
  if (Object.keys(match).length) pipeline.push({ $match: match });

  // Intolerances: filter by ingredient names since Spoonacular doesn't return intolerances field
  if (filters.intolerances && filters.intolerances.length > 0) {
    const intoleranceIngredients = {
      'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'whey', 'casein', 'sour cream', 'cottage cheese', 'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'halloumi'],
      'gluten': ['wheat', 'bread', 'flour', 'gluten', 'barley', 'rye', 'semolina', 'couscous', 'bulgur', 'spelt', 'kamut'],
      'egg': ['egg', 'eggs', 'mayonnaise', 'mayo'],
      'soy': ['soy', 'tofu', 'edamame', 'soybean', 'tamari', 'miso', 'tempeh'],
      'peanut': ['peanut', 'peanuts'],
      'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'macadamia', 'pistachio', 'hazelnut', 'brazil nut', 'chestnut', 'pine nut', 'nut', 'pesto'],
      'seafood': ['fish', 'salmon', 'tuna', 'ahi', 'cod', 'bass', 'halibut', 'mackerel', 'anchovy', 'sardine', 'trout', 'flounder', 'snapper', 'tilapia', 'shrimp', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'squid', 'octopus', 'seaweed', 'nori', 'caviar', 'roe', 'scallop'],
      'sesame': ['sesame', 'tahini'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'prawn'],
      'grain': ['grain', 'wheat', 'barley', 'oats', 'rye', 'corn', 'rice', 'millet', 'quinoa'],
      'sulfite': ['sulfite', 'sulphite', 'sulfites', 'wine'],
    };

    // Normalize intolerances to lowercase for matching
    const normalizedIntolerances = filters.intolerances.map(s => s.toLowerCase());
    const badIngredients = [];
    
    normalizedIntolerances.forEach(intolerance => {
      if (intoleranceIngredients[intolerance]) {
        badIngredients.push(...intoleranceIngredients[intolerance]);
      }
    });

    console.log('Intolerance filtering:', { intolerances: normalizedIntolerances, badIngredients });

    if (badIngredients.length > 0) {
      pipeline.push({
        $addFields: {
          hasIntoleranceIngredient: {
            $anyElementTrue: {
              $map: {
                input: { $ifNull: ['$extendedIngredients', []] },
                as: 'ing',
                in: {
                  $anyElementTrue: {
                    $map: {
                      input: badIngredients,
                      as: 'bad',
                      in: { $gte: [{ $indexOfBytes: [{ $toLower: '$$ing.name' }, '$$bad'] }, 0] }
                    }
                  }
                }
              }
            }
          }
        }
      });
      pipeline.push({ $match: { hasIntoleranceIngredient: { $ne: true } } });
    }
  }

  // Compute matchCount based on fridgeIngredients
  const normalizedFridge = fridgeIngredients.map((s) => s.toLowerCase());
  if (normalizedFridge.length > 0) {
    pipeline.push({
      $addFields: {
        matchCount: {
          $size: {
            $filter: {
              input: { $ifNull: ['$extendedIngredients', []] },
              as: 'ing',
              cond: {
                $let: {
                  vars: { ingName: { $toLower: '$$ing.name' } },
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: normalizedFridge,
                        as: 'fridge',
                        in: {
                          $or: [
                            { $gte: [{ $indexOfBytes: ['$$ingName', '$$fridge'] }, 0] },
                            { $gte: [{ $indexOfBytes: ['$$fridge', '$$ingName'] }, 0] }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Require at least one match
    pipeline.push({ $match: { matchCount: { $gt: 0 } } });
  } else {
    // No fridge ingredients: set matchCount to 0 for all
    pipeline.push({
      $addFields: {
        matchCount: 0
      }
    });
  }

  // Sort by matchCount desc, then id
  pipeline.push({ $sort: { matchCount: -1, spoonacularId: 1 } });

  // Count total
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countRes = await col.aggregate(countPipeline).toArray();
  const total = (countRes[0] && countRes[0].total) || 0;

  // Paging
  pipeline.push({ $skip: Number(offset || 0) });
  pipeline.push({ $limit: Number(limit || 24) });

  // Project safe fields
  pipeline.push({
    $project: {
      _id: 0,
      spoonacularId: 1,
      id: '$spoonacularId',
      title: 1,
      image: 1,
      extendedIngredients: 1,
      readyInMinutes: 1,
      servings: 1,
      pricePerServing: 1,
      nutrition: 1,
      diets: 1,
      cuisines: 1,
      intolerances: 1,
      matchCount: 1
    }
  });

  const docs = await col.aggregate(pipeline).toArray();
  return { results: docs, totalResults: total };
}

// Upsert recipe docs from spoonacular backfill
async function upsertRecipes(recipes) {
  if (!recipes || !recipes.length) return;
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);

  const ops = recipes.map((r) => {
    // Try to extract nutrition from various possible Spoonacular response shapes
    let nutrients = [];
    
    // Shape 1: nutrition.nutrients array
    if (r.nutrition && r.nutrition.nutrients) {
      nutrients = r.nutrition.nutrients;
    }
    // Shape 2: nutrients array directly on recipe
    else if (Array.isArray(r.nutrients)) {
      nutrients = r.nutrients;
    }
    
    const findNutrient = (name) => {
      const n = nutrients.find((x) => x.name && x.name.toLowerCase().includes(name.toLowerCase()));
      return n ? Number(n.amount) : null;
    };

    const doc = {
      spoonacularId: r.id,
      title: r.title,
      image: r.image,
      extendedIngredients: r.extendedIngredients || [],
      readyInMinutes: r.readyInMinutes,
      servings: r.servings,
      pricePerServing: r.pricePerServing,
      // store simple numeric nutrition fields for easy filtering
      nutrition: {
        calories: findNutrient('calories'),
        protein: findNutrient('protein'),
        carbs: findNutrient('carbohydrates') || findNutrient('carbs'),
        fat: findNutrient('fat'),
      },
      // store diets/cuisines/intolerances (if present)
      diets: Array.isArray(r.diets) ? r.diets : [],
      cuisines: Array.isArray(r.cuisines) ? r.cuisines : [],
      intolerances: Array.isArray(r.intolerances) ? r.intolerances : [],
      // store some metadata
      spoonacularScore: r.spoonacularScore ?? r.aggregateLikes ?? null,
      updatedAt: new Date(),
    };

    return {
      updateOne: {
        filter: { spoonacularId: r.id },
        update: { $set: doc },
        upsert: true,
      }
    };
  });

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
}

async function getStats(sampleLimit = 1) {
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);
  const total = await col.countDocuments();
  const sample = await col.find({}, { projection: { _id: 0, spoonacularId: 1, title: 1, image: 1, nutrition: 1, diets: 1, cuisines: 1, extendedIngredients: 1 } }).limit(sampleLimit).toArray();
  return { total, sample };
}

async function getNutritionStats() {
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);
  const total = await col.countDocuments();
  const hasCalories = await col.countDocuments({ 'nutrition.calories': { $ne: null } });
  const hasProtein = await col.countDocuments({ 'nutrition.protein': { $ne: null } });
  const hasCarbs = await col.countDocuments({ 'nutrition.carbs': { $ne: null } });
  const hasFat = await col.countDocuments({ 'nutrition.fat': { $ne: null } });
  const hasIntolerances = await col.countDocuments({ 'intolerances': { $exists: true, $ne: [] } });
  return { total, hasCalories, hasProtein, hasCarbs, hasFat, hasIntolerances };
}

// Get intolerance statistics
async function getIntoleranceStats() {
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);
  const total = await col.countDocuments();
  const withIntolerances = await col.countDocuments({ 'intolerances': { $exists: true, $ne: [] } });
  const sample = await col.find({ 'intolerances': { $exists: true, $ne: [] } }).limit(5).project({ _id: 0, spoonacularId: 1, title: 1, intolerances: 1 }).toArray();
  return { total, withIntolerances, sample };
}

// Get a single recipe by spoonacularId
async function getRecipeById(id) {
  const client = await getClient();
  const db = client.db();
  const col = getCollection(db);
  const doc = await col.findOne(
    { spoonacularId: Number(id) },
    { projection: { _id: 0 } }
  );
  if (!doc) return null;
  // Return with id field for compatibility
  return { ...doc, id: doc.spoonacularId };
}

module.exports = { ensureIndexes, searchCachedRecipes, upsertRecipes, getStats, getNutritionStats, getRecipeById, getIntoleranceStats };
