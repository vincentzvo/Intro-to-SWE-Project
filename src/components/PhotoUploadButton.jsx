import { useState } from "react"
import { Camera, Image, X } from "lucide-react"
import { compressAndConvertToPNG } from "../utils/imageUtils"
import WebcamCapture from "./WebcamCapture"

export default function PhotoUploadButton({ onIngredientsUpdate, showModal, setShowModal, processing, setProcessing }) {
  const [showWebcam, setShowWebcam] = useState(false);

  const processImage = async (file) => {
    try {
      setProcessing(true)
      console.log('Original file:', file.name, `${(file.size / 1024 / 1024).toFixed(2)} MB`)
      
      // Compress and convert to PNG
      const compressedPNG = await compressAndConvertToPNG(file)
      
      console.log('Compressed PNG:', compressedPNG.name, `${(compressedPNG.size / 1024 / 1024).toFixed(2)} MB`)
      console.log('Compression ratio:', `${((1 - compressedPNG.size / file.size) * 100).toFixed(1)}% smaller`)
      
      // Convert to base64 data URL for n8n
      const reader = new FileReader()
      const base64DataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(compressedPNG)
      })
      
      // Upload to n8n webhook with expected format
      console.log('Uploading to n8n webhook...')
      const response = await fetch('https://jack-ferreri.app.n8n.cloud/webhook/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64DataUrl,
          filename: compressedPNG.name
        })
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('n8n response:', result)
      
      // Extract ingredients from webhook response
      // Response format: { ingredients: [...] }
      if (result && result.ingredients && result.ingredients.length > 0) {
        const ingredients = result.ingredients
        console.log(`Found ${ingredients.length} ingredients:`, ingredients)
        
        // Update the fridge with real data
        if (onIngredientsUpdate) {
          onIngredientsUpdate(ingredients)
        }
      } else {
        console.log('Image uploaded but no ingredients found.')
      }
      
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Check if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || (window.innerWidth <= 768);
  };

  const handleTakePhoto = () => {
    setShowModal(false);
    
    if (isMobileDevice()) {
      // On mobile, use native camera
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          await processImage(file)
        }
      }
      
      input.click()
    } else {
      // On desktop, use webcam
      setShowWebcam(true);
    }
  }

  const handleWebcamCapture = async (file) => {
    await processImage(file);
  };

  const handleChoosePhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await processImage(file)
      }
    }
    
    input.click()
    setShowModal(false)
  }

  return (
    <>
      {/* Webcam Capture Modal */}
      <WebcamCapture
        isOpen={showWebcam}
        onClose={() => setShowWebcam(false)}
        onCapture={handleWebcamCapture}
      />

      {/* Loading Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
            {/* Spinner */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Analyzing your ingredients...</h3>
              <p className="text-gray-600">This may take a minute. Please wait while we process your photo.</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>

            <p className="text-center text-sm text-gray-500">Do not close this window</p>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add Ingredients Photo</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tips for Best Results */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">📸 Tips for Best Results:</h4>
              <ul className="text-blue-800 text-xs space-y-1">
                <li>• Take photos <strong>close up</strong> to the ingredients</li>
                <li>• Use <strong>good lighting</strong> (natural light works best)</li>
                <li>• Keep ingredients <strong>clearly visible</strong></li>
                <li>• Avoid shadows and glare</li>
                <li>• Center the items in the frame</li>
              </ul>
            </div>

            {/* Modal Content */}
            <p className="text-gray-600 text-sm">
              Choose how you'd like to add your ingredients photo
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleTakePhoto}
                className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-4 transition-all duration-200 hover:scale-105 font-medium shadow-md"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>

              <button
                onClick={handleChoosePhoto}
                className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-4 transition-all duration-200 hover:scale-105 font-medium shadow-md"
              >
                <Image className="w-5 h-5" />
                Choose from Photos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

