/**
 * DocuMind AI Frontend Logic
 * Handles file uploads, Q&A interactions, and UI updates.
 */

const API_BASE = ''; // Same origin

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const documentList = document.getElementById('document-list');
const typingIndicator = document.getElementById('typing-indicator');
const uploadProgressContainer = document.getElementById('upload-progress-container');
const uploadProgressFill = document.getElementById('upload-progress-fill');
const uploadStatusText = document.getElementById('upload-status-text');
const clearChatBtn = document.getElementById('clear-chat');
const backendStatus = document.getElementById('backend-status');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    fetchDocuments();
});

// --- Backend Utilities ---

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        if (response.ok) {
            backendStatus.classList.remove('offline');
            backendStatus.innerHTML = '<span class="dot"></span> Backend Connected';
        } else {
            setBackendOffline();
        }
    } catch (error) {
        setBackendOffline();
    }
}

function setBackendOffline() {
    backendStatus.classList.add('offline');
    backendStatus.innerHTML = '<span class="dot"></span> Backend Offline';
}

async function fetchDocuments() {
    try {
        const response = await fetch(`${API_BASE}/api/documents`);
        const data = await response.json();
        renderDocumentList(data.documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}

// --- Upload Logic ---

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
});

async function handleUpload(file) {
    if (!file.name.endsWith('.pdf')) {
        showToast('Please upload a PDF file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Update UI
    dropZone.classList.add('hidden');
    uploadProgressContainer.classList.remove('hidden');
    uploadProgressFill.style.width = '20%';
    uploadStatusText.innerText = `Uploading ${file.name}...`;

    try {
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });

        uploadProgressFill.style.width = '100%';
        
        if (response.ok) {
            const result = await response.json();
            showToast(`Successfully uploaded ${result.filename}`, 'success');
            fetchDocuments();
            addMessage('bot', `I've successfully indexed **${result.filename}**. It has ${result.pages} pages and I've broken it down into ${result.chunks} chunks for better search. You can now ask questions about it!`);
        } else {
            const error = await response.json();
            showToast(`Upload failed: ${error.detail}`, 'error');
        }
    } catch (error) {
        showToast('Upload failed. Connection error.', 'error');
    } finally {
        setTimeout(() => {
            uploadProgressContainer.classList.add('hidden');
            dropZone.classList.remove('hidden');
            uploadProgressFill.style.width = '0%';
        }, 1500);
    }
}

// --- Chat Logic ---

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    // Add user message
    addMessage('user', question);
    userInput.value = '';
    
    // Show typing
    typingIndicator.classList.remove('hidden');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        if (response.ok) {
            const data = await response.json();
            addMessage('bot', data.answer, data.sources);
        } else {
            showToast('Failed to get answer.', 'error');
            addMessage('bot', "I'm sorry, I encountered an error while processing your question.");
        }
    } catch (error) {
        showToast('Connection error.', 'error');
        addMessage('bot', "I couldn't reach the server. Please check your connection.");
    } finally {
        typingIndicator.classList.add('hidden');
    }
});

function addMessage(role, text, sources = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const icon = role === 'bot' ? 'fas fa-robot' : 'fas fa-user';
    
    let sourcesHtml = '';
    if (sources && sources.length > 0) {
        sourcesHtml = `<div class="sources">
            ${sources.map(s => `<span class="source-tag"><i class="fas fa-book-open"></i> ${s.filename} (p. ${s.page})</span>`).join('')}
        </div>`;
    }

    msgDiv.innerHTML = `
        <div class="avatar"><i class="${icon}"></i></div>
        <div class="content">
            <p>${formatText(text)}</p>
            ${sourcesHtml}
        </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Basic markdown formatting
function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

clearChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    addMessage('bot', "Chat cleared. How else can I help you?");
});

// --- UI Rendering ---

function renderDocumentList(docs) {
    if (!docs || docs.length === 0) {
        documentList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ghost"></i>
                <p>No documents yet</p>
            </div>
        `;
        return;
    }

    documentList.innerHTML = docs.map(doc => `
        <div class="doc-item">
            <div class="doc-icon"><i class="fas fa-file-pdf"></i></div>
            <div class="doc-info">
                <div class="doc-name">${doc}</div>
                <div class="doc-meta">Indexed & Ready</div>
            </div>
        </div>
    `).join('');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
