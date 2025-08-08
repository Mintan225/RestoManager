var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AuthService {
    constructor() {
        this.token = null;
        this.user = null;
        this.loadFromStorage();
    }
    loadFromStorage() {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('auth_user');
            if (token && userData) {
                this.token = token;
                this.user = JSON.parse(userData);
            }
        }
    }
    saveToStorage(token, user) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
        }
    }
    clearStorage() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || 'Login failed');
            }
            const data = yield response.json();
            this.token = data.token;
            this.user = data.user;
            this.saveToStorage(data.token, data.user);
            return data;
        });
    }
    register(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, role: 'admin' }),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || 'Registration failed');
            }
            const data = yield response.json();
            this.token = data.token;
            this.user = data.user;
            this.saveToStorage(data.token, data.user);
            return data;
        });
    }
    logout() {
        this.token = null;
        this.user = null;
        this.clearStorage();
        // Rediriger vers la page de connexion
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    getToken() {
        return this.token;
    }
    getUser() {
        return this.user;
    }
    isAuthenticated() {
        return this.token !== null && this.user !== null;
    }
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }
}
export default new AuthService();
