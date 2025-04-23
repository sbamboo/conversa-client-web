import { showNotice, formatJson } from '../../js/utils.js';

export function initializeRawTab(apiUrlInput) {
    const sendRawBtn = document.getElementById('sendRaw');
    const rawInput = document.getElementById('rawInput');
    const rawOutput = document.getElementById('rawOutput');
    const urlDisplay = document.querySelector('.api-url-display');
    const httpMethod = document.getElementById('httpMethod');

    // Update URL display when API URL changes
    apiUrlInput.addEventListener('input', () => {
        urlDisplay.textContent = apiUrlInput.value;
    });
    
    // Set initial URL display
    urlDisplay.textContent = apiUrlInput.value;

    // Update placeholder based on HTTP method
    httpMethod.addEventListener('change', () => {
        rawInput.placeholder = httpMethod.value === 'GET' 
            ? 'Enter parameters (e.g., ?getAll&token=xyz)' 
            : 'Enter JSON data (e.g., {"add": "1", "data": {"title": "Hello"}})';
    });

    sendRawBtn.addEventListener('click', async () => {
        try {
            const method = httpMethod.value;
            let url = apiUrlInput.value;
            let options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (method === 'GET') {
                url += rawInput.value;
            } else {
                try {
                    const jsonData = JSON.parse(rawInput.value);
                    const formData = new FormData();
                    
                    // Convert JSON to FormData
                    Object.entries(jsonData).forEach(([key, value]) => {
                        if (typeof value === 'object') {
                            Object.entries(value).forEach(([subKey, subValue]) => {
                                formData.append(`${key}[${subKey}]`, subValue);
                            });
                        } else {
                            formData.append(key, value);
                        }
                    });

                    options.body = formData;
                    delete options.headers['Content-Type']; // Let browser set correct content type for FormData
                } catch (e) {
                    showNotice('Invalid JSON format', 'error');
                    return;
                }
            }
            
            const response = await fetch(url, options);
            const data = await response.json();
            
            rawOutput.innerHTML = formatJson(data);
        } catch (error) {
            showNotice(error.message, 'error');
            rawOutput.innerHTML = formatJson({ error: error.message });
        }
    });
}