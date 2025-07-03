
import os
import boto3
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class ExternalStorageService:
    """Optional external storage for critical data persistence"""
    
    @staticmethod
    def is_enabled():
        return all([
            os.getenv('AWS_ACCESS_KEY_ID'),
            os.getenv('AWS_SECRET_ACCESS_KEY'),
            os.getenv('AWS_BUCKET_NAME')
        ])
    
    @staticmethod
    def backup_to_s3(local_path, s3_key):
        """Backup file to S3 for extra persistence"""
        if not ExternalStorageService.is_enabled():
            return False
            
        try:
            s3_client = boto3.client('s3')
            bucket = os.getenv('AWS_BUCKET_NAME')
            
            s3_client.upload_file(local_path, bucket, s3_key)
            logger.info(f"File backed up to S3: {s3_key}")
            return True
            
        except Exception as e:
            logger.error(f"S3 backup failed: {str(e)}")
            return False
