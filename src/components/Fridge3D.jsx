import { useState, useEffect } from "react";
import { X } from "lucide-react"

export default function Fridge3D({ ingredients, onIngredientClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFridgeClick = () => { 
    if (ingredients.length > 0) {
      setIsOpen(true);
    }
  }

  const handleCloseFridge = () => {
    setIsOpen(false);
  }

  // Close fridge when pressing Escape key
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

return (
  <div className="relative w-full max-w-2xl mx-auto perspective-1000">
    {/* Fridge Container */}
    <div 
      className="relative w-full aspect-[3/4] max-h-[600px]"
      onClick={isOpen ? handleCloseFridge : undefined}
    >
      {/* Fridge Body */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 rounded-2xl shadow-2xl border-4 border-gray-400">
        {/* Top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-t-xl" />

        {/* Side shadows for depth */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent rounded-l-xl" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/30 to-transparent rounded-r-xl" />
      </div>

      {/* Fridge Door */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-2xl shadow-2xl border-4 border-gray-400 cursor-pointer transition-all duration-700 origin-left ${
          isOpen ? "rotate-y-[-85deg] translate-x-[-20px]" : "rotate-y-0"
        }`}
        onClick={handleFridgeClick}
        style={{
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Door surface details */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          {/* Metallic shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10" />

          {/* Vertical highlight stripe */}
          <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/40 to-transparent" />

          {/* Door edge depth */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/30 to-transparent" />
        </div>

        {/* Door Handle */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-32 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 rounded-full shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-l-full" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/40 rounded-r-full" />
        </div>

        {/* Door Compartments */}
        <div className="absolute top-8 left-8 right-20 space-y-4">
          <div className="h-16 bg-white/20 rounded-lg border border-gray-400/30 shadow-inner" />
          <div className="h-12 bg-white/20 rounded-lg border border-gray-400/30 shadow-inner" />
          <div className="h-12 bg-white/20 rounded-lg border border-gray-400/30 shadow-inner" />
        </div>

        {/* Brand Logo */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500/30 font-bold text-2xl tracking-wider">
          AI-NGREDIENT
        </div>
      </div>

      {/* Fridge Interior (visible when open) */}
      <div
        className={`absolute inset-4 bg-gradient-to-br from-blue-50 to-white rounded-xl transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interior light glow */}
        <div className="absolute inset-0 bg-gradient-radial from-yellow-100/50 via-transparent to-transparent rounded-xl" />

        {/* Close Button */}
        <button
          onClick={handleCloseFridge}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
          title="Close fridge"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Shelves */}
        <div className="relative h-full p-4 space-y-6">
          {ingredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-gray-400 text-lg font-medium">Your fridge is empty!</div>
              <div className="text-gray-500 text-sm">Click the camera button to add ingredients</div>
            </div>
          ) : (
            <>
              {/* Shelf 1 */}
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent rounded-full shadow-md" />
                <div className="grid grid-cols-4 gap-3 pb-4">
                  {ingredients.slice(0, 4).map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onIngredientClick?.(ingredient)
                      }}
                      className="aspect-square bg-white rounded-lg shadow-md hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center text-4xl border-2 border-gray-200"
                    >
                      {ingredient.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shelf 2 */}
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent rounded-full shadow-md" />
                <div className="grid grid-cols-4 gap-3 pb-4">
                  {ingredients.slice(4, 8).map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onIngredientClick?.(ingredient)
                      }}
                      className="aspect-square bg-white rounded-lg shadow-md hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center text-4xl border-2 border-gray-200"
                    >
                      {ingredient.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shelf 3 */}
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent rounded-full shadow-md" />
                <div className="grid grid-cols-4 gap-3 pb-4">
                  {ingredients.slice(8, 12).map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onIngredientClick?.(ingredient)
                      }}
                      className="aspect-square bg-white rounded-lg shadow-md hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center text-4xl border-2 border-gray-200"
                    >
                      {ingredient.icon}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click instruction when closed and has ingredients */}
      {!isOpen && ingredients.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 text-white px-6 py-3 rounded-full text-sm font-medium animate-pulse">
            Click to open fridge
          </div>
        </div>
      )}
    </div>

  </div>
)
}

