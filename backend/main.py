from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routers import upload, qa
from backend.services.embeddings import load_index
from backend.config import FRONTEND_DIR
import uvicorn
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Reader RAG API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(qa.router)

# Load existing index on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up and loading FAISS index...")
    load_index()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Mount frontend static files
# Note: In production, you'd typically serve the frontend through Nginx or similar
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    logger.warning(f"Frontend directory not found at {FRONTEND_DIR}")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
