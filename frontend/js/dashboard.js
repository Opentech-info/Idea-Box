document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();
});

class Dashboard {
    constructor() {
        this.savedProjects = [];
        this.grid = document.getElementById('savedProjectsGrid');
    }

    init() {
        this.checkAuth();
        this.loadWelcomeMessage();
        this.loadSavedProjects();
        this.loadUserProfile();
        this.loadOrderHistory();
        this.bindEvents();
        this.initProfileTab();
        this.initSettingsTab();
        this.initChangePassword();
        this.init2FA();
        this.initDangerZone();
    }
    // --- Change Password Modal Logic ---
    initChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        const openBtn = document.getElementById('changePasswordBtn');
        const closeBtn = document.getElementById('closeChangePassword');
        const form = document.getElementById('changePasswordForm');
        const strengthDiv = document.getElementById('passwordStrength');
        const awardDiv = document.getElementById('passwordAwardAnimation');
        if (openBtn && modal) {
            openBtn.addEventListener('click', () => { modal.style.display = 'block'; });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        }
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const oldPass = document.getElementById('oldPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmPassword').value;
                if (newPass !== confirmPass) {
                    authHandler.showToast('Passwords do not match', 'error');
                    return;
                }
                if (!this.isStrongPassword(newPass)) {
                    authHandler.showToast('Password is not strong enough', 'error');
                    return;
                }
                // Simulate backend call
                await new Promise(r => setTimeout(r, 800));
                // Show award animation
                if (awardDiv) {
                    awardDiv.innerHTML = this.getAwardAnimationHTML();
                    awardDiv.style.display = 'block';
                    setTimeout(() => { awardDiv.style.display = 'none'; modal.style.display = 'none'; }, 2500);
                }
                authHandler.showToast('Password changed successfully!', 'success');
                form.reset();
            });
            // Password strength meter
            document.getElementById('newPassword').addEventListener('input', (e) => {
                const val = e.target.value;
                if (strengthDiv) strengthDiv.innerHTML = this.getPasswordStrengthHTML(val);
            });
        }
    }

    isStrongPassword(pw) {
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(pw);
    }
    getPasswordStrengthHTML(pw) {
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[a-z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) score++;
        const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
        const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#27ae60', '#2980b9'];
        return `<div style="color:${colors[score-1]||'#ccc'};font-weight:bold;">${levels[score-1]||'Too Short'}</div>`;
    }
    getAwardAnimationHTML() {
        // Simple falling flowers/awards animation
        return `<div class="award-flowers">
            <span class="flower" style="left:10%">🌸</span>
            <span class="flower" style="left:30%">🏆</span>
            <span class="flower" style="left:50%">🌺</span>
            <span class="flower" style="left:70%">🌼</span>
            <span class="flower" style="left:90%">🎉</span>
        </div>`;
    }

    // --- 2FA Modal Logic ---
    init2FA() {
        const modal = document.getElementById('twoFAModal');
        const openBtn = document.getElementById('manage2FABtn');
        const closeBtn = document.getElementById('close2FAModal');
        const enableBtn = document.getElementById('enable2FABtn');
        const disableBtn = document.getElementById('disable2FABtn');
        const verifyForm = document.getElementById('verify2FAForm');
        const codeInput = document.getElementById('twoFACode');
        const statusDiv = document.getElementById('2faStatus');
        const msgDiv = document.getElementById('2faMessage');
        let enabled = false;
        if (openBtn && modal) {
            openBtn.addEventListener('click', () => { modal.style.display = 'block'; });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        }
        if (enableBtn) {
            enableBtn.addEventListener('click', () => {
                verifyForm.style.display = 'block';
                msgDiv.innerHTML = 'Enter the code sent to your email or authenticator app.';
            });
        }
        if (disableBtn) {
            disableBtn.addEventListener('click', () => {
                enabled = false;
                statusDiv.innerHTML = '<span style="color:#e74c3c;font-weight:bold;">2FA Disabled</span>';
                msgDiv.innerHTML = '2FA has been disabled.';
                disableBtn.style.display = 'none';
                enableBtn.style.display = 'inline-block';
            });
        }
        if (verifyForm) {
            verifyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Simulate code check
                if (codeInput.value === '123456') {
                    enabled = true;
                    statusDiv.innerHTML = '<span style="color:#27ae60;font-weight:bold;">2FA Enabled</span>';
                    msgDiv.innerHTML = '2FA is now enabled!';
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                    verifyForm.style.display = 'none';
                } else {
                    msgDiv.innerHTML = '<span style="color:#e74c3c;">Invalid code. Try again.</span>';
                }
            });
        }
    }

    // --- Danger Zone (Delete Account) ---
    initDangerZone() {
        const modal = document.getElementById('deleteAccountModal');
        const openBtn = document.getElementById('deleteAccountBtn');
        const closeBtn = document.getElementById('closeDeleteAccount');
        const form = document.getElementById('deleteAccountForm');
        if (openBtn && modal) {
            openBtn.addEventListener('click', () => { modal.style.display = 'block'; });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        }
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const confirmVal = document.getElementById('deleteConfirm').value;
                if (confirmVal !== 'DELETE') {
                    authHandler.showToast('Type DELETE to confirm', 'error');
                    return;
                }
                // Simulate backend call
                setTimeout(() => {
                    authHandler.showToast('Account deleted. Goodbye!', 'success');
                    modal.style.display = 'none';
                    // Redirect or log out
                    window.location.href = 'index.html';
                }, 1200);
            });
        }
    }

    checkAuth() {
        if (!api.isAuthenticated()) {
            window.location.href = 'index.html';
            setTimeout(() => alert('You must be logged in to view the dashboard.'), 100);
        }
    }

    loadWelcomeMessage() {
        const welcomeMessage = document.getElementById('welcomeMessage');
        const username = api.getUsername();
        if (welcomeMessage && username) {
            welcomeMessage.textContent = `Welcome, ${username}!`;
        }
    }

    async loadSavedProjects() {
        try {
            this.savedProjects = await api.getCart();
            this.renderSavedProjects();
        } catch (error) {
            console.error('Failed to load saved projects:', error);
            if (this.grid) {
                this.grid.innerHTML = '<p>Could not load your saved projects. Please try again later.</p>';
            }
        }
    }

    renderSavedProjects() {
        if (!this.grid) return;
        if (this.savedProjects.length === 0) {
            this.grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h4>No Saved Projects</h4>
                    <p>You haven't saved any projects yet. <a href="projects.html" style="color: var(--primary-color);">Explore projects</a> to get started.</p>
                </div>
            `;
            return;
        }
        this.grid.innerHTML = this.savedProjects.map(project => `
            <div class="saved-project-card-adv" data-project-id="${project.id}">
                <div class="saved-project-image-wrap">
                    <img src="${project.preview_media || '../pict/me6.png'}" alt="${project.name}" class="saved-project-image-adv" onerror="this.src='../pict/me6.png'">
                </div>
                <div class="saved-project-info-adv">
                    <h4 class="saved-project-title-adv">${project.name}</h4>
                    <div class="saved-project-meta">
                        <span class="saved-project-tech-adv">${project.tech_stack}</span>
                        <span class="saved-project-status-adv ${project.status === 'Completed' ? 'completed' : 'in-progress'}">${project.status || ''}</span>
                    </div>
                    <div class="saved-project-description-adv">${project.description ? project.description.substring(0, 80) + (project.description.length > 80 ? '...' : '') : ''}</div>
                    <div class="saved-project-actions-adv">
                        <button class="btn btn-primary btn-view">View</button>
                        <button class="btn btn-danger btn-remove">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async removeFromSaved(projectId) {
        if (confirm('Are you sure you want to remove this project?')) {
            try {
                await api.removeFromCart(projectId);
                authHandler.showToast('Project removed successfully', 'success');
                this.loadSavedProjects();
            } catch (error) {
                authHandler.showToast('Failed to remove project', 'error');
            }
        }
    }

    handleGridClick(e) {
        const target = e.target;
        const projectCard = target.closest('.project-card');
        if (!projectCard) return;
        const projectId = projectCard.dataset.projectId;
        if (target.classList.contains('btn-remove')) {
            this.removeFromSaved(projectId);
        } else if (target.classList.contains('btn-view')) {
            window.location.href = 'index.html';
        }
    }

    // --- Profile Tab Logic ---
    loadUserProfile() {
        // Simulate fetch from backend
        const user = {
            avatar: '../pict/default-avatar.png',
            name: 'Jane Doe',
            email: 'jane.doe@email.com',
            phone: '+255 700 000 000',
            bio: 'Student passionate about AI and Cloud Computing.'
        };
        const avatarImg = document.getElementById('profileAvatarImg');
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const phoneInput = document.getElementById('profilePhone');
        const bioInput = document.getElementById('profileBio');
        if (avatarImg) avatarImg.src = user.avatar;
        if (nameInput) nameInput.value = user.name;
        if (emailInput) emailInput.value = user.email;
        if (phoneInput) phoneInput.value = user.phone;
        if (bioInput) bioInput.value = user.bio;
    }

    initProfileTab() {
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        const avatarInput = document.getElementById('profileAvatarInput');
        const avatarImg = document.getElementById('profileAvatarImg');
        if (changeAvatarBtn && avatarInput && avatarImg) {
            changeAvatarBtn.addEventListener('click', function() {
                avatarInput.click();
            });
            avatarInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        avatarImg.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Simulate save to backend
                authHandler.showToast('Profile updated successfully!', 'success');
            });
        }
    }

    // --- Orders Tab Logic ---
    loadOrderHistory() {
        // Simulate fetch from backend
        const orders = [
            { id: 'ORD-001', date: '2024-06-01', project: 'AI Chatbot', amount: 150, status: 'Paid', receipt: '#' },
            { id: 'ORD-002', date: '2024-06-10', project: 'Cloud Storage App', amount: 200, status: 'Pending', receipt: '#' },
            { id: 'ORD-003', date: '2024-06-15', project: 'Network Security Tool', amount: 180, status: 'Paid', receipt: '#' }
        ];
        const container = document.getElementById('ordersList');
        if (!container) return;
        container.innerHTML = '';
        if (orders.length === 0) {
            container.innerHTML = '<p>No orders found.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'orders-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Receipt</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.date}</td>
                        <td>${order.project}</td>
                        <td>$${order.amount}</td>
                        <td><span class="${order.status === 'Paid' ? 'paid' : 'pending'}">${order.status}</span></td>
                        <td>${order.status === 'Paid' ? `<a href="${order.receipt}" class="btn btn-sm" download>Download</a>` : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        container.appendChild(table);
    }

    // --- Settings Tab Logic ---
    initSettingsTab() {
        const emailToggle = document.getElementById('emailNotificationsToggle');
        const smsToggle = document.getElementById('smsNotificationsToggle');
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (emailToggle) {
            emailToggle.addEventListener('change', function() {
                authHandler.showToast('Email notifications ' + (this.checked ? 'enabled' : 'disabled'), 'info');
            });
        }
        if (smsToggle) {
            smsToggle.addEventListener('change', function() {
                authHandler.showToast('SMS notifications ' + (this.checked ? 'enabled' : 'disabled'), 'info');
            });
        }
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', function() {
                authHandler.showToast('Two-factor authentication ' + (this.checked ? 'enabled' : 'disabled'), 'info');
            });
        }
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', function() {
                authHandler.showToast('Password change dialog would open here.', 'info');
            });
        }
    }

    bindEvents() {
        // Event delegation for project cards
        if (this.grid) {
            this.grid.addEventListener('click', this.handleGridClick.bind(this));
        }
        const navLinks = document.querySelectorAll('.dashboard-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = e.target.closest('a').dataset.tab;
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.closest('a').classList.add('active');
                document.querySelectorAll('.dashboard-tab').forEach(tab => {
                    tab.style.display = 'none';
                    tab.classList.remove('active');
                });
                const activeTab = document.getElementById(`${tabId}-tab`);
                if (activeTab) {
                    activeTab.style.display = 'block';
                    activeTab.classList.add('active');
                }
            });
        });
    }
}