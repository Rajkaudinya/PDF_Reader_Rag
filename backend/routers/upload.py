from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from backend.config import UPLOAD_DIR
from backend.services.pdf_processor import process_pdf
from backend.services.embeddings import add_to_vector_store
import logging

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)

@router.post("")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF file, extract its text, and add it to the vector store.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_path = os.path.join(str(UPLOAD_DIR), file.filename)
    
    try:
        # Save file to uploads directory
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process PDF (Extract text and chunk)
        chunks = process_pdf(file_path)
        
        # Add to vector store
        add_to_vector_store(chunks)
        
        # Get basic info
        page_count = len(set([chunk.metadata.get("page") for chunk in chunks]))
        
        return {
            "message": "File uploaded and processed successfully",
            "filename": file.filename,
            "chunks": len(chunks),
            "pages": page_count
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        # Clean up file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))
