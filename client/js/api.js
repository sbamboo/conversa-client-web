export class ConversaApiV0 {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
        this.userId = null;
    }

    updateUrl(newUrl) {
        this.baseUrl = newUrl;
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}?validate&username=${username}&password=${password}`);
            const data = await response.json();
            
            if (data.status === "success") {
                this.token = data.token;
                this.userId = data.id;
                return { success: true, data };
            }
            
            return { success: false, error: data.message };
        } catch (error) {
            return { success: false, error: "Network error occurred" };
        }
    }

    async getAllMessages() {
        try {
            const response = await fetch(`${this.baseUrl}?getAll&token=${this.token}`);
            const data = await response.json();
            
            if (Array.isArray(data)) {
                return { success: true, data };
            }
            
            return { success: false, error: "Invalid response format" };
        } catch (error) {
            return { success: false, error: "Network error occurred" };
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

            const data = await response.json();
            return { success: data.status === "success", data };
        } catch (error) {
            return { success: false, error: "Network error occurred" };
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

            const data = await response.json();
            return { success: data.status === "success", data };
        } catch (error) {
            return { success: false, error: "Network error occurred" };
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

            const data = await response.json();
            return { success: data.status === "success", data };
        } catch (error) {
            return { success: false, error: "Network error occurred" };
        }
    }

    logout() {
        this.token = null;
        this.userId = null;
    }

    isLoggedIn() {
        return this.token !== null;
    }
}