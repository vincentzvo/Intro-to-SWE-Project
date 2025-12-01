import { useEffect, useRef, useState } from "react"
import { Home, BookOpen, FileText, LogOut, Menu, X } from "lucide-react"
import { useAuth } from "../auth/AuthContext"
import Fridge3D from "../components/Fridge3D"
import SidePanel from "../components/SidePanel"
import PhotoUploadButton from "../components/PhotoUploadButton"
import ManualIngredientForm from "../components/ManualIngredientForm"
import AddToFridgeButton from "../components/AddToFridgeButton"
import RecipeFiltersSidebar from "../components/RecipeFiltersSidebar"
import RecipeModal from "../components/RecipeModal"
import { backendSearchRecipes } from "../api/backend"
import Blog from "./Blog"


const mockIngredients = [
  {
    id: 1,
    name: "Tomato",
    icon: "🍅",
    nutrition: {
      calories: "18 kcal",
      protein: "0.9g",
      carbs: "3.9g",
      fat: "0.2g",
      fiber: "1.2g",
    },
    description: "Fresh, ripe tomatoes packed with vitamins and antioxidants.",
  },
  {
    id: 2,
    name: "Broccoli",
    icon: "🥦",
    nutrition: {
      calories: "34 kcal",
      protein: "2.8g",
      carbs: "7g",
      fat: "0.4g",
      fiber: "2.6g",
    },
    description: "Nutrient-rich green vegetable high in vitamins C and K.",
  },
  {
    id: 3,
    name: "Carrot",
    icon: "🥕",
    nutrition: {
      calories: "41 kcal",
      protein: "0.9g",
      carbs: "10g",
      fat: "0.2g",
      fiber: "2.8g",
    },
    description: "Crunchy root vegetable rich in beta-carotene.",
  },
  {
    id: 4,
    name: "Cheese",
    icon: "🧀",
    nutrition: {
      calories: "402 kcal",
      protein: "25g",
      carbs: "1.3g",
      fat: "33g",
      fiber: "0g",
    },
    description: "Delicious dairy product high in calcium and protein.",
  },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [ingredients, setIngredients] = useState([])
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [showManualForm, setShowManualForm] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LOAD_SIZE = 24;
  // Fetch a larger batch once up front so we can client-side filter/sort by fridge ingredients
  // Increase to cover the backend backfill size so users can scroll through all cached recipes
  const FULL_FETCH_SIZE = 10000;
  // Store the full fetched set in memory so infinite scroll is purely client-side
  const [allRecipes, setAllRecipes] = useState(null);
  const sentinelRef = useRef(null);

  const [filters, setFilters] = useState({
    query: "",
    cuisines: [],
    diets: [],
    intolerances: [],
    priceBuckets: [],
    price: { min: "", max: "" },
    calories: { min: "", max: "" },
    protein:  { min: "", max: "" },
    carbs:    { min: "", max: "" },
    fat:      { min: "", max: "" },
  });

  const handleIngredientClick = (ingredient) => {
    setSelectedIngredient(ingredient)
    setIsPanelOpen(true)
  }

  const handleIngredientsUpdate = (newIngredients) => {
    // Transform webhook data to match our component format
    const transformedIngredients = newIngredients.map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      icon: item.emoji,
      quantity: item.quantity,
      category: item.category,
      confidence: item.confidence,
      container: item.container,
      expiry: item.expiry,
      nutrition: {
        // Placeholder nutrition data - can be enhanced later
        calories: "--",
        protein: "--",
        carbs: "--",
        fat: "--",
        fiber: "--",
      },
      description: `${item.quantity} of ${item.name} (${item.category})`
    }))
    
    setIngredients(transformedIngredients)
    console.log('Updated ingredients:', transformedIngredients)
  }

  const handleSaveIngredient = (ingredientData) => {
    const newIngredient = {
      ...ingredientData,
      nutrition: {
        calories: "--",
        protein: "--",
        carbs: "--",
        fat: "--",
        fiber: "--",
      },
      description: ingredientData.quantity 
        ? `${ingredientData.quantity} of ${ingredientData.name}` 
        : ingredientData.name
    };

    if (editingIngredient) {
      // Update existing ingredient
      setIngredients(prev => prev.map(ing => 
        ing.id === editingIngredient.id ? newIngredient : ing
      ));
    } else {
      // Add new ingredient
      setIngredients(prev => [...prev, newIngredient]);
    }
    
    setEditingIngredient(null);
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setShowManualForm(true);
  };

  const handleDeleteIngredient = (ingredientId) => {
    setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
  };


  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const priceFilter = (recipe, filterState) => {
    const cents = recipe.pricePerServing ?? 0;
    const usd = cents / 100;

    const BUCKETS = [
      { min: 0,  max: 2 },
      { min: 2,  max: 5 },
      { min: 5,  max: 10 },
      { min: 10,  max: Infinity },
    ];

    const anyBucket = filterState.priceBuckets.length > 0;
    const passesBucket = !anyBucket || filterState.priceBuckets.some((idx) => {
      const b = BUCKETS[idx];
      return usd >= b.min && usd < b.max;
    });

    const customMin = filterState.price.min !== "" ? Number(filterState.price.min) : -Infinity;
    const customMax = filterState.price.max !== "" ? Number(filterState.price.max) :  Infinity;
    const passesCustom = usd >= customMin && usd <= customMax;

    return (anyBucket ? passesBucket && passesCustom : passesCustom);
  };

  // Count how many user fridge ingredients match a recipe
  const countMatchingIngredients = (recipe) => {
    if (!ingredients.length) return 0;
    
    const fridgeIngredientNames = ingredients.map(ing => ing.name.toLowerCase());
    // Use extendedIngredients from Spoonacular API
    const recipeIngredients = recipe.extendedIngredients || [];
    
    let matchCount = 0;
    recipeIngredients.forEach(recipeIng => {
      const recipeIngName = recipeIng.name.toLowerCase();
      if (fridgeIngredientNames.some(fridgeName => 
        recipeIngName.includes(fridgeName) || fridgeName.includes(recipeIngName)
      )) {
        matchCount++;
      }
    });
    
    return matchCount;
  };

  // Sort recipes by fridge ingredient matches (highest first)
  const sortRecipesByFridgeMatches = (recipesToSort) => {
    if (!ingredients.length) return recipesToSort;
    
    return [...recipesToSort].sort((a, b) => {
      const aMatches = countMatchingIngredients(a);
      const bMatches = countMatchingIngredients(b);
      return bMatches - aMatches;
    });
  };

  // Load a full batch once (when replace === true) and then page client-side.
  async function loadPage(nextOffset, replace = false, filtersToUse = null) {
    setLoading(true);
    setErr("");

    try {
      // Use provided filters or fall back to current filters state
      const currentFilters = filtersToUse !== null ? filtersToUse : filters;

      // When replacing (initial load or new filters), fetch a larger batch up front
      if (replace) {
        // Request the backend which uses the cached Mongo dataset
        const res = await backendSearchRecipes({
          filters: currentFilters,
          fridgeIngredients: ingredients.map((i) => i.name),
          offset: 0,
          limit: FULL_FETCH_SIZE,
        });
        const results = Array.isArray(res) ? res : (res.results || []);

        // Apply price filter client-side with the correct filter state
        const filtered = results.filter((recipe) => priceFilter(recipe, currentFilters));

        // If user has fridge ingredients, only include recipes that match at least one ingredient
        let finalRecipes = filtered;
        if (ingredients.length > 0) {
          finalRecipes = filtered.filter((recipe) => countMatchingIngredients(recipe) > 0);
          finalRecipes = sortRecipesByFridgeMatches(finalRecipes);
        }

        // Store full set in memory and expose the first page to the UI
        setAllRecipes(finalRecipes);
        const firstSlice = finalRecipes.slice(0, LOAD_SIZE);
        setRecipes(firstSlice);
        setOffset(firstSlice.length);
        setHasMore(firstSlice.length < finalRecipes.length);
      } else {
        // Not replacing: this call comes from the intersection observer when client-side paging.
        // If we have the full set in memory, just page from it.
        if (allRecipes) {
          const nextSlice = allRecipes.slice(nextOffset, nextOffset + LOAD_SIZE);
          setRecipes((prev) => [...prev, ...nextSlice]);
          setOffset(nextOffset + nextSlice.length);
          setHasMore(nextOffset + nextSlice.length < allRecipes.length);
        }
      }
    } catch (e) {
      setErr(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // Apply sidebar filters -> refresh list from page 0
  function applyFilters(newFilters) {
    setFilters(newFilters);
    setOffset(0);
    setHasMore(true);
    // Pass newFilters directly to avoid closure issue with stale filters
    loadPage(0, true, newFilters);
  }

  // Auto-load popular when entering the Recipes tab the first time
  useEffect(() => {
    if (activeTab === "recipes" && recipes.length === 0 && !loading) {
      loadPage(0, true);
    }
  }, [activeTab]);

  // When fridge ingredients change while viewing the Recipes tab, reload the full list
  // We guard so we don't duplicate the initial load that runs when first entering the tab.
  useEffect(() => {
    if (activeTab !== "recipes") return;
    // If we haven't loaded any recipes yet, let the existing activeTab effect handle the initial load
    if (recipes.length === 0) return;
    if (loading) return;

    // Refresh the full fetch so the fridge-matching/sort is recomputed
    loadPage(0, true);
  }, [ingredients, activeTab]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (activeTab !== "recipes") return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          // If we have the full set in memory, page client-side. Otherwise request another page.
          if (allRecipes) {
            const nextSlice = allRecipes.slice(offset, offset + LOAD_SIZE);
            setRecipes((prev) => [...prev, ...nextSlice]);
            setOffset(offset + nextSlice.length);
            setHasMore(offset + nextSlice.length < allRecipes.length);
          } else {
            // Pass current filters to avoid stale closure
            loadPage(offset, false, filters);
          }
        }
      },
      { rootMargin: "800px 0px" } // prefetch before hitting bottom
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [activeTab, hasMore, loading, offset, filters]); // Added filters to dependency


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
              Welcome, {user?.displayName || "User"}!
            </h1>
            <button
              onClick={() => setShowSidebar(true)}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-7 h-7 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation Overlay */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
            showSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setShowSidebar(false)}
        />

        {/* Sidebar */}
        <div
          className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transition-transform duration-300 z-50 ${
            showSidebar ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setShowSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-colors ${
                  activeTab === "home"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="font-medium text-lg">Home</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("recipes");
                  setShowSidebar(false);
                  if (recipes.length === 0 && !loading) {
                    loadPage(0, true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-colors ${
                  activeTab === "recipes"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-6 h-6" />
                <span className="font-medium text-lg">Recipes</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("blog");
                  setShowSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-colors ${
                  activeTab === "blog"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="font-medium text-lg">Blog</span>
              </button>
            </nav>

            {/* Logout at Bottom */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  handleLogout();
                  setShowSidebar(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-medium text-lg">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </>

      {/* Main Content */}
      <main className="px-6 lg:px-12 py-8">
        {activeTab === "home" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Your Smart Fridge</h2>
              <p className="text-gray-600">Click the fridge to view your ingredients</p>
            </div>

            {/* Fridge Container with Subtle Background */}
            <div className="relative max-w-4xl mx-auto">
              {/* Subtle radial gradient background */}
              <div className="absolute inset-0 bg-gradient-radial from-green-50/30 via-transparent to-orange-50/20 rounded-3xl transform scale-110 -z-10"></div>
              <div className="relative bg-gradient-to-br from-white/80 via-gray-50/60 to-white/90 rounded-2xl p-8 shadow-sm border border-gray-100/50">
                <Fridge3D ingredients={ingredients} onIngredientClick={handleIngredientClick} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "recipes" && (
          <section className="grid lg:grid-cols-[20rem_1fr] gap-6">
            {/* Sidebar filters */}
            <RecipeFiltersSidebar value={filters} onChange={applyFilters} />

            {/* Results area */}
            <div className="min-h-[60vh]">
              <header className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Recipes</h2>
                <p className="text-gray-600 text-lg">Filter and scroll to load more.</p>
              </header>

              {err && <p className="text-red-600 mb-3">{err}</p>}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setOpenId(r.id)}
                    className="text-left border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
                  >
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-40 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      {/* Clamp title to 2 lines */}
                      <div
                        className="font-semibold text-base"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        title={r.title}
                      >
                        {r.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {r.readyInMinutes ? `${r.readyInMinutes} min` : ""}
                        {r.readyInMinutes && r.servings ? " • " : ""}
                        {r.servings ? `${r.servings} servings` : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {loading && <p className="text-gray-500 mt-4">Loading…</p>}
              {/* sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-1" />

              {/* Details modal */}
              {openId && <RecipeModal id={openId} onClose={() => setOpenId(null)} />}
            </div>
          </section>
        )}

        {activeTab === "blog" && <Blog />}
      </main>

      {/* Side Panel */}
      <SidePanel 
        ingredient={selectedIngredient} 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)}
        onEdit={handleEditIngredient}
        onDelete={handleDeleteIngredient}
      />

      {/* Manual Ingredient Form */}
      <ManualIngredientForm
        isOpen={showManualForm}
        onClose={() => {
          setShowManualForm(false);
          setEditingIngredient(null);
        }}
        onSave={handleSaveIngredient}
        editingIngredient={editingIngredient}
      />

      {/* Combined Add to Fridge Button - Only on Home Page */}
      {activeTab === "home" && (
        <>
          <AddToFridgeButton
            onChooseManual={() => {
              setEditingIngredient(null);
              setShowManualForm(true);
            }}
            onChoosePhoto={() => setShowPhotoModal(true)}
            isProcessing={processing}
          />

          {/* Photo Upload Handler (no button, just functionality) */}
          <PhotoUploadButton 
            onIngredientsUpdate={handleIngredientsUpdate}
            showModal={showPhotoModal}
            setShowModal={setShowPhotoModal}
            processing={processing}
            setProcessing={setProcessing}
          />
        </>
      )}
    </div>
  )
}
