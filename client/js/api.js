export class ConversaApiV0 {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
        this.userId = null;
        this.isAdmin = false;
    }

    updateUrl(newUrl) {
        this.baseUrl = newUrl;
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}?validate&username=${username}&password=${password}`);
            const rawResponse = await response.clone().text();
            try {
                const data = await response.json();
                
                if (data.status === "success") {
                    this.token = data.token;
                    this.userId = data.id;
                    this.isAdmin = data.admin;
                    return { success: true, data };
                }
                
                return { success: false, error: data.message };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: "+error.message };
        }
    }

    async getAllMessages() {
        try {
            const response = await fetch(`${this.baseUrl}?getAll&token=${this.token}`);
            const rawResponse = await response.clone().text();
            try {
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    return { success: true, data };
                }
                
                return { success: false, error: "Invalid response format" };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: "+error.message };
        }
    }

    async sendMessage(title, message, image = "") {
        try {
            const formData = new FormData();
            formData.append('add', '1');
            formData.append('data[author]', this.userId);
            formData.append('data[title]', title);
            formData.append('data[message]', message);
            formData.append('data[image]', image);

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            const rawResponse = await response.clone().text();

            try {
                const data = await response.json();
                return { success: data.status === "success", data };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: "+error.message };
        }
    }

    async updateMessage(messageId, title, message, image = "") {
        try {
            const formData = new FormData();
            formData.append('update', '1');
            formData.append('id', messageId);
            formData.append('data[author]', this.userId);
            formData.append('data[title]', title);
            formData.append('data[message]', message);
            formData.append('data[image]', image);

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            const rawResponse = await response.clone().text();

            try {
                const data = await response.json();
                return { success: data.status === "success", data };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: "+error.message };
        }
    }

    async deleteMessage(messageId) {
        try {
            const formData = new FormData();
            formData.append('delete', '1');
            formData.append('id', messageId);

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            const rawResponse = await response.clone().text();

            try {
                const data = await response.json();
                return { success: data.status === "success", data };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: "+error.message };
        }
    }

    // Admin methods
    async admin_getAllUsers() {
        try {
            const formData = new FormData();
            formData.append('getAllUsers', '1');

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            const rawResponse = await response.clone().text();

            try {
                const data = await response.json();
                return { success: Array.isArray(data), data };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: "+error.message };
        }
    }

    async admin_addUser(username, password, displayName, email, isAdmin = false) {
        try {
            const formData = new FormData();
            formData.append('addUser', '1');
            formData.append('data[username]', username);
            formData.append('data[password]', password);
            formData.append('data[display_name]', displayName);
            formData.append('data[email]', email);
            formData.append('data[admin]', isAdmin ? '1' : '0');

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            const rawResponse = await response.clone().text();

            try {
                const data = await response.json();
                return { success: data.status === "success", data };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: " + error.message };
        }
    }

    async admin_updateUser(userId, displayName, email, password = null) {
        try {
            const formData = new FormData();
            formData.append('updateUser', '1');
            formData.append('id', userId);
            
            const data = {};
            if (displayName) data.display_name = displayName;
            if (email) data.email = email;
            if (password) data.password = password;

            Object.entries(data).forEach(([key, value]) => {
                formData.append(`data[${key}]`, value);
            });

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            const rawResponse = await response.clone().text();

            try {
                const responseData = await response.json();
                return { success: responseData.status === "success", data: responseData };
            } catch (error) {
                //console.log(rawResponse);
                return { success: false, error: "Network error occurred: "+error.message };
            }
        } catch (error) {
            return { success: false, error: "Network error occurred" + error.message };
        }
    }

    async admin_deleteUser(userId) {
        try {
            const formData = new FormData();
            formData.append('deleteUser', '1');
            formData.append('id', userId);

            const response = await fetch(`${this.baseUrl}?token=${this.token}`, {
                method: 'POST',
                body: formData
            });

            let rawResponse = await response.clone().text();

            try {
                const data = await response.json();
                return { success: data.status === "success", data };
            } catch (error) {
                if (rawResponse.includes('Call to undefined function')) {
                    return { success: false, error: "Operation unsupported in the API!" };
                } else {
                    //console.log(rawResponse);
                    return { success: false, error: "Json parsing error occurred: " + error.message};
                }
            }
        } catch (error) {
            return { success: false, error: "Network error occurred: " + error.message};
        }
    }

    async logout() {
        let response;
        let toReturn = { success: true, message: "Logged out successfully" };
        try {
            response = await fetch(`${this.baseUrl}?logout&token=${this.token}`);
            // check if response contains 'Call to undefined function'
            const rawResponse = await response.clone().text();
            if (rawResponse.includes('Call to undefined function')) {
                toReturn = { success: false, error: "Failed to serverside-logout: Operation unsupported in the API!", message: "Clientside logged out successfully" };
            }
        } catch (error) {
            toReturn = { success: false, error: "Failed to serverside-logout: Network error occurred: " + error.message, message: "Clientside logged out successfully" };
        }
        
        this.token = null;
        this.userId = null;
        this.isAdmin = false;

        return toReturn;
    }

    isLoggedIn() {
        return this.token !== null;
    }
}