"""
RAG Chain Service
Orchestrates the retrieval and generation process using LangChain and Google Gemini.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from backend.config import GOOGLE_API_KEY, LLM_MODEL, LLM_TEMPERATURE
from backend.services.embeddings import get_retriever
import logging

logger = logging.getLogger(__name__)

# Define the system prompt
SYSTEM_PROMPT = """
You are a helpful and accurate assistant for a PDF Question Answering System.
Use the following pieces of retrieved context to answer the user's question. 
If you don't know the answer based on the context, say that you don't know. 
Do not try to make up an answer. Use three sentences maximum and keep the answer concise.

Context: {context}

Question: {question}

Helpful Answer:
"""

def format_docs(docs):
    """Format retrieved documents for the prompt."""
    formatted = []
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", "?")
        formatted.append(f"[Source: {source}, Page: {page}]\n{doc.page_content}")
    return "\n\n".join(formatted)

async def generate_answer(question: str):
    """
    Retrieve relevant context and generate an answer using Gemini.
    Returns a dictionary with the answer and the sources used.
    """
    try:
        retriever = get_retriever()
        if not retriever:
            return {
                "answer": "No documents have been uploaded yet. Please upload a PDF first.",
                "sources": []
            }

        llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=LLM_TEMPERATURE,
        )

        # Retrieve relevant docs
        retrieved_docs = await retriever.ainvoke(question)
        
        # Format context
        context_text = format_docs(retrieved_docs)
        
        # Create prompt
        prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)
        
        # Build chain
        chain = (
            {"context": lambda x: context_text, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        
        # Execute chain
        answer = await chain.ainvoke(question)
        
        # Extract unique sources
        sources = []
        seen_sources = set()
        for doc in retrieved_docs:
            source_info = {
                "filename": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", "?")
            }
            source_key = f"{source_info['filename']}-{source_info['page']}"
            if source_key not in seen_sources:
                sources.append(source_info)
                seen_sources.add(source_key)

        return {
            "answer": answer,
            "sources": sources
        }
        
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return {
            "answer": f"An error occurred while processing your question: {str(e)}",
            "sources": []
        }
