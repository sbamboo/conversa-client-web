import { showNotice, formatJson } from '../../js/utils.js';

export function initializeRawTab(apiUrlInput) {
    const sendRawBtn = document.getElementById('sendRaw');
    const urlParamsInput = document.getElementById('rawInput');
    const bodyInput = document.getElementById('bodyInput');
    const rawOutput = document.getElementById('rawOutput');
    const rawContent = document.getElementById('rawContent');
    const urlDisplay = document.querySelector('.api-url-display');
    const httpMethod = document.getElementById('httpMethod');
    const bodyContainer = document.getElementById('bodyContainer');

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
    document.getElementById('toggleRawContent').addEventListener('click', () => {
        const content = document.getElementById('rawContentContainer');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });

    sendRawBtn.addEventListener('click', async () => {
        try {
            const httpMethod_Value = httpMethod.value;
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
                method: httpMethod_Value
            };

            // Add body for non-GET requests
            if (httpMethod_Value !== 'GET' && bodyInput.value.trim()) {
                try {
                    const bodyData = JSON.parse(bodyInput.value);

                    const formData = new FormData();
                    Object.entries(bodyData).forEach(([key, value]) => {
                        formData.append(key, value);
                    });
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
                showNotice(error.message, 'error');
                rawOutput.innerHTML = formatJson({ error: error.message });
            }
        } catch (error) {
            showNotice(error.message, 'error');
            rawOutput.innerHTML = formatJson({ error: error.message });
            rawContent.textContent = error.message;
        }
    });
}