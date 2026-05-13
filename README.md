# DocuMind AI - Futuristic PDF RAG Assistant 🚀

**DocuMind AI** is a state-of-the-art PDF Question Answering system built using Retrieval-Augmented Generation (RAG). It features a premium, futuristic glassmorphic UI and is powered by Google's latest Gemini 3.1 models for ultra-fast and accurate document intelligence.

![Landing Page Preview](https://via.placeholder.com/1200x600/0a0c14/00d1ff?text=DocuMind+AI+Futuristic+Interface)

## ✨ Key Features

- **Futuristic Glassmorphic UI**: A high-end, dark-themed interface with backdrop-blur effects, neon glows, and a "Quantum Core" landing page.
- **Instant Document Indexing**: Upload PDFs and have them chunked, embedded, and ready for search in seconds.
- **Intelligent Q&A**: Ask complex questions about your documents and receive concise, context-aware answers.
- **Source Transparency**: Every answer includes clickable metadata showing exactly which page and document the information came from.
- **Knowledge Base Management**: Easily list and delete documents from your index with real-time vector store synchronization.
- **Gemini 3.1 Powered**: Utilizes `gemini-3.1-flash-lite` for lightning-fast reasoning and `text-embedding-004` for high-precision retrieval.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Glassmorphism), Javascript (ES6+).
- **Backend**: FastAPI (Python 3.10+).
- **AI/LLM**: Google Generative AI (Gemini), LangChain.
- **Vector Database**: FAISS (Facebook AI Similarity Search).
- **Deployment**: Render (Auto-deploy via Blueprints).

## 🚀 Quick Start

### 1. Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rajkaudinya/PDF_Reader_Rag.git
   cd PDF_Reader_Rag
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Application**:
   ```bash
   python -m backend.main
   ```
   Open your browser at `http://localhost:8000`.

### 2. Deployment (Render)

The project includes a `render.yaml` blueprint for one-click deployment.
- Connect your GitHub repo to Render.
- Add your `GOOGLE_API_KEY` in the environment variables.
- Render will handle the build and deployment automatically.

## 📂 Project Structure

```text
PDF_Reader_Rag/
├── backend/
│   ├── routers/         # API Endpoints (Upload, QA)
│   ├── services/        # Business Logic (Embeddings, RAG Chain, PDF Processing)
│   ├── uploads/         # Temporary PDF storage
│   ├── vector_store/    # Local FAISS index persistence
│   ├── config.py        # Global settings & paths
│   └── main.py          # FastAPI Entry Point
├── frontend/
│   ├── app.js           # Frontend logic & Page transitions
│   ├── index.html       # Futuristic UI structure
│   └── styles.css       # Glassmorphic design system
├── render.yaml          # Deployment blueprint
└── requirements.txt     # Python dependencies
```

## 🧠 How it Works

1. **Ingestion**: PDFs are loaded via `PyPDFLoader` and split into chunks using `RecursiveCharacterTextSplitter`.
2. **Embedding**: Chunks are converted into high-dimensional vectors using Google's `text-embedding-004` model.
3. **Storage**: Vectors are stored in a local FAISS index for efficient similarity searching.
4. **Retrieval**: When a user asks a question, the system finds the top-K most relevant chunks.
5. **Generation**: The context + question are sent to `gemini-3.1-flash-lite` to produce a concise, accurate response.

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with 💙 by **Rajkaudinya**
