from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.rag_chain import generate_answer
from backend.services.embeddings import get_vector_store
import os
from backend.config import UPLOAD_DIR

router = APIRouter(prefix="/api", tags=["qa"])

class QuestionRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Endpoint to ask a question based on uploaded PDFs.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    result = await generate_answer(request.question)
    return result

@router.get("/documents")
async def list_documents():
    """
    Endpoint to list all uploaded documents.
    """
    files = []
    if os.path.exists(str(UPLOAD_DIR)):
        files = [f for f in os.listdir(str(UPLOAD_DIR)) if f.endswith(".pdf")]
    
    return {"documents": files}
