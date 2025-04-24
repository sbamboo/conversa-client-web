import { showNotice, formatJson } from '../../js/utils.js';

export function initializeRawTab(apiUrlInput) {
    const sendRawBtn = document.getElementById('send-raw');
    const clearRawBtn = document.getElementById('clear-raw');
    const urlParamsInput = document.getElementById('raw-input');
    const bodyInput = document.getElementById('body-input');
    const headersInput = document.getElementById('headers-input');
    const rawOutput = document.getElementById('raw-output');
    const rawContent = document.getElementById('raw-content');
    const urlDisplay = document.querySelector('.api-url-display');
    const httpMethod = document.getElementById('http-method');
    const bodyContainer = document.getElementById('body-container');

    // Update URL display when API URL changes
    apiUrlInput.addEventListener('input', () => {
        urlDisplay.textContent = apiUrlInput.value;
    });
    
    // Set initial URL display
    urlDisplay.textContent = apiUrlInput.value;

    // Show/hide body input based on HTTP method
    httpMethod.addEventListener('change', () => {
        bodyContainer.style.display = httpMethod.value === 'GET' ? 'none' : 'block';
    });

    // Toggle raw content visibility
    document.getElementById('toggle-raw-content').addEventListener('click', () => {
        const content = document.getElementById('raw-content-container');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });

    // Toggle headers visibility
    document.getElementById('toggle-headers').addEventListener('click', () => {
        const content = document.getElementById('headers-container');
        content.style.display = headersContainer.style.display === 'none' ? 'block' : 'none';
    });

    clearRawBtn.addEventListener('click', () => {
        //urlParamsInput.value = '';
        //bodyInput.value = '';
        //headersInput.value = '';
        rawOutput.innerHTML = '';
        rawContent.textContent = '';
    });

    sendRawBtn.addEventListener('click', async () => {
        try {
            const httpMethodValue = httpMethod.value;
            let url = apiUrlInput.value;
            const urlParams = urlParamsInput.value.trim();

            // Add URL parameters if provided
            if (urlParams) {
                if (!urlParams.startsWith('?')) {
                    showNotice('URL parameters must start with ?', 'error');
                    return;
                }
                url += urlParams;
            }

            let options = {
                method: httpMethodValue
            };

            // Add headers if provided
            const headersValue = headersInput.value.trim();
            if (headersValue) {
                try {
                    const headers = JSON.parse(headersValue);
                    options.headers = headers;
                } catch (e) {
                    showNotice('Invalid JSON in headers', 'error');
                    return;
                }
            }

            // Add body for non-GET requests
            if (httpMethodValue !== 'GET' && bodyInput.value.trim()) {
                try {
                    const bodyData = JSON.parse(bodyInput.value);

                    const formData = new FormData();
                    function appendFormData(data, parentKey = '') {
                        if (data && typeof data === 'object' && !(data instanceof File)) {
                            Object.entries(data).forEach(([key, value]) => {
                                const fullKey = parentKey ? `${parentKey}[${key}]` : key;
                                appendFormData(value, fullKey);
                            });
                        } else {
                            formData.append(parentKey, data);
                        }
                    }
                    appendFormData(bodyData);

                    options.body = formData;
                } catch (e) {
                    showNotice('Invalid JSON in request body', 'error');
                    return;
                }
            }
            
            const response = await fetch(url, options);
            const rawResponse = await response.clone().text();
            rawContent.textContent = rawResponse;
            
            try {
                const data = await response.json();
                rawOutput.innerHTML = formatJson(data);
            } catch (error) {
                if (rawResponse.includes('Call to undefined function')) {
                    rawContent.textContent = error.message;
                    showNotice('Operation unsupported in the API!', 'error')
                } else {
                    showNotice(error.message, 'error');
                    rawOutput.innerHTML = formatJson({ error: error.message });
                }
            }
        } catch (error) {
            showNotice(error.message, 'error');
            rawOutput.innerHTML = formatJson({ error: error.message });
            rawContent.textContent = error.message;
        }
    });
}