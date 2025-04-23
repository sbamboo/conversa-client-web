import { ConversaApiV0 } from './api.js';
import { showNotice } from '../../js/utils.js';
import { initializeTabs } from '../../js/tabs.js';
import { initializeRawTab } from '../../raw/js/raw.js';

let api;

// Initialize the application
function init() {
    const apiUrlInput = document.getElementById('apiUrl');
    api = new ConversaApiV0(apiUrlInput.value);

    // Initialize tabs
    initializeTabs();
    
    // Initialize raw tab
    initializeRawTab(apiUrlInput);

    // Initialize login form
    initializeLoginForm();

    // Initialize logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

function initializeLoginForm() {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const result = await api.login(username, password);
        
        if (result.success) {
            loginForm.classList.add('hidden');
            document.getElementById('chat-container').classList.remove('hidden');
            loadConversations();
            showNotice('Logged in successfully', 'success');
        } else {
            showNotice(result.error, 'error');
        }
    });
}

async function loadConversations() {
    const result = await api.getAllMessages();
    
    if (result.success) {
        const conversations = groupMessagesByConversation(result.data);
        displayConversations(conversations);
    } else {
        showNotice(result.error, 'error');
    }
}

function groupMessagesByConversation(messages) {
    const conversations = {};
    
    messages.forEach(message => {
        const key = message.author;
        if (!conversations[key]) {
            conversations[key] = [];
        }
        conversations[key].push(message);
    });

    return conversations;
}

function displayConversations(conversations) {
    const container = document.getElementById('conversations');
    container.innerHTML = '';

    Object.entries(conversations).forEach(([author, messages]) => {
        const conversationEl = document.createElement('div');
        conversationEl.className = 'conversation';
        
        const authorEl = document.createElement('h3');
        authorEl.textContent = `Conversation with ${messages[0].display_name}`;
        conversationEl.appendChild(authorEl);

        messages.forEach(message => {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${message.author === api.userId ? 'sent' : 'received'}`;
            
            const titleEl = document.createElement('strong');
            titleEl.textContent = message.title;
            messageEl.appendChild(titleEl);

            const contentEl = document.createElement('p');
            contentEl.textContent = message.message;
            messageEl.appendChild(contentEl);

            if (message.image) {
                const imageEl = document.createElement('img');
                imageEl.src = message.image;
                imageEl.alt = message.title;
                messageEl.appendChild(imageEl);
            }

            conversationEl.appendChild(messageEl);
        });

        container.appendChild(conversationEl);
    });
}

function handleLogout() {
    api.logout();
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('chat-container').classList.add('hidden');
    showNotice('Logged out successfully', 'success');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);