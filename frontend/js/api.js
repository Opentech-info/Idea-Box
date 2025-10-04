// API Service for AZsubay.dev School Project Platform
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Generic HTTP request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired. Please login again.');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token && response.user) {
            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
        }

        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token && response.user) {
            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
        }

        return response;
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    async updateProfile(userData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }

    // Project methods
    async getProjects(userId = null) {
        const params = userId ? `?userId=${userId}` : '';
        return await this.request(`/projects${params}`);
    }

    async getProject(id) {
        return await this.request(`/projects/${id}`);
    }

    async addToCart(projectId) {
        return await this.request(`/projects/${projectId}/cart`, {
            method: 'POST'
        });
    }

    async removeFromCart(projectId) {
        return await this.request(`/projects/${projectId}/cart`, {
            method: 'DELETE'
        });
    }

    async getCart() {
        return await this.request('/projects/cart/my');
    }

    async createProject(projectData) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(id, projectData) {
        return await this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(id) {
        return await this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    }

    // Order methods
    async createOrder(orderData) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getMyOrders() {
        return await this.request('/orders/my');
    }

    async getOrder(orderId) {
        return await this.request(`/orders/${orderId}`);
    }

    // Unified payment for all gateways
    async processPayment(orderId, paymentData) {
        // If using mobile money or Stripe, call /api/payments/pay
        const mobileGateways = ['mpesa', 'tigopesa', 'airtelmoney', 'halopesa', 'ezypesa', 'stripe'];
        if (mobileGateways.includes(paymentData.payment_method)) {
            return await this.request(`/payments/pay`, {
                method: 'POST',
                body: JSON.stringify({
                    order_id: orderId,
                    payment_method: paymentData.payment_method,
                    amount: paymentData.amount,
                    phone: paymentData.phone || null
                })
            });
        } else {
            // fallback to legacy order payment
            return await this.request(`/orders/${orderId}/pay`, {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
        }
    }

    async cancelOrder(orderId) {
        return await this.request(`/orders/${orderId}/cancel`, {
            method: 'PUT'
        });
    }

    async downloadProject(orderId, projectId) {
        return await this.request(`/orders/${orderId}/download/${projectId}`);
    }

    // Contact methods
    async submitContactForm(contactData) {
        return await this.request('/contact', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }

    async getContactMessages() {
        return await this.request('/contact');
    }

    async getContactMessage(messageId) {
        return await this.request(`/contact/${messageId}`);
    }

    async updateMessageStatus(messageId, status) {
        return await this.request(`/contact/${messageId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async updateMessagePriority(messageId, priority) {
        return await this.request(`/contact/${messageId}/priority`, {
            method: 'PUT',
            body: JSON.stringify({ priority })
        });
    }

    async deleteContactMessage(messageId) {
        return await this.request(`/contact/${messageId}`, {
            method: 'DELETE'
        });
    }

    async getContactStats() {
        return await this.request('/contact/stats/summary');
    }

    async searchContactMessages(params) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/contact/search?${queryString}`);
    }

    // Admin methods
    async getUsers() {
        return await this.request('/admin/users');
    }

    async getUser(id) {
        return await this.request(`/admin/users/${id}`);
    }

    async updateUser(id, userData) {
        return await this.request(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return await this.request(`/admin/users/${id}`, {
            method: 'DELETE'
        });
    }

    async getAds() {
        return await this.request('/admin/ads');
    }

    async createAd(adData) {
        return await this.request('/admin/ads', {
            method: 'POST',
            body: JSON.stringify(adData)
        });
    }

    async updateAd(id, adData) {
        return await this.request(`/admin/ads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(adData)
        });
    }

    async deleteAd(id) {
        return await this.request(`/admin/ads/${id}`, {
            method: 'DELETE'
        });
    }

    async getActivityLogs() {
        return await this.request('/admin/logs');
    }

    async getStats() {
        return await this.request('/admin/stats');
    }

    // Public methods
    async getActiveAds() {
        return await this.request('/ads/active');
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    getUserId() {
        return this.user ? this.user.id : null;
    }

    getUsername() {
        return this.user ? this.user.username : null;
    }
}

// Export singleton instance
const apiService = new ApiService();
window.api = apiService; // Make it globally available for debugging
