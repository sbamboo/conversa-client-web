export function showNotice(message, type = 'info') {
    const notice = document.createElement('div');
    notice.className = `notice-card ${type}`;
    notice.textContent = message;

    // Find the main content area
    const mainContent = document.querySelector('main');
    mainContent.insertBefore(notice, mainContent.firstChild);

    // Remove the notice after 5 seconds
    setTimeout(() => {
        notice.remove();
    }, 5000);
}

export function formatJson(json) {
    if (typeof json === 'string') {
        json = JSON.parse(json);
    }
    
    return JSON.stringify(json, null, 2)
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/"([^"]+)"/g, '<span class="json-string">"$1"</span>')
        .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>')
        .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
        .replace(/\bnull\b/g, '<span class="json-null">null</span>')
        .replace(/[{}\[\]]/g, '<span class="json-bracket">$&</span>')
        .replace(/,/g, '<span class="json-comma">,</span>');
}