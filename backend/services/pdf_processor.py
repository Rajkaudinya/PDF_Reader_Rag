"""
PDF Processor Service
Handles text extraction from PDFs and document chunking.
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from backend.config import CHUNK_SIZE, CHUNK_OVERLAP
import logging

logger = logging.getLogger(__name__)


def extract_text(file_path: str) -> list:
    """
    Extract text from a PDF file using PyPDFLoader.
    Returns a list of LangChain Document objects (one per page).
    """
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        logger.info(f"Extracted {len(documents)} pages from {file_path}")
        return documents
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        raise


def chunk_documents(documents: list) -> list:
    """
    Split documents into smaller chunks using RecursiveCharacterTextSplitter.
    Each chunk retains metadata (source filename, page number).
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = text_splitter.split_documents(documents)
    logger.info(f"Created {len(chunks)} chunks from {len(documents)} documents")
    return chunks


def process_pdf(file_path: str) -> list:
    """
    Full pipeline: Extract text from PDF and split into chunks.
    """
    documents = extract_text(file_path)
    chunks = chunk_documents(documents)
    return chunks
