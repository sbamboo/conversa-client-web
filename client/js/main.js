import { ConversaApiV0 } from './api.js';
import { showNotice } from '../../js/utils.js';
import { initializeTabs } from '../../js/tabs.js';
import { initializeRawTab } from '../../raw/js/raw.js';

let api;

// Initialize the application
function init() {
    const apiUrlInput = document.getElementById('apiUrl');
    api = new ConversaApiV0(apiUrlInput.value);

    // Update API URL when input changes
    apiUrlInput.addEventListener('input', () => {
        api.updateUrl(apiUrlInput.value);
    });

    // Initialize tabs
    initializeTabs();
    
    // Initialize raw tab
    initializeRawTab(apiUrlInput);

    // Initialize login form
    initializeLoginForm();

    // Initialize message form
    initializeMessageForm();
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

function initializeMessageForm() {
    const messageForm = document.getElementById('message-form');
    const sendBtn = document.getElementById('send-btn');
    const editMessageId = document.getElementById('edit-message-id');

    sendBtn.addEventListener('click', async () => {
        const title = document.getElementById('message-title').value;
        const message = document.getElementById('message-content').value;
        const image = document.getElementById('message-image').value;

        if (!title || !message) {
            showNotice('Please fill in both title and message', 'error');
            return;
        }

        let result;
        if (editMessageId.value) {
            // Update existing message
            result = await api.updateMessage(editMessageId.value, title, message, image);
            if (result.success) {
                editMessageId.value = '';
                sendBtn.textContent = 'Send';
            }
        } else {
            // Send new message
            result = await api.sendMessage(title, message, image);
        }
        
        if (result.success) {
            document.getElementById('message-title').value = '';
            document.getElementById('message-content').value = '';
            document.getElementById('message-image').value = '';
            loadConversations();
            showNotice(editMessageId.value ? 'Message updated successfully' : 'Message sent successfully', 'success');
        } else {
            showNotice(result.error, 'error');
        }
    });

    // Add cancel edit button
    const cancelEditBtn = document.createElement('button');
    cancelEditBtn.textContent = 'Cancel Edit';
    cancelEditBtn.style.display = 'none';
    cancelEditBtn.classList.add('cancel-edit-btn');
    sendBtn.parentNode.insertBefore(cancelEditBtn, sendBtn.nextSibling);

    cancelEditBtn.addEventListener('click', () => {
        editMessageId.value = '';
        document.getElementById('message-title').value = '';
        document.getElementById('message-content').value = '';
        document.getElementById('message-image').value = '';
        sendBtn.textContent = 'Send';
        cancelEditBtn.style.display = 'none';
    });

    // Show/hide cancel button based on edit state
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                cancelEditBtn.style.display = editMessageId.value ? 'inline-block' : 'none';
            }
        });
    });

    observer.observe(editMessageId, {
        attributes: true
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

async function handleMessageDelete(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        const result = await api.deleteMessage(messageId);
        if (result.success) {
            loadConversations();
            showNotice('Message deleted successfully', 'success');
        } else {
            showNotice(result.error, 'error');
        }
    }
}

function handleMessageEdit(message) {
    document.getElementById('message-title').value = message.title;
    document.getElementById('message-content').value = message.message;
    document.getElementById('message-image').value = message.image || '';
    document.getElementById('edit-message-id').value = message.id;
    document.getElementById('send-btn').textContent = 'Update';
    
    // Scroll to the message form
    document.getElementById('message-form').scrollIntoView({ behavior: 'smooth' });
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

            const actionsEl = document.createElement('div');
            actionsEl.className = 'message-actions';

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => handleMessageEdit(message);
            actionsEl.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => handleMessageDelete(message.id);
            actionsEl.appendChild(deleteBtn);

            messageEl.appendChild(actionsEl);

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

// Add event listener for logout button
document.getElementById('logout-btn').addEventListener('click', handleLogout);