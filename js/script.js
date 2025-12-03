// ====================
// Performance Optimized Todo App
// ====================

// Debounce function untuk optimasi
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

class TodoApp {
    constructor() {
        this.currentUser = null;
        this.todos = [];
        this.currentFilter = 'all';
        this.isPlaying = false;
        this.music = document.getElementById('bgMusic');
        this.todoCounter = 1;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuth();
        this.setVolume(50);
        this.setupDateInput();
    }
    
    // ====================
    // SETUP FUNCTIONS
    // ====================
    setupEventListeners() {
        // Password toggles
        ['toggleLoginPassword', 'toggleRegisterPassword', 'toggleRegisterConfirm'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', (e) => this.togglePassword(e));
        });
        
        // Forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const todoInput = document.getElementById('todoInput');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        if (todoInput) {
            todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTodo();
            });
        }
        
        // Volume slider dengan debounce
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', debounce((e) => {
                this.changeVolume(e.target.value);
            }, 50));
        }
        
        // Auto-hide notification
        this.setupAutoHide();
    }
    
    setupAutoHide() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.addEventListener('click', () => {
                notification.style.display = 'none';
            });
        }
    }
    
    setupDateInput() {
        const dateInput = document.getElementById('todoDate');
        if (dateInput) {
            // Set default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            dateInput.min = new Date().toISOString().split('T')[0];
        }
    }
    
    // ====================
    // AUTH FUNCTIONS
    // ====================
    checkAuth() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.showApp();
            }
        } catch (e) {
            console.error('Auth check failed:', e);
        }
    }
    
    showRegister() {
        const loginBox = document.getElementById('loginBox');
        const registerBox = document.getElementById('registerBox');
        
        if (loginBox) loginBox.style.display = 'none';
        if (registerBox) {
            registerBox.style.display = 'block';
            registerBox.removeAttribute('hidden');
            document.getElementById('registerForm')?.reset();
        }
    }
    
    showLogin() {
        const loginBox = document.getElementById('loginBox');
        const registerBox = document.getElementById('registerBox');
        
        if (registerBox) registerBox.style.display = 'none';
        if (loginBox) {
            loginBox.style.display = 'block';
            document.getElementById('loginForm')?.reset();
        }
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        
        if (!username || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            
            if (!user || this.simpleDecrypt(user.password) !== password) {
                this.showNotification('Invalid username or password!', 'error');
                return;
            }
            
            this.currentUser = { 
                username: user.username, 
                email: user.email 
            };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification(`Welcome back, ${username}!`);
            this.showApp();
        } catch (error) {
            this.showNotification('Login failed', 'error');
        }
    }
    
    handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername')?.value.trim();
        const email = document.getElementById('registerEmail')?.value.trim();
        const password = document.getElementById('registerPassword')?.value;
        const confirm = document.getElementById('registerConfirm')?.value;
        
        if (!username) {
            this.showNotification('Username is required!', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (password !== confirm) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }
        
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[username]) {
                this.showNotification('Username already taken!', 'error');
                return;
            }
            
            const userData = {
                username: username,
                email: email || '',
                password: this.simpleEncrypt(password),
                createdAt: new Date().toISOString(),
                todos: []
            };
            
            users[username] = userData;
            localStorage.setItem('users', JSON.stringify(users));
            
            this.currentUser = { username, email: email || '' };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification('Account created successfully!');
            this.showApp();
        } catch (error) {
            this.showNotification('Registration failed', 'error');
        }
    }
    
    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.todos = [];
        
        const appContainer = document.getElementById('appContainer');
        const authContainer = document.getElementById('authContainer');
        const loginBox = document.getElementById('loginBox');
        
        if (appContainer) {
            appContainer.style.display = 'none';
            appContainer.setAttribute('hidden', 'true');
        }
        
        if (authContainer) {
            authContainer.style.display = 'flex';
        }
        
        if (loginBox) {
            loginBox.style.display = 'block';
        }
        
        document.getElementById('loginForm')?.reset();
        document.getElementById('registerForm')?.reset();
        
        this.showNotification('Logged out successfully');
        
        // Stop music
        this.music.pause();
        this.isPlaying = false;
        this.updateMusicUI();
    }
    
    // ====================
    // TODO FUNCTIONS
    // ====================
    loadUserTodos() {
        try {
            if (!this.currentUser) return;
            
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[this.currentUser.username];
            this.todos = user?.todos || [];
            
            // Set counter ke nomor tertinggi + 1
            if (this.todos.length > 0) {
                this.todoCounter = Math.max(...this.todos.map(t => t.number || 0)) + 1;
            } else {
                this.todoCounter = 1;
            }
            
            this.renderTodos();
        } catch (error) {
            console.error('Failed to load todos:', error);
            this.todos = [];
            this.todoCounter = 1;
        }
    }
    
    saveUserTodos() {
        try {
            if (!this.currentUser) return;
            
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[this.currentUser.username]) {
                users[this.currentUser.username].todos = this.todos;
                localStorage.setItem('users', JSON.stringify(users));
            }
        } catch (error) {
            console.error('Failed to save todos:', error);
        }
    }
    
    addTodo() {
        const input = document.getElementById('todoInput');
        const dateInput = document.getElementById('todoDate');
        const text = input?.value.trim();
        const date = dateInput?.value;
        
        if (text) {
            const now = new Date();
            const dueDate = date ? new Date(date) : new Date(now.setDate(now.getDate() + 1));
            
            const todo = {
                id: Date.now(),
                number: this.todoCounter++,
                text: text,
                completed: false,
                important: false,
                createdAt: new Date().toISOString(),
                dueDate: dueDate.toISOString(),
                priority: this.calculatePriority(dueDate)
            };
            
            this.todos.push(todo);
            input.value = '';
            this.setupDateInput(); // Reset date to tomorrow
            this.saveUserTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('Task added!');
        }
    }
    
    calculatePriority(dueDate) {
        const today = new Date();
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'today';
        if (diffDays <= 2) return 'high';
        if (diffDays <= 7) return 'medium';
        return 'low';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }
    
    toggleTodo(id) {
        this.todos = this.todos.map(todo => {
            if (todo.id === id) {
                const updatedTodo = { ...todo, completed: !todo.completed };
                // Update priority if task is completed/not completed
                if (!updatedTodo.completed) {
                    updatedTodo.priority = this.calculatePriority(new Date(todo.dueDate));
                }
                return updatedTodo;
            }
            return todo;
        });
        this.saveUserTodos();
        this.renderTodos();
        this.updateStats();
    }
    
    toggleImportant(id) {
        this.todos = this.todos.map(todo => 
            todo.id === id ? { ...todo, important: !todo.important } : todo
        );
        this.saveUserTodos();
        this.renderTodos();
        this.showNotification('Priority updated!');
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveUserTodos();
        this.renderTodos();
        this.updateStats();
        this.showNotification('Task deleted');
    }
    
    filterTodos(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        const eventBtn = event?.target;
        if (eventBtn) {
            eventBtn.classList.add('active');
            eventBtn.setAttribute('aria-selected', 'true');
        }
        
        this.renderTodos();
    }
    
    renderTodos() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;
        
        const filteredTodos = this.todos.filter(todo => {
            switch(this.currentFilter) {
                case 'active': return !todo.completed;
                case 'completed': return todo.completed;
                case 'important': return todo.important;
                case 'today': 
                    const today = new Date().toDateString();
                    return new Date(todo.dueDate).toDateString() === today && !todo.completed;
                default: return true;
            }
        }).sort((a, b) => {
            // Sort by: overdue > today > priority > date
            const priorityOrder = { 'overdue': 0, 'today': 1, 'high': 2, 'medium': 3, 'low': 4 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        this.updateStats();
        
        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <div class="icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <p>No ${this.currentFilter === 'all' ? '' : this.currentFilter} tasks to show</p>
                </div>
            `;
            return;
        }
        
        // Reset display counter untuk tampilan
        let displayCounter = 1;
        
        const fragment = document.createDocumentFragment();
        
        filteredTodos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            
            const priorityClass = `priority-${todo.priority}`;
            const dateClass = todo.priority === 'overdue' ? 'date-overdue' : 
                            todo.priority === 'today' ? 'date-today' : '';
            
            todoItem.innerHTML = `
                <div class="priority-indicator ${priorityClass}"></div>
                <div class="todo-number">${displayCounter.toString().padStart(2, '0')}</div>
                <div class="checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="app.toggleTodo(${todo.id})"
                     role="checkbox"
                     aria-checked="${todo.completed}"></div>
                <div class="todo-content">
                    <div class="todo-main">
                        <div class="todo-text ${todo.completed ? 'completed' : ''}">
                            ${this.escapeHtml(todo.text)}
                            ${todo.important ? '<i class="fas fa-star" style="color: #1DB954; margin-left: 8px; font-size: 0.8em;"></i>' : ''}
                        </div>
                    </div>
                    <div class="todo-date">
                        <i class="far fa-calendar"></i>
                        <span class="date-badge ${dateClass}">${this.formatDate(todo.dueDate)}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn star-btn ${todo.important ? 'important' : ''}" 
                            onclick="app.toggleImportant(${todo.id})"
                            aria-label="${todo.important ? 'Remove importance' : 'Mark important'}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="action-btn delete-btn" 
                            onclick="app.deleteTodo(${todo.id})"
                            aria-label="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            fragment.appendChild(todoItem);
            displayCounter++;
        });
        
        todoList.innerHTML = '';
        todoList.appendChild(fragment);
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;
        const important = this.todos.filter(t => t.important).length;
        const today = new Date().toDateString();
        const todayCount = this.todos.filter(t => 
            new Date(t.dueDate).toDateString() === today && !t.completed
        ).length;
        
        const userStats = document.getElementById('userStats');
        if (userStats) {
            userStats.textContent = `${total} tasks • ${completed} completed`;
        }
        
        const updateStat = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateStat('totalCount', total);
        updateStat('activeCount', active);
        updateStat('completedCount', completed);
        updateStat('importantCount', important);
        updateStat('todayCount', todayCount);
    }
    
    // ====================
    // MUSIC FUNCTIONS
    // ====================
    toggleMusic() {
        if (this.isPlaying) {
            this.music.pause();
        } else {
            this.music.play().catch(e => {
                console.log("Autoplay prevented:", e);
                this.updateMusicStatus('Click play to start music');
            });
        }
        
        this.isPlaying = !this.isPlaying;
        this.updateMusicUI();
    }
    
    updateMusicUI() {
        const playBtn = document.getElementById('playBtn');
        const status = document.getElementById('musicStatus');
        const visualizer = document.querySelector('.visualizer');
        
        if (!playBtn || !status) return;
        
        if (this.isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            status.textContent = 'Now playing...';
            if (visualizer) visualizer.style.opacity = '1';
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            status.textContent = 'Paused';
            if (visualizer) visualizer.style.opacity = '0.5';
        }
    }
    
    setVolume(value) {
        const volume = Math.max(0, Math.min(100, parseInt(value) || 50));
        this.music.volume = volume / 100;
        
        const volumeText = document.getElementById('volumeText');
        if (volumeText) volumeText.textContent = volume + '%';
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = volume;
        }
        
        // Update volume icon
        const volumeIcon = document.querySelector('.volume-icon i');
        if (volumeIcon) {
            if (volume === 0) {
                volumeIcon.className = 'fas fa-volume-mute';
            } else if (volume < 50) {
                volumeIcon.className = 'fas fa-volume-down';
            } else {
                volumeIcon.className = 'fas fa-volume-up';
            }
        }
    }
    
    changeVolume(value) {
        this.setVolume(value);
    }
    
    updateMusicStatus(text) {
        const status = document.getElementById('musicStatus');
        if (status) status.textContent = text;
    }
    
    // ====================
    // UI FUNCTIONS
    // ====================
    showApp() {
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        
        if (!this.currentUser) return;
        
        // Update user info
        const greeting = document.getElementById('userGreeting');
        const avatar = document.getElementById('userAvatar');
        
        if (greeting) greeting.textContent = `Welcome, ${this.currentUser.username}!`;
        if (avatar) avatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
        
        // Show app
        if (authContainer) authContainer.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'block';
            appContainer.removeAttribute('hidden');
        }
        
        // Load todos
        this.loadUserTodos();
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        
        if (!notification || !text) return;
        
        text.textContent = message;
        notification.style.display = 'flex';
        notification.className = type === 'error' ? 'notification error' : 'notification';
        
        // Auto-hide
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    togglePassword(event) {
        const button = event.currentTarget;
        const inputId = button.id.includes('Login') ? 'loginPassword' : 
                       button.id.includes('Confirm') ? 'registerConfirm' : 'registerPassword';
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');
        
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    // ====================
    // UTILITY FUNCTIONS
    // ====================
    simpleEncrypt(text) {
        return btoa(encodeURIComponent(text)).split('').reverse().join('');
    }
    
    simpleDecrypt(text) {
        return decodeURIComponent(atob(text.split('').reverse().join('')));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ====================
// GLOBAL APP INSTANCE
// ====================
let app;

// ====================
// INITIALIZATION
// ====================
document.addEventListener('DOMContentLoaded', function() {
    app = new TodoApp();
    
    // Expose functions to global scope for onclick handlers
    window.showRegister = () => app.showRegister();
    window.showLogin = () => app.showLogin();
    window.logout = () => app.logout();
    window.addTodo = () => app.addTodo();
    window.filterTodos = (filter) => app.filterTodos(filter);
    window.toggleMusic = () => app.toggleMusic();
    window.changeVolume = (value) => app.changeVolume(value);
    window.toggleTodo = (id) => app.toggleTodo(id);
    window.toggleImportant = (id) => app.toggleImportant(id);
    window.deleteTodo = (id) => app.deleteTodo(id);
    window.handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            app.addTodo();
        }
    };
    
    // Update opacity untuk FOUC prevention
    document.documentElement.style.opacity = '1';
});