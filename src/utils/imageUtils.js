/**
 * Compresses and converts an image file to PNG format
 * @param {File} file - The image file to process
 * @param {number} quality - Compression quality (0-1), default 0.9 for PNG
 * @param {number} maxWidth - Maximum width in pixels, default 1920
 * @param {number} maxHeight - Maximum height in pixels, default 1920
 * @returns {Promise<File>} - Compressed PNG file
 */
export async function compressAndConvertToPNG(
  file, 
  quality = 0.9, 
  maxWidth = 1920, 
  maxHeight = 1920
) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to PNG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new File object with PNG extension
            const fileName = file.name.split('.')[0] + '.png';
            const compressedFile = new File(
              [blob], 
              fileName,
              { type: 'image/png' }
            );
            
            resolve(compressedFile);
          },
          'image/png',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

