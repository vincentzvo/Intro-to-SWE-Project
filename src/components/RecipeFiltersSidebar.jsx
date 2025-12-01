import { useState, useEffect, useCallback, useRef } from "react";

// Option lists (trim as you like)
const DIETS = ["vegetarian","vegan","pescetarian","ketogenic","gluten free","paleo","primal","whole30"];
const CUISINES = ["African","American","British","Cajun","Caribbean","Chinese","Eastern European","European","French","German","Greek","Indian","Irish","Italian","Japanese","Jewish","Korean","Latin American","Mediterranean","Mexican","Middle Eastern","Nordic","Southern","Spanish","Thai","Vietnamese"];
const INTOLERANCES = ["Dairy","Egg","Gluten","Grain","Peanut","Seafood","Sesame","Shellfish","Soy","Sulfite","Tree Nut","Wheat"];

// UI price "buckets" in USD per serving; client-side using pricePerServing
const PRICE_BUCKETS = [
  { label: "$0 – $2", min: 0, max: 2 },
  { label: "$2 – $5", min: 2, max: 5 },
  { label: "$5 – $10", min: 5, max: 10 },
  { label: "Over $10", min: 10, max: Infinity },
];

export default function RecipeFiltersSidebar({ value, onChange }) {
  // local draft (so you can change without firing a fetch every click)
  const [draft, setDraft] = useState(value);
  const isInitialMount = useRef(true);

  // Only update draft when the parent's value changes (e.g., on reset or navigation)
  // Skip on initial mount to avoid unnecessary updates
  useEffect(() => { 
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setDraft(value); 
  }, [value]);

  // Memoized toggle for array filters (diets, cuisines, intolerances)
  // Using functional setState to avoid stale closure issues and unnecessary re-renders
  const toggle = useCallback((k, item) => {
    setDraft((prev) => {
      const arr = prev[k];
      const idx = arr.indexOf(item);
      const updated = idx > -1 
        ? arr.filter((_, i) => i !== idx)  // Remove item
        : [...arr, item];  // Add item
      return { ...prev, [k]: updated };
    });
  }, []);

  // Memoized toggle for price buckets
  const toggleBucket = useCallback((idx) => {
    setDraft((prev) => {
      const buckets = prev.priceBuckets;
      const pidx = buckets.indexOf(idx);
      const updated = pidx > -1
        ? buckets.filter((_, i) => i !== pidx)  // Remove bucket
        : [...buckets, idx];  // Add bucket
      return { ...prev, priceBuckets: updated };
    });
  }, []);

  // Memoized range setter for price/nutrition
  const setRange = useCallback((k, which, v) => {
    const n = v === "" ? "" : Number(v);
    setDraft((prev) => ({
      ...prev,
      [k]: { ...prev[k], [which]: isNaN(n) ? "" : n }
    }));
  }, []);

  // Memoized macro range handler
  const handleMacroChange = useCallback((k, min, max) => {
    setDraft((prev) => ({
      ...prev,
      [k]: { min, max }
    }));
  }, []);

  // Reset draft to parent value
  const handleReset = useCallback(() => {
    // Clear all filters and search
    const clearedFilters = {
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
    };
    setDraft(clearedFilters);
    // Also trigger the parent's applyFilters to reset recipes
    onChange(clearedFilters);
  }, [onChange]);

  // Apply and send to parent
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = useCallback(() => {
    setIsApplying(true);
    onChange(draft);
    // Reset the applying state after a short delay for visual feedback
    setTimeout(() => setIsApplying(false), 300);
  }, [draft, onChange]);

  return (
    <aside
      className="
        w-full md:w-72 shrink-0 border border-gray-200 rounded-xl bg-white
        md:sticky md:top-20
        md:max-h-[calc(100vh-6rem)] md:overflow-y-auto
        p-4
      "
    >
      {/* Search text */}
      <div className="mb-4">
        <input
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search recipes…"
          value={draft.query}
          onChange={(e) => setDraft((prev) => ({ ...prev, query: e.target.value }))}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleApply();
            }
          }}
        />
      </div>

      {/* Diet */}
      <Section title="Diet">
        {DIETS.map(d => (
          <Checkbox 
            key={d} 
            label={d} 
            checked={draft.diets.includes(d)} 
            onChange={() => toggle("diets", d)} 
          />
        ))}
      </Section>

      {/* Cuisine */}
      <Section title="Cuisine">
        <div className="grid grid-cols-2 gap-2">
          {CUISINES.map(c => (
            <Checkbox 
              key={c} 
              label={c} 
              checked={draft.cuisines.includes(c)} 
              onChange={() => toggle("cuisines", c)} 
            />
          ))}
        </div>
      </Section>

      {/* Intolerances */}
      <Section title="Intolerances">
        <div className="grid grid-cols-2 gap-2">
          {INTOLERANCES.map(i => (
            <Checkbox 
              key={i} 
              label={i} 
              checked={draft.intolerances.includes(i)} 
              onChange={() => toggle("intolerances", i)} 
            />
          ))}
        </div>
      </Section>

      {/* Price (client-side using pricePerServing) */}
      <Section title="Price per Serving (USD)">
        {PRICE_BUCKETS.map((b, idx) => (
          <Checkbox 
            key={b.label} 
            label={b.label} 
            checked={draft.priceBuckets.includes(idx)} 
            onChange={() => toggleBucket(idx)} 
          />
        ))}
        <div className="flex items-center gap-2 mt-2">
          <input 
            className="w-20 border rounded px-2 py-1" 
            inputMode="decimal" 
            placeholder="Min"
            value={draft.price.min ?? ""} 
            onChange={(e) => {
              const input = e.target.value;
              // Only update if empty or a valid number
              if (input === "" || !isNaN(input)) {
                setRange("price", "min", input);
              }
            }} 
          />
          <span>—</span>
          <input 
            className="w-20 border rounded px-2 py-1" 
            inputMode="decimal" 
            placeholder="Max"
            value={draft.price.max ?? ""} 
            onChange={(e) => {
              const input = e.target.value;
              // Only update if empty or a valid number
              if (input === "" || !isNaN(input)) {
                setRange("price", "max", input);
              }
            }} 
          />
        </div>
      </Section>

      {/* Nutrition ranges */}
      <MacroRange 
        title="Calories" 
        value={draft.calories} 
        onChange={(min, max) => handleMacroChange("calories", min, max)} 
      />
      <MacroRange 
        title="Protein (g)" 
        value={draft.protein} 
        onChange={(min, max) => handleMacroChange("protein", min, max)} 
      />
      <MacroRange 
        title="Carbs (g)" 
        value={draft.carbs} 
        onChange={(min, max) => handleMacroChange("carbs", min, max)} 
      />
      <MacroRange 
        title="Fat (g)" 
        value={draft.fat} 
        onChange={(min, max) => handleMacroChange("fat", min, max)} 
      />

      <div className="flex gap-2 mt-4">
        <button 
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors" 
          onClick={handleReset}
        >
          Reset
        </button>
        <button 
          className={`px-3 py-2 rounded text-white transition-colors font-medium flex-1 ${
            isApplying 
              ? 'bg-green-500 shadow-md' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={handleApply}
        >
          {isApplying ? '✓ Applied!' : 'Apply Filters'}
        </button>
      </div>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <div className="font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-600 transition-colors">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        className="cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
}

function MacroRange({ title, value, onChange }) {
  const handleMinChange = (e) => {
    const input = e.target.value;
    // Only update if empty or a valid number
    if (input === "" || !isNaN(input)) {
      onChange(input === "" ? "" : Number(input), value.max);
    }
  };

  const handleMaxChange = (e) => {
    const input = e.target.value;
    // Only update if empty or a valid number
    if (input === "" || !isNaN(input)) {
      onChange(value.min, input === "" ? "" : Number(input));
    }
  };

  return (
    <Section title={title}>
      <div className="flex items-center gap-2">
        <input 
          className="w-20 border rounded px-2 py-1" 
          inputMode="numeric" 
          placeholder="Min"
          value={value.min ?? ""} 
          onChange={handleMinChange}
        />
        <span>—</span>
        <input 
          className="w-20 border rounded px-2 py-1" 
          inputMode="numeric" 
          placeholder="Max"
          value={value.max ?? ""} 
          onChange={handleMaxChange}
        />
      </div>
    </Section>
  );
}
