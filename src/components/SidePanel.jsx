import { X, Edit2, Trash2 } from "lucide-react"

export default function SidePanel({ ingredient, isOpen, onClose, onEdit, onDelete }) {
  if (!ingredient) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-orange-50">
            <h2 className="text-2xl font-bold text-gray-800">{ingredient.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Ingredient Icon */}
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-orange-100 rounded-2xl flex items-center justify-center text-7xl shadow-lg">
                {ingredient.icon}
              </div>
            </div>

            {/* Quick Info */}
            {(ingredient.quantity || ingredient.category) && (
              <div className="grid grid-cols-2 gap-4">
                {ingredient.quantity && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">Quantity</div>
                    <div className="text-lg font-bold text-blue-600">{ingredient.quantity}</div>
                  </div>
                )}
                {ingredient.category && (
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">Category</div>
                    <div className="text-lg font-bold text-purple-600 capitalize">{ingredient.category}</div>
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            {(ingredient.expiry || ingredient.container || ingredient.confidence) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 mb-3">Status</h4>
                
                {ingredient.expiry && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Freshness</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      ingredient.expiry === 'good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ingredient.expiry}
                    </span>
                  </div>
                )}
                
                {ingredient.container && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Container</span>
                    <span className="text-gray-900 font-medium capitalize">{ingredient.container}</span>
                  </div>
                )}
                
                {ingredient.confidence && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Detection Confidence</span>
                    <span className="text-gray-900 font-medium">{(ingredient.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Nutrition Facts */}
            {ingredient.nutrition && (
              <div className="bg-white border-2 border-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold border-b-8 border-gray-800 pb-2 mb-4">Nutrition Facts</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                    <span className="font-semibold text-gray-700">Calories</span>
                    <span className="font-bold text-gray-900">{ingredient.nutrition.calories}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                    <span className="font-semibold text-gray-700">Protein</span>
                    <span className="font-bold text-gray-900">{ingredient.nutrition.protein}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                    <span className="font-semibold text-gray-700">Carbs</span>
                    <span className="font-bold text-gray-900">{ingredient.nutrition.carbs}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                    <span className="font-semibold text-gray-700">Fat</span>
                    <span className="font-bold text-gray-900">{ingredient.nutrition.fat}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Fiber</span>
                    <span className="font-bold text-gray-900">{ingredient.nutrition.fiber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            {ingredient.description && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">About</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{ingredient.description}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onEdit?.(ingredient);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Edit2 className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${ingredient.name}?`)) {
                    onDelete?.(ingredient.id);
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
