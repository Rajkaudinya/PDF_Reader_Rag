"""
Embedding & FAISS Vector Store Service
Handles embedding generation, vector store creation, persistence, and retrieval.
"""

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from backend.config import GOOGLE_API_KEY, EMBEDDING_MODEL, VECTOR_STORE_DIR, RETRIEVAL_K
import logging
import os

logger = logging.getLogger(__name__)

# Global vector store instance
_vector_store = None
_embeddings = None


def get_embeddings():
    """Get or initialize the embedding model."""
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL,
            google_api_key=GOOGLE_API_KEY,
            task_type="retrieval_document",
        )
    return _embeddings


def get_vector_store():
    """Get the current vector store instance."""
    global _vector_store
    return _vector_store


def create_vector_store(chunks: list):
    """
    Create a new FAISS vector store from document chunks.
    Overwrites any existing store.
    """
    global _vector_store
    embeddings = get_embeddings()

    _vector_store = FAISS.from_documents(chunks, embeddings)
    save_index()
    logger.info(f"Created new vector store with {len(chunks)} chunks")
    return _vector_store


def add_to_vector_store(chunks: list):
    """
    Add new document chunks to the existing vector store.
    If no store exists, create a new one.
    """
    global _vector_store
    embeddings = get_embeddings()

    if _vector_store is None:
        return create_vector_store(chunks)

    new_store = FAISS.from_documents(chunks, embeddings)
    _vector_store.merge_from(new_store)
    save_index()
    logger.info(f"Added {len(chunks)} chunks to existing vector store")
    return _vector_store


def save_index():
    """Persist the FAISS index to disk."""
    global _vector_store
    if _vector_store is not None:
        index_path = str(VECTOR_STORE_DIR)
        _vector_store.save_local(index_path)
        logger.info(f"FAISS index saved to {index_path}")


def load_index():
    """Load a persisted FAISS index from disk."""
    global _vector_store
    index_path = str(VECTOR_STORE_DIR)

    index_file = os.path.join(index_path, "index.faiss")
    if os.path.exists(index_file):
        embeddings = get_embeddings()
        _vector_store = FAISS.load_local(
            index_path,
            embeddings,
            allow_dangerous_deserialization=True,
        )
        logger.info("FAISS index loaded from disk")
        return True
    else:
        logger.info("No existing FAISS index found")
        return False


def get_retriever(k: int = RETRIEVAL_K):
    """
    Get a retriever from the vector store.
    Returns None if no vector store exists.
    """
    global _vector_store
    if _vector_store is None:
        return None
    return _vector_store.as_retriever(search_kwargs={"k": k})


def clear_vector_store():
    """Clear the vector store and delete persisted index."""
    global _vector_store
    _vector_store = None
    index_file = os.path.join(str(VECTOR_STORE_DIR), "index.faiss")
    pkl_file = os.path.join(str(VECTOR_STORE_DIR), "index.pkl")
    if os.path.exists(index_file):
        os.remove(index_file)
    if os.path.exists(pkl_file):
        os.remove(pkl_file)
    logger.info("Vector store cleared")
    

def reindex_all_files():
    """
    Clear the vector store and re-index all files in the upload directory.
    """
    from backend.config import UPLOAD_DIR
    from backend.services.pdf_processor import process_pdf
    import os
    
    logger.info("Starting re-indexing of all files...")
    clear_vector_store()
    
    files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(".pdf")]
    if not files:
        logger.info("No files found to re-index")
        return
        
    for filename in files:
        file_path = os.path.join(UPLOAD_DIR, filename)
        try:
            chunks = process_pdf(file_path)
            add_to_vector_store(chunks)
            logger.info(f"Re-indexed {filename}")
        except Exception as e:
            logger.error(f"Failed to re-index {filename}: {e}")
            
    logger.info("Re-indexing complete")
