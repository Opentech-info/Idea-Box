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

    // --- 2FA Modal Logic (Advanced, Backend Connected, TOTP + SMS) ---
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
        // Add QR and backup codes containers if not present
        let qrImg, backupCodesDiv, smsForm, smsInput, smsVerifyBtn, smsStatusDiv;
        if (!document.getElementById('2faQrImg')) {
            qrImg = document.createElement('img');
            qrImg.id = '2faQrImg';
            qrImg.style.display = 'block';
            qrImg.style.margin = '18px auto 10px auto';
            qrImg.style.maxWidth = '180px';
            msgDiv.parentNode.insertBefore(qrImg, msgDiv);
        } else {
            qrImg = document.getElementById('2faQrImg');
        }
        if (!document.getElementById('2faBackupCodes')) {
            backupCodesDiv = document.createElement('div');
            backupCodesDiv.id = '2faBackupCodes';
            backupCodesDiv.style.margin = '10px 0 0 0';
            msgDiv.parentNode.appendChild(backupCodesDiv);
        } else {
            backupCodesDiv = document.getElementById('2faBackupCodes');
        }
        // SMS 2FA UI
        if (!document.getElementById('sms2faForm')) {
            smsForm = document.createElement('form');
            smsForm.id = 'sms2faForm';
            smsForm.style.margin = '18px 0 0 0';
            smsForm.innerHTML = `
                <div class="form-group">
                    <label for="sms2faPhone">Phone Number (for SMS 2FA)</label>
                    <input type="tel" id="sms2faPhone" placeholder="+255..." required>
                </div>
                <button type="submit" class="btn btn-outline">Send OTP</button>
                <div id="sms2faStatus" style="margin-top:8px;"></div>
                <div id="sms2faVerifyWrap" style="display:none;margin-top:10px;">
                    <input type="text" id="sms2faOtp" maxlength="6" placeholder="Enter OTP" style="width:120px;">
                    <button type="button" class="btn btn-primary" id="sms2faVerifyBtn">Verify & Enable SMS 2FA</button>
                </div>
            `;
            msgDiv.parentNode.insertBefore(smsForm, msgDiv.nextSibling);
        } else {
            smsForm = document.getElementById('sms2faForm');
        }
        smsInput = smsForm.querySelector('#sms2faPhone');
        smsVerifyBtn = smsForm.querySelector('#sms2faVerifyBtn');
        smsStatusDiv = smsForm.querySelector('#sms2faStatus');
        // State
        let enabled = false;
        let secret = null;
        let backupCodes = [];
        // Open modal: fetch 2FA status
        if (openBtn && modal) {
            openBtn.addEventListener('click', async () => {
                modal.style.display = 'block';
                statusDiv.innerHTML = '';
                msgDiv.innerHTML = '';
                qrImg.style.display = 'none';
                backupCodesDiv.style.display = 'none';
                smsForm.style.display = 'block';
                smsForm.querySelector('#sms2faVerifyWrap').style.display = 'none';
                // Fetch 2FA status from backend
                try {
                    const res = await api.get('/api/auth/profile');
                    if (res.two_factor_enabled) {
                        enabled = true;
                        statusDiv.innerHTML = '<span style="color:#27ae60;font-weight:bold;">2FA Enabled</span>';
                        enableBtn.style.display = 'none';
                        disableBtn.style.display = 'inline-block';
                        smsForm.style.display = 'none';
                    } else {
                        enabled = false;
                        statusDiv.innerHTML = '<span style="color:#e74c3c;font-weight:bold;">2FA Disabled</span>';
                        enableBtn.style.display = 'inline-block';
                        disableBtn.style.display = 'none';
                        smsForm.style.display = 'block';
                    }
                } catch (e) {
                    statusDiv.innerHTML = '<span style="color:#e74c3c;">Failed to fetch 2FA status</span>';
                }
            });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        }
        // Enable 2FA: setup (get QR, secret, backup codes)
        if (enableBtn) {
            enableBtn.addEventListener('click', async () => {
                try {
                    const res = await api.post('/api/auth/2fa/setup');
                    secret = res.secret;
                    qrImg.src = res.qr;
                    qrImg.style.display = 'block';
                    backupCodes = res.backupCodes;
                    backupCodesDiv.innerHTML = '<b>Backup Codes:</b><br>' + backupCodes.map(c => `<code>${c}</code>`).join(' ');
                    backupCodesDiv.innerHTML += `<br><button class="btn btn-sm" id="downloadBackupCodesBtn">Download Codes</button> <button class="btn btn-sm" id="regenBackupCodesBtn">Regenerate</button>`;
                    backupCodesDiv.style.display = 'block';
                    msgDiv.innerHTML = 'Scan the QR code with Google Authenticator or Authy, or enter the secret manually: <b>' + secret + '</b><br>Then enter the 6-digit code below to enable 2FA.';
                    verifyForm.style.display = 'block';
                    // Download backup codes
                    setTimeout(() => {
                        const downloadBtn = document.getElementById('downloadBackupCodesBtn');
                        if (downloadBtn) {
                            downloadBtn.onclick = () => {
                                window.open('/api/auth/2fa/backup-codes/download', '_blank');
                            };
                        }
                        const regenBtn = document.getElementById('regenBackupCodesBtn');
                        if (regenBtn) {
                            regenBtn.onclick = async () => {
                                try {
                                    const regen = await api.post('/api/auth/2fa/backup-codes');
                                    backupCodes = regen.backupCodes;
                                    backupCodesDiv.innerHTML = '<b>Backup Codes:</b><br>' + backupCodes.map(c => `<code>${c}</code>`).join(' ');
                                    backupCodesDiv.innerHTML += `<br><button class=\"btn btn-sm\" id=\"downloadBackupCodesBtn\">Download Codes</button> <button class=\"btn btn-sm\" id=\"regenBackupCodesBtn\">Regenerate</button>`;
                                    setTimeout(() => {
                                        document.getElementById('downloadBackupCodesBtn').onclick = () => window.open('/api/auth/2fa/backup-codes/download', '_blank');
                                        document.getElementById('regenBackupCodesBtn').onclick = regenBtn.onclick;
                                    }, 100);
                                } catch {
                                    authHandler.showToast('Failed to regenerate codes', 'error');
                                }
                            };
                        }
                    }, 100);
                } catch (e) {
                    msgDiv.innerHTML = '<span style="color:#e74c3c;">Failed to setup 2FA</span>';
                }
            });
        }
        // Verify and enable 2FA
        if (verifyForm) {
            verifyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const code = codeInput.value.trim();
                    const res = await api.post('/api/auth/2fa/enable', { code });
                    statusDiv.innerHTML = '<span style="color:#27ae60;font-weight:bold;">2FA Enabled</span>';
                    msgDiv.innerHTML = '2FA is now enabled!';
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                    verifyForm.style.display = 'none';
                    smsForm.style.display = 'none';
                } catch (err) {
                    msgDiv.innerHTML = '<span style="color:#e74c3c;">Invalid code. Try again.</span>';
                }
            });
        }
        // SMS 2FA: send OTP
        smsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = smsInput.value.trim();
            if (!phone) return smsStatusDiv.innerHTML = '<span style="color:#e74c3c;">Enter phone number</span>';
            try {
                await api.post('/api/auth/2fa/sms/setup', { phone });
                smsStatusDiv.innerHTML = '<span style="color:#27ae60;">OTP sent to your phone</span>';
                smsForm.querySelector('#sms2faVerifyWrap').style.display = 'block';
            } catch (err) {
                smsStatusDiv.innerHTML = '<span style="color:#e74c3c;">Failed to send OTP</span>';
            }
        });
        // SMS 2FA: verify OTP
        smsVerifyBtn.addEventListener('click', async () => {
            const otp = smsForm.querySelector('#sms2faOtp').value.trim();
            if (!otp) return smsStatusDiv.innerHTML = '<span style="color:#e74c3c;">Enter OTP</span>';
            try {
                await api.post('/api/auth/2fa/sms/verify', { otp });
                statusDiv.innerHTML = '<span style="color:#27ae60;font-weight:bold;">2FA Enabled (SMS)</span>';
                smsStatusDiv.innerHTML = '<span style="color:#27ae60;">SMS 2FA enabled!</span>';
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'inline-block';
                smsForm.style.display = 'none';
            } catch (err) {
                smsStatusDiv.innerHTML = '<span style="color:#e74c3c;">Invalid OTP. Try again.</span>';
            }
        });
        // Disable 2FA
        if (disableBtn) {
            disableBtn.addEventListener('click', async () => {
                try {
                    let code = prompt('Enter your current 2FA code or OTP to disable:');
                    if (!code) return;
                    // Try TOTP disable first, then SMS
                    try {
                        await api.post('/api/auth/2fa/disable', { code });
                    } catch {
                        await api.post('/api/auth/2fa/sms/disable', {});
                    }
                    statusDiv.innerHTML = '<span style="color:#e74c3c;font-weight:bold;">2FA Disabled</span>';
                    msgDiv.innerHTML = '2FA has been disabled.';
                    disableBtn.style.display = 'none';
                    enableBtn.style.display = 'inline-block';
                    smsForm.style.display = 'block';
                } catch (err) {
                    msgDiv.innerHTML = '<span style="color:#e74c3c;">Failed to disable 2FA. Check your code.</span>';
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
        const projectCard = target.closest('.saved-project-card-adv');
        if (!projectCard) return;
        const projectId = projectCard.dataset.projectId;
        if (target.classList.contains('btn-remove')) {
            this.removeFromSaved(projectId);
        } else if (target.classList.contains('btn-view')) {
            window.location.href = 'index.html';
        }
    }

    // --- Profile Tab Logic ---
    async loadUserProfile() {
        try {
            const user = await api.getProfile();
            const avatarImg = document.getElementById('profileAvatarImg');
            const nameInput = document.getElementById('profileName');
            const emailInput = document.getElementById('profileEmail');
            const phoneInput = document.getElementById('profilePhone');
            const bioInput = document.getElementById('profileBio');
            if (avatarImg) avatarImg.src = user.avatar || '../pict/default-avatar.png';
            if (nameInput) nameInput.value = user.username || '';
            if (emailInput) emailInput.value = user.email || '';
            if (phoneInput) phoneInput.value = user.phone_number || '';
            if (bioInput) bioInput.value = user.bio || '';
        } catch (e) {
            authHandler.showToast('Failed to load profile', 'error');
        }
    }

    initProfileTab() {
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        const avatarInput = document.getElementById('profileAvatarInput');
        const avatarImg = document.getElementById('profileAvatarImg');
        if (changeAvatarBtn && avatarInput && avatarImg) {
            changeAvatarBtn.addEventListener('click', function() {
                avatarInput.click();
            });
            avatarInput.addEventListener('change', async function(e) {
                const file = e.target.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('avatar', file);
                    try {
                        const res = await fetch('/api/auth/profile/avatar', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${api.token}` },
                            body: formData
                        });
                        const data = await res.json();
                        if (res.ok && data.avatar) {
                            avatarImg.src = data.avatar;
                            authHandler.showToast('Profile picture updated!', 'success');
                        } else {
                            throw new Error(data.message || 'Failed to upload avatar');
                        }
                    } catch (err) {
                        authHandler.showToast('Failed to upload avatar', 'error');
                    }
                }
            });
        }
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const name = document.getElementById('profileName').value.trim();
                const email = document.getElementById('profileEmail').value.trim();
                const phone = document.getElementById('profilePhone').value.trim();
                const bio = document.getElementById('profileBio').value.trim();
                try {
                    await api.updateProfile({ username: name, email, phone, bio });
                    authHandler.showToast('Profile updated successfully!', 'success');
                } catch (err) {
                    authHandler.showToast('Failed to update profile', 'error');
                }
            });
        }
    }

    // --- Orders Tab Logic ---
    async loadOrderHistory() {
        const container = document.getElementById('ordersList');
        if (!container) return;
        container.innerHTML = '';
        try {
            const orders = await api.getMyOrders();
            if (!orders || orders.length === 0) {
                container.innerHTML = '<p>No orders found.</p>';
                return;
            }
            // Responsive advanced table
            const table = document.createElement('table');
            table.className = 'orders-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Receipt</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.order_number}</td>
                            <td>${new Date(order.created_at).toLocaleDateString()}</td>
                            <td>
                                <ul style="padding-left:16px;">
                                    ${order.items.map(item => `<li>${item.project_name} (x${item.quantity}) - $${item.price}</li>`).join('')}
                                </ul>
                            </td>
                            <td>$${order.total_amount}</td>
                            <td><span class="${order.status === 'completed' ? 'paid' : 'pending'}">${order.status}</span></td>
                            <td>${order.status === 'completed' ? `<button class="btn btn-sm btn-download-receipt" data-order-id="${order.id}">Download Receipt</button>` : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            container.appendChild(table);
            // Download receipt event
            container.querySelectorAll('.btn-download-receipt').forEach(btn => {
                btn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    window.open(`/api/orders/${orderId}/download-receipt`, '_blank');
                });
            });
        } catch (e) {
            container.innerHTML = '<p>Failed to load orders.</p>';
        }
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