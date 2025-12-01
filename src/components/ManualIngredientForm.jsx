import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

export default function ManualIngredientForm({ isOpen, onClose, onSave, editingIngredient = null }) {
  const [formData, setFormData] = useState({
    name: "",
    icon: "🥗",
    quantity: "",
    category: "Other",
  });

  // Populate form when editing
  useEffect(() => {
    if (editingIngredient) {
      setFormData({
        name: editingIngredient.name || "",
        icon: editingIngredient.icon || "🥗",
        quantity: editingIngredient.quantity || "",
        category: editingIngredient.category || "Other",
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        icon: "🥗",
        quantity: "",
        category: "Other",
      });
    }
  }, [editingIngredient, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const ingredientData = {
      ...formData,
      id: editingIngredient?.id || Date.now(),
    };

    onSave(ingredientData);
    onClose();
  };

  const commonEmojis = [
    "🥗", "🍅", "🥕", "🥦", "🧀", "🥚", "🍞", "🥛", "🍖", "🍗",
    "🥓", "🍔", "🍕", "🌮", "🥙", "🍝", "🍜", "🍲", "🥘", "🍱",
    "🍛", "🍣", "🍤", "🥟", "🍙", "🍚", "🥡", "🍌", "🍎", "🍊",
    "🍋", "🍇", "🍓", "🫐", "🍑", "🥝", "🍐", "🥥", "🥑", "🍆",
  ];

  const categories = ["Vegetable", "Fruit", "Dairy", "Meat", "Grain", "Snack", "Beverage", "Other"];

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        input::placeholder, select::placeholder {
          color: #d1d5db;
          opacity: 1;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingIngredient ? "Edit Ingredient" : "Add Ingredient Manually"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Ingredient Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ingredient Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tomato"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Choose Icon
            </label>
            <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto p-2 border-2 border-gray-200 rounded-lg">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    formData.icon === emoji ? "bg-green-100 ring-2 ring-green-500" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-2 text-center text-3xl">{formData.icon}</div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g., 2 pieces, 500g, 1 cup"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
            >
              {editingIngredient ? "Save Changes" : "Add Ingredient"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

