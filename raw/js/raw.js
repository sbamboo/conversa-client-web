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
            ? 'Enter parameters (e.g., ?getAll&token=xyz) or JSON' 
            : 'Enter parameters (e.g., ?getAll&token=xyz) or JSON';
    });

    function parseUrlParams(paramString) {
        // Remove leading ? if present
        paramString = paramString.startsWith('?') ? paramString.substring(1) : paramString;
        
        const params = {};
        const pairs = paramString.split('&');
        
        for (const pair of pairs) {
            const [key, value] = pair.split('=').map(decodeURIComponent);
            
            // Handle nested parameters (e.g., data[author])
            if (key.includes('[') && key.includes(']')) {
                const mainKey = key.split('[')[0];
                const subKey = key.split('[')[1].split(']')[0];
                
                if (!params[mainKey]) {
                    params[mainKey] = {};
                }
                params[mainKey][subKey] = value;
            } else {
                params[key] = value;
            }
        }
        
        return params;
    }

    function objectToUrlParams(obj) {
        const params = [];
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object') {
                for (const [subKey, subValue] of Object.entries(value)) {
                    params.push(`${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(subValue)}`);
                }
            } else {
                params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        
        return params.join('&');
    }

    sendRawBtn.addEventListener('click', async () => {
        try {
            const method = httpMethod.value;
            let url = apiUrlInput.value;
            let input = rawInput.value.trim();
            let options = {
                method: method
            };

            // Handle GET requests
            if (method === 'GET') {
                if (input.startsWith('?')) {
                    // Direct URL parameters
                    url += input;
                } else if (input.startsWith('{')) {
                    // JSON input for GET - convert to URL parameters
                    try {
                        const jsonData = JSON.parse(input);
                        const urlParams = objectToUrlParams(jsonData);
                        url += '?' + urlParams;
                    } catch (e) {
                        showNotice('Invalid JSON format', 'error');
                        return;
                    }
                } else {
                    showNotice('Input must start with ? or be valid JSON', 'error');
                    return;
                }
            } 
            // Handle POST/UPDATE/DELETE requests
            else {
                let formData;
                
                if (input.startsWith('?')) {
                    // URL parameters format - convert to FormData
                    const params = parseUrlParams(input);
                    formData = new FormData();
                    
                    for (const [key, value] of Object.entries(params)) {
                        if (typeof value === 'object') {
                            for (const [subKey, subValue] of Object.entries(value)) {
                                formData.append(`${key}[${subKey}]`, subValue);
                            }
                        } else {
                            formData.append(key, value);
                        }
                    }
                } else if (input.startsWith('{')) {
                    // JSON format - convert to FormData
                    try {
                        const jsonData = JSON.parse(input);
                        formData = new FormData();
                        
                        for (const [key, value] of Object.entries(jsonData)) {
                            if (typeof value === 'object') {
                                for (const [subKey, subValue] of Object.entries(value)) {
                                    formData.append(`${key}[${subKey}]`, subValue);
                                }
                            } else {
                                formData.append(key, value);
                            }
                        }
                    } catch (e) {
                        showNotice('Invalid JSON format', 'error');
                        return;
                    }
                } else {
                    showNotice('Input must start with ? or be valid JSON', 'error');
                    return;
                }
                
                options.body = formData;
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