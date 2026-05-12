import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
VECTOR_STORE_DIR = BASE_DIR / "vector_store"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(exist_ok=True)
VECTOR_STORE_DIR.mkdir(exist_ok=True)

# Google API Key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Chunking settings
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Retrieval settings
RETRIEVAL_K = 4

# LLM settings
LLM_MODEL = "gemini-3.1-flash-lite"
LLM_TEMPERATURE = 0.3

# Embedding model
EMBEDDING_MODEL = "models/gemini-embedding-2"
