# Shelf Recipes Backend

Minimal Express backend to cache Spoonacular recipes in MongoDB and expose a search endpoint.

Setup

- Copy `.env.example` to `.env` and set `MONGO_URI` and `SPOONACULAR_KEY`.
- Install deps and run backfill:

```powershell
cd backend
npm install
npm run backfill
npm start
```

Endpoints

- `GET /api/health` - health check
- `POST /api/recipes/search` - body: `{ filters, fridgeIngredients, offset, limit }` returns `{ results, totalResults }`
