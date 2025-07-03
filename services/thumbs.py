import os
from PIL import Image
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class ThumbnailService:
    @staticmethod
    def generate_thumbnail(original_path, thumbnail_path):
        """Generate thumbnail for an image"""
        try:
            with Image.open(original_path) as img:
                # Convert to RGB if necessary (for PNG with transparency, etc.)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(current_app.config['THUMBNAIL_SIZE'], Image.Resampling.LANCZOS)
                
                # Save thumbnail with optimization
                img.save(thumbnail_path, 'JPEG', optimize=True, quality=85)
                
                # Check if thumbnail is under 30KB
                if os.path.getsize(thumbnail_path) > 30 * 1024:
                    # If too large, reduce quality
                    img.save(thumbnail_path, 'JPEG', optimize=True, quality=60)
                
                logger.info(f"Thumbnail generated: {thumbnail_path}")
                return True
                
        except Exception as e:
            logger.error(f"Error generating thumbnail: {str(e)}")
            # If thumbnail generation fails, remove the partial file
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)
            return False
    
    @staticmethod
    def process_uploaded_image(file_path):
        """Process uploaded image and generate thumbnail"""
        try:
            directory = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            
            # Create thumbnail path
            thumb_dir = os.path.join(directory, '.thumbs')
            os.makedirs(thumb_dir, exist_ok=True)
            
            # Generate thumbnail with same name but .jpg extension
            name, _ = os.path.splitext(filename)
            thumb_path = os.path.join(thumb_dir, f"{name}.jpg")
            
            return ThumbnailService.generate_thumbnail(file_path, thumb_path)
            
        except Exception as e:
            logger.error(f"Error processing uploaded image: {str(e)}")
            return False
