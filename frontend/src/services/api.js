// API service for making HTTP requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseURL = String(API_BASE_URL || '').replace(/\/+$/, '');
  }

  // Get authorization header
  getAuthHeader() {
    // Check if current page is admin panel by looking at URL
    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    
    // Use admin token only if we're in admin panel AND admin session exists
    if (isAdminPath && localStorage.getItem('adminSession:v1') === '1') {
      const adminToken = localStorage.getItem('adminAuthToken');
      return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
    }
    
    // Otherwise use regular user token
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, clear stale token to avoid repeated failures
        if (response.status === 401) {
          const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
          if (isAdminPath) {
            try { localStorage.removeItem('adminAuthToken'); } catch {}
            try { localStorage.removeItem('adminSession:v1'); } catch {}
          } else {
            try { localStorage.removeItem('authToken'); } catch {}
          }
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload (form data)
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('image', file);

    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader()
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Upload failed! status: ${response.status}`);
    }

    return data;
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  }

  async adminLogin(email, password) {
    const response = await this.post('/auth/admin/login', { email, password })
    if (response.success && response.data?.token) {
      localStorage.setItem('adminAuthToken', response.data.token)
      localStorage.setItem('adminSession:v1', '1')
    }
    return response
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  }

  async getProfile() {
    return this.get('/auth/me');
  }

  async updateProfile(userData) {
    return this.put('/auth/profile', userData);
  }

  async changePassword(passwordData) {
    return this.post('/auth/change-password', passwordData);
  }

  // Contact / Support
  async sendContactMessage(payload) {
    return this.post('/contact', payload);
  }

  logout() {
    // Only remove user auth token, not admin session
    localStorage.removeItem('authToken');
  }

  adminLogout() {
    try { localStorage.removeItem('adminSession:v1') } catch {}
    localStorage.removeItem('adminAuthToken')
  }

  // Admin user management
  async getUsers(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.append(key, value);
    });
    const endpoint = qs.toString() ? `/users?${qs.toString()}` : '/users';
    return this.get(endpoint);
  }

  async getUser(id) {
    return this.get(`/users/${id}`);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(id, userData) {
    return this.put(`/users/${id}`, userData);
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`);
  }

  // Product methods
  async getProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.append(key, String(value));
    });
    const endpoint = qs.toString() ? `/products?${qs.toString()}` : '/products';
    return this.get(endpoint);
  }

  async getProductsByIds(ids = [], params = {}) {
    const list = Array.isArray(ids) ? ids.map(String).filter(Boolean) : []
    const qs = new URLSearchParams()
    qs.set('ids', list.join(','))
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      qs.set(key, String(value))
    })
    return this.get(`/products/by-ids?${qs.toString()}`)
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.post('/products', productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  async getFeaturedProducts() {
    return this.get('/products/featured');
  }

  // Lookbook methods
  async getLookbookPosts(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v) })
    const endpoint = qs.toString() ? `/lookbook?${qs.toString()}` : '/lookbook'
    return this.get(endpoint)
  }

  async getLookbookPost(id) {
    return this.get(`/lookbook/${id}`)
  }

  async createLookbookPost(data) {
    return this.post('/lookbook', data)
  }

  async updateLookbookPost(id, data) {
    return this.put(`/lookbook/${id}`, data)
  }

  async deleteLookbookPost(id) {
    return this.delete(`/lookbook/${id}`)
  }

  async reactLookbookPost(id, type) {
    return this.post(`/lookbook/${id}/reaction`, { type })
  }

  async addLookbookComment(id, content) {
    return this.post(`/lookbook/${id}/comments`, { content })
  }

  async deleteLookbookComment(id, commentId) {
    return this.delete(`/lookbook/${id}/comments/${commentId}`)
  }

  // Categories
  async getCategories() {
    return this.get('/categories');
  }

  async createCategory(name) {
    return this.post('/categories', { name });
  }

  async addSubcategory(categoryName, subcategory) {
    return this.post(`/categories/${encodeURIComponent(categoryName)}/subcategories`, { subcategory });
  }

  // Content management methods
  async getContent(type) {
    return this.get(`/content/${type}`);
  }

  async updateContent(type, contentData) {
    return this.put(`/content/${type}`, contentData);
  }

  async getAllContent() {
    return this.get('/content');
  }

  // Admin dashboard
  async getAdminStats(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return this.get(`/admin/stats${queryString ? '?' + queryString : ''}`);
  }

  // Upload methods
  async uploadImage(file) {
    return this.upload('/upload/image', file);
  }

  async uploadImages(files) {
    // Upload multiple images at once
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    const url = `${this.baseURL}/upload/images`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader()
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Upload failed! status: ${response.status}`);
    }
    return data;
  }

  async uploadVideo(file) {
    const formData = new FormData();
    formData.append('video', file);

    const url = `${this.baseURL}/upload/video`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader()
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Video upload failed! status: ${response.status}`);
    }
    return data;
  }

  async uploadImageByUrl(imageData) {
    return this.post('/upload/url', imageData);
  }

  // Orders
  async getOrders(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.append(key, String(value));
    });
    const endpoint = qs.toString() ? `/orders?${qs.toString()}` : '/orders';
    return this.get(endpoint);
  }

  async getMyOrders() {
    return this.get('/orders/my');
  }

  async getOrder(id) {
    return this.get(`/orders/${id}`);
  }

  async getOrderByOrderNumber(orderNumber) {
    return this.get(`/orders/number/${orderNumber}`);
  }

  async updateOrderStatus(orderId, status, note = '') {
    return this.put(`/orders/${orderId}/status`, { status, note });
  }

  // Content
  async getContent(type) {
    return this.get(`/content/${type}`);
  }

  async getAllContent() {
    return this.get('/content');
  }

  async updateContent(type, data) {
    return this.put(`/content/${type}`, data);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;