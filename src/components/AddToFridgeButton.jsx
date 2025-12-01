import { useState } from "react";
import { Plus, Camera, Edit, X } from "lucide-react";

export default function AddToFridgeButton({ onChooseManual, onChoosePhoto, isProcessing }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      {/* Main Add to Fridge Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setShowOptions(true)}
          disabled={isProcessing}
          className={`bg-green-500 hover:bg-green-600 text-white rounded-xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-3 font-medium ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="w-5 h-5" />
          {isProcessing ? 'Processing...' : 'Add to Fridge'}
        </button>
      </div>

      {/* Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add to Fridge</h3>
              <button
                onClick={() => setShowOptions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <p className="text-gray-600 text-sm">
              Choose how you'd like to add ingredients
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setShowOptions(false);
                  onChooseManual();
                }}
                className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-4 transition-all duration-200 hover:scale-105 font-medium shadow-md"
              >
                <Edit className="w-5 h-5" />
                Add Manually
              </button>

              <button
                onClick={() => {
                  setShowOptions(false);
                  onChoosePhoto();
                }}
                className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-4 transition-all duration-200 hover:scale-105 font-medium shadow-md"
              >
                <Camera className="w-5 h-5" />
                Add from Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

