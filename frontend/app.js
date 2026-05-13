/**
 * DocuMind AI Frontend Logic
 * Handles file uploads, Q&A interactions, and UI updates.
 */

const API_BASE = ''; // Same origin

// DOM Elements (will be initialized in DOMContentLoaded)
let dropZone, fileInput, chatForm, userInput, clearChatBtn, getStartedBtn, landingPage, appPage, chatMessages, documentList, typingIndicator, uploadProgressContainer, uploadProgressFill, uploadStatusText;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    dropZone = document.getElementById('drop-zone');
    fileInput = document.getElementById('file-input');
    chatForm = document.getElementById('chat-form');
    userInput = document.getElementById('user-input');
    clearChatBtn = document.getElementById('clear-chat');
    getStartedBtn = document.getElementById('get-started-btn');
    landingPage = document.getElementById('landing-page');
    appPage = document.getElementById('app-page');
    chatMessages = document.getElementById('chat-messages');
    documentList = document.getElementById('document-list');
    typingIndicator = document.getElementById('typing-indicator');
    uploadProgressContainer = document.getElementById('upload-progress-container');
    uploadProgressFill = document.getElementById('upload-progress-fill');
    uploadStatusText = document.getElementById('upload-status-text');

    // Attach Event Listeners
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            sessionStorage.setItem('appStarted', 'true');
            showApp();
        });
    }

    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    if (dropZone) {
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
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleUpload(file);
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            chatMessages.innerHTML = '';
            addMessage('bot', "Chat cleared. How else can I help you?");
        });
    }

    // Initial load
    checkBackendHealth();
    fetchDocuments();
    scrollToBottom();
    
    // Check session persistence
    if (sessionStorage.getItem('appStarted') === 'true') {
        showApp();
    }
});

function showApp() {
    if (landingPage && appPage) {
        landingPage.style.display = 'none';
        appPage.classList.remove('hidden');
        appPage.style.display = 'grid';
        scrollToBottom();
    }
}

function scrollToBottom() {
    if (chatMessages) {
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
}

// --- Backend Utilities ---

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        // Silently handle health check for the new UI
    } catch (error) {
        console.warn('Backend is offline');
    }
}

async function fetchDocuments() {
    try {
        const response = await fetch(`${API_BASE}/api/upload`);
        const data = await response.json();
        renderDocumentList(data.files);
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}

// --- Upload Logic ---

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

async function handleChatSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const question = userInput.value.trim();
    if (!question) return;

    // Add user message
    addMessage('user', question);
    userInput.value = '';
    
    // Show typing
    typingIndicator.classList.remove('hidden');
    scrollToBottom();

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
}

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
    scrollToBottom();
}

function formatText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

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
                <div class="doc-name" title="${doc.filename}">${doc.filename}</div>
                <div class="doc-meta">${(doc.size / 1024).toFixed(1)} KB</div>
            </div>
            <button class="delete-btn" onclick="deleteDocument('${doc.filename}')" title="Delete Document">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

async function deleteDocument(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}? This will remove it from the knowledge base.`)) {
        return;
    }

    try {
        showToast(`Deleting ${filename}...`, 'info');
        const response = await fetch(`${API_BASE}/api/upload/${filename}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast(`Deleted ${filename}`, 'success');
            fetchDocuments();
            addMessage('bot', `I've removed **${filename}** from my knowledge base and updated my index.`);
        } else {
            const error = await response.json();
            showToast(`Failed to delete: ${error.detail}`, 'error');
        }
    } catch (error) {
        showToast('Delete failed. Connection error.', 'error');
    }
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
    if (!container) return;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
