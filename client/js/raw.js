import { showNotice, formatJson } from './utils.js';

export function initializeRawTab(apiUrlInput) {
    const sendRawBtn = document.getElementById('sendRaw');
    const rawInput = document.getElementById('rawInput');
    const rawOutput = document.getElementById('rawOutput');
    const urlDisplay = document.querySelector('.api-url-display');

    // Update URL display when API URL changes
    apiUrlInput.addEventListener('input', () => {
        urlDisplay.textContent = apiUrlInput.value;
    });
    
    // Set initial URL display
    urlDisplay.textContent = apiUrlInput.value;

    sendRawBtn.addEventListener('click', async () => {
        try {
            const params = rawInput.value;
            const url = `${apiUrlInput.value}${params}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            rawOutput.innerHTML = formatJson(data);
        } catch (error) {
            showNotice(error.message, 'error');
            rawOutput.innerHTML = formatJson({ error: error.message });
        }
    });
}