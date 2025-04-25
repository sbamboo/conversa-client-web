import { ConversaApiV0 } from './api.js';
import { showNotice } from '../../js/utils.js';
import { initializeTabs } from '../../js/tabs.js';
import { initializeRawTab } from '../../raw/js/raw.js';

let api;
let newestFirst = false;

// Initialize the application
function init() {
    const apiUrlInput = document.getElementById('api-url');
    api = new ConversaApiV0(apiUrlInput.value);

    // Update API URL when input changes
    apiUrlInput.addEventListener('input', () => {
        api.updateUrl(apiUrlInput.value);
    });

    // Initialize
    initializeTabs();
    initializeRawTab(apiUrlInput);
    initializeLoginForm();
    initializeMessageForm();
    initializeAdminCancelButton();
    initializeSortButton();
    initializeJsonImport();
}

function initializeJsonImport() {
    const headerActions = document.querySelector('#admin-panel .header-actions');
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import from JSON';
    importBtn.className = 'import-json-btn';
    headerActions.insertBefore(importBtn, headerActions.firstChild);

    const modal = document.getElementById('json-import-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const importJsonBtn = document.getElementById('import-json-btn');

    importBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    importJsonBtn.addEventListener('click', async () => {
        const jsonInput = document.getElementById('json-import-input').value;
        try {
            const data = JSON.parse(jsonInput);
            
            // Import users
            if (data.users && Array.isArray(data.users)) {
                for (const [username, password, displayName, email = `${username}@example.com`] of data.users) {
                    const result = await api.admin_addUser(username, password, displayName, email, false);
                    if (result.success) {
                        showNotice(`User '${username}' imported successfully`, 'success');
                    } else {
                        showNotice(`Failed to import user '${username}': ${result.error}`, 'error');
                    }
                }
            }

            // Import messages
            if (data.data && Array.isArray(data.data)) {
                for (const [username, title, message, image = ''] of data.data) {
                    const result = await api.sendMessage(title, message, image);
                    if (result.success) {
                        showNotice(`Message for '${username}' imported successfully`, 'success');
                    } else {
                        showNotice(`Failed to import message for '${username}': ${result.error}`, 'error');
                    }
                }
            }

            modal.style.display = 'none';
            loadUsers();
            loadConversations();
        } catch (error) {
            showNotice('Invalid JSON format', 'error');
        }
    });
}

function initializeSortButton() {
    const sortBtn = document.getElementById('sort-messages-btn');
    sortBtn.addEventListener('click', () => {
        newestFirst = !newestFirst;
        sortBtn.textContent = `Sort: Newest ${newestFirst ? 'First' : 'Last'}`;
        loadConversations();
    });
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
            
            // Show admin button if user is admin
            const adminBtn = document.getElementById('admin-btn');
            if (api.isAdmin) {
                adminBtn.classList.remove('hidden');
                adminBtn.textContent = 'Admin';
            } else {
                adminBtn.classList.add('hidden');
            }
            
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

    // Add cancel Edit button
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

function initializeAdminCancelButton() {
    const form = document.getElementById('admin-user-form');
    const saveBtn = document.getElementById('save-user-btn');
    
    // Create and add cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.classList.add('cancel-edit-btn');
    cancelBtn.style.display = 'none';
    saveBtn.parentNode.insertBefore(cancelBtn, saveBtn.nextSibling);

    // Show/hide cancel button based on whether we're editing
    const userIdInput = document.getElementById('user-id');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                cancelBtn.style.display = userIdInput.value ? 'inline-block' : 'none';
            }
        });
    });

    observer.observe(userIdInput, {
        attributes: true
    });

    cancelBtn.addEventListener('click', () => {
        form.reset();
        userIdInput.value = '';
        saveBtn.textContent = 'Add User';
        cancelBtn.style.display = 'none';
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

    // Sort messages by date within each conversation
    Object.values(conversations).forEach(messages => {
        messages.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return newestFirst ? dateB - dateA : dateA - dateB;
        });
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

function handleUserEdit(user) {
    // ensure copy-button click is copyPasswordToClipboard
    const copyButton = document.getElementById('copy-password-btn');
    if (copyButton) {
        copyButton.onclick = copyPasswordToClipboard;
    }

    const form = document.getElementById('admin-user-form');
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-display-name').value = user.display_name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-password').value = user.password || '';
    document.getElementById('user-is-admin').checked = user.admin === '1';
    document.getElementById('save-user-btn').textContent = 'Update User';
    
    // Show copy button when editing
    if (copyButton) {
        copyButton.style.display = 'flex';
    }

    // Scroll to the user form
    form.scrollIntoView({ behavior: 'smooth' });
}

// Function to handle password copy
async function copyPasswordToClipboard() {
    const passwordInput = document.getElementById('user-password');
    try {
        await navigator.clipboard.writeText(passwordInput.value);
        showNotice('Password copied to clipboard', 'success');
    } catch (err) {
        showNotice('Failed to copy password', 'error');
    }
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
            messageEl.className = `message ${parseInt(message.author) === api.userId ? 'sent' : ''}`;
            
            const titleEl = document.createElement('strong');
            titleEl.textContent = message.title;
            messageEl.appendChild(titleEl);

            const contentEl = document.createElement('p');
            contentEl.textContent = message.message;
            messageEl.appendChild(contentEl);

            if (message.image) {
                const imageEl = document.createElement('img');
                imageEl.className = 'message-image';
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

// Admin functionality
async function loadUsers() {
    const result = await api.admin_getAllUsers();
    if (result.success) {
        displayUsers(result.data);
    } else {
        showNotice(result.error, 'error');
    }
}

function displayUsers(users) {
    const container = document.getElementById('admin-users');
    container.innerHTML = '';

    users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'user-card';

        const nameEl = document.createElement('h3');
        nameEl.textContent = user.display_name;
        userEl.appendChild(nameEl);

        const detailsEl = document.createElement('div');
        detailsEl.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Admin:</strong> ${user.admin === '1' ? 'Yes' : 'No'}</p>
        `;
        userEl.appendChild(detailsEl);

        const actionsEl = document.createElement('div');
        actionsEl.className = 'user-actions';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => handleUserEdit(user);
        actionsEl.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => handleUserDelete(user.id);
        actionsEl.appendChild(deleteBtn);

        userEl.appendChild(actionsEl);
        container.appendChild(userEl);
    });
}

async function handleUserDelete(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const result = await api.admin_deleteUser(userId);
        if (result.success) {
            loadUsers();
            showNotice('User deleted successfully', 'success');
        } else {
            showNotice(result.error, 'error');
        }
    }
}

async function handleLogout() {
    const result = await api.logout();
    if (result.message) {
        showNotice(result.message, 'success');
        if (result.error || result.message) {
            showNotice(result.error || result.message, 'warning');
        }
    } else {
        if (result.error || result.message) {
            showNotice(result.error || result.message, 'error');
        }
    }
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('chat-container').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
}

function toggleAdminPanel() {
    const adminBtn = document.getElementById('admin-btn');
    const adminPanel = document.getElementById('admin-panel');
    const chatContainer = document.getElementById('chat-container');

    if (adminPanel.classList.contains('hidden')) {
        // Show admin panel, hide chat
        adminPanel.classList.remove('hidden');
        chatContainer.classList.add('hidden');
        adminBtn.textContent = 'Chat';
        loadUsers();
    } else {
        // Show chat, hide admin panel
        adminPanel.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        adminBtn.textContent = 'Admin';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add event listeners for admin functionality
document.getElementById('admin-btn').addEventListener('click', toggleAdminPanel);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Initialize admin user form
document.getElementById('admin-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('user-id').value;
    const displayName = document.getElementById('user-display-name').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const username = document.getElementById('user-username').value;
    const isAdmin = document.getElementById('user-is-admin').checked;

    let result;
    if (userId) {
        result = await api.admin_updateUser(userId, displayName, email, password || null);
    } else {
        result = await api.admin_addUser(username, password, displayName, email, isAdmin);
    }

    if (result.success) {
        document.getElementById('admin-user-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('save-user-btn').textContent = 'Add User';

        // Hide copy button when form is reset
        const copyButton = document.getElementById('copy-password-btn');
        if (copyButton) {
            copyButton.style.display = 'none';
        }

        loadUsers();
        showNotice(userId ? 'User updated successfully' : 'User added successfully', 'success');
    } else {
        if (result.data) {
            showNotice(result.data.error || result.data.message, 'error');
        } else {
            showNotice(result.error || result.message, 'error');
        }
    }
});

// Add close button functionality
document.getElementById('admin-close-btn').addEventListener('click', () => {
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    document.getElementById('admin-btn').textContent = 'Admin';
});