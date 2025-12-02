        // ====================
        // Global Variables
        // ====================
        let currentUser = null;
        let todos = [];
        let currentFilter = 'all';
        let music = document.getElementById('bgMusic');
        let isPlaying = false;

        // ====================
        // Password Visibility Toggle
        // ====================
        function setupPasswordToggles() {
            // Login password toggle
            document.getElementById('toggleLoginPassword').addEventListener('click', function() {
                const passwordInput = document.getElementById('loginPassword');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
            
            // Register password toggle
            document.getElementById('toggleRegisterPassword').addEventListener('click', function() {
                const passwordInput = document.getElementById('registerPassword');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
            
            // Register confirm toggle
            document.getElementById('toggleRegisterConfirm').addEventListener('click', function() {
                const confirmInput = document.getElementById('registerConfirm');
                const icon = this.querySelector('i');
                
                if (confirmInput.type === 'password') {
                    confirmInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    confirmInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }

        // ====================
        // Notification System
        // ====================
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            const text = document.getElementById('notificationText');
            
            text.textContent = message;
            notification.style.display = 'flex';
            
            if (type === 'error') {
                notification.style.background = 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)';
            } else {
                notification.style.background = 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)';
            }
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }

        // ====================
        // Authentication Functions
        // ====================
        function showRegister() {
            document.getElementById('loginBox').style.display = 'none';
            document.getElementById('registerBox').style.display = 'block';
            document.getElementById('registerForm').reset();
            
            // Reset strength meter
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            strengthFill.className = 'strength-fill strength-weak';
            strengthText.textContent = 'Weak';
        }

        function showLogin() {
            document.getElementById('registerBox').style.display = 'none';
            document.getElementById('loginBox').style.display = 'block';
            document.getElementById('loginForm').reset();
        }

        // Simple encryption for passwords
        function simpleEncrypt(text) {
            return btoa(text).split('').reverse().join('');
        }

        function simpleDecrypt(text) {
            return atob(text.split('').reverse().join(''));
        }

        // Check if user is logged in on page load
        function checkAuth() {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                currentUser = JSON.parse(userData);
                showApp();
            }
        }

        // Register new user
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirm = document.getElementById('registerConfirm').value;
            
            // Validation
            if (!username) {
                showNotification('Username is required!', 'error');
                return;
            }
            
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            if (password !== confirm) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[username]) {
                showNotification('Username already taken!', 'error');
                return;
            }
            
            // Create new user
            const userData = {
                username: username,
                email: email || '',
                password: simpleEncrypt(password),
                createdAt: new Date().toISOString()
            };
            
            users[username] = userData;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Auto login
            currentUser = { username, email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Account created successfully!');
            showApp();
        });

        // Login user
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!username || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Check user
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            
            if (!user || simpleDecrypt(user.password) !== password) {
                showNotification('Invalid username or password!', 'error');
                return;
            }
            
            // Login successful
            currentUser = { 
                username: user.username, 
                email: user.email 
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification(`Welcome back, ${username}!`);
            showApp();
        });

        // Logout
        function logout() {
            localStorage.removeItem('currentUser');
            currentUser = null;
            todos = [];
            
            document.getElementById('appContainer').style.display = 'none';
            document.getElementById('authContainer').style.display = 'flex';
            document.getElementById('loginBox').style.display = 'block';
            document.getElementById('registerBox').style.display = 'none';
            
            // Clear forms
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();
            
            showNotification('Logged out successfully');
        }

        // Show app interface
        function showApp() {
            // Update user info
            document.getElementById('userGreeting').textContent = `Welcome, ${currentUser.username}!`;
            document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
            
            // Load user's todos
            loadUserTodos();
            
            // Update user stats
            updateUserStats();
            
            // Show app
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
        }

        // ====================
        // Todo App Functions
        // ====================
        function loadUserTodos() {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[currentUser.username];
            todos = user?.todos || [];
            renderTodos();
        }

        function saveUserTodos() {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[currentUser.username]) {
                users[currentUser.username].todos = todos;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }

        function updateUserStats() {
            const total = todos.length;
            const completed = todos.filter(t => t.completed).length;
            document.getElementById('userStats').textContent = `${total} tasks • ${completed} completed`;
        }

        function addTodo() {
            const input = document.getElementById('todoInput');
            const text = input.value.trim();
            
            if (text) {
                const todo = {
                    id: Date.now(),
                    text: text,
                    completed: false,
                    important: false,
                    createdAt: new Date().toISOString()
                };
                
                todos.push(todo);
                input.value = '';
                saveUserTodos();
                renderTodos();
                updateUserStats();
                showNotification('Task added!');
            }
        }

        function toggleTodo(id) {
            todos = todos.map(todo => 
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            );
            saveUserTodos();
            renderTodos();
            updateUserStats();
        }

        function toggleImportant(id) {
            todos = todos.map(todo => 
                todo.id === id ? { ...todo, important: !todo.important } : todo
            );
            saveUserTodos();
            renderTodos();
        }

        function deleteTodo(id) {
            todos = todos.filter(todo => todo.id !== id);
            saveUserTodos();
            renderTodos();
            updateUserStats();
            showNotification('Task deleted');
        }

        function filterTodos(filter) {
            currentFilter = filter;
            
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            renderTodos();
        }

        function renderTodos() {
            const todoList = document.getElementById('todoList');
            
            let filteredTodos = todos.filter(todo => {
                if (currentFilter === 'active') return !todo.completed;
                if (currentFilter === 'completed') return todo.completed;
                if (currentFilter === 'important') return todo.important;
                return true;
            });

            // Update stats
            document.getElementById('totalCount').textContent = todos.length;
            document.getElementById('activeCount').textContent = todos.filter(t => !t.completed).length;
            document.getElementById('completedCount').textContent = todos.filter(t => t.completed).length;
            document.getElementById('importantCount').textContent = todos.filter(t => t.important).length;

            if (filteredTodos.length === 0) {
                todoList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <p>No tasks to show</p>
                    </div>
                `;
                return;
            }

            todoList.innerHTML = filteredTodos.map(todo => `
                <div class="todo-item">
                    <div class="checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})"></div>
                    <div class="todo-text ${todo.completed ? 'completed' : ''}">
                        ${todo.text}
                        ${todo.important ? '<i class="fas fa-star" style="color: #1DB954; margin-left: 8px; font-size: 0.8em;"></i>' : ''}
                    </div>
                    <div class="todo-actions">
                        <button class="action-btn star-btn ${todo.important ? 'important' : ''}" onclick="toggleImportant(${todo.id})">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                addTodo();
            }
        }

        // ====================
        // Music Player Functions - UPGRADED!
        // ====================
        function toggleMusic() {
            const playBtn = document.getElementById('playBtn');
            const status = document.getElementById('musicStatus');
            const visualizer = document.querySelector('.visualizer');
            
            if (isPlaying) {
                music.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                status.textContent = 'Paused';
                isPlaying = false;
                visualizer.style.opacity = '0.5';
            } else {
                music.play().catch(e => {
                    console.log("Autoplay prevented:", e);
                    status.textContent = 'Click play to start music';
                });
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                status.textContent = 'Now playing...';
                isPlaying = true;
                visualizer.style.opacity = '1';
            }
        }

        function changeVolume(value) {
            music.volume = value / 100;
            document.getElementById('volumeText').textContent = value + '%';
            
            // Update volume icon based on level
            const volumeIcon = document.querySelector('.volume-icon i');
            if (value == 0) {
                volumeIcon.className = 'fas fa-volume-mute';
            } else if (value < 0) {
                volumeIcon.className = 'fas fa-volume-down';
            } else if (value < 0) {
                volumeIcon.className = 'fas fa-volume';
            } else {
                volumeIcon.className = 'fas fa-volume-up';
            }
            
            // Pastikan slider tetap terlihat
            const slider = document.getElementById('volumeSlider');
            slider.style.opacity = '1';
        }

        // ====================
        // Initialize App
        // ====================
        document.addEventListener('DOMContentLoaded', function() {
            // Setup password toggles
            setupPasswordToggles();
            
            // Check if user is already logged in
            checkAuth();
            
            // Set initial volume
            music.volume = 0.5;
            
            // Initialize slider
            const slider = document.getElementById('volumeSlider');
            slider.addEventListener('mousedown', function() {
                this.style.opacity = '1';
            });
        });