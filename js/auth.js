/* ============================================
   ARTSY PRODUCTION — Authentication & Session Manager
   Clean User Flow & Role-Based Access
   ============================================ */

const AUTH_STORAGE_KEY = 'artsy_auth_user';

// Mock User Database
const DEFAULT_USERS = {
  client: {
    phone: '+91 98765 00003',
    role: 'client',
    name: 'Sneha Patel',
    status: 'active'
  },
  freelancer: {
    phone: '+91 98765 00002',
    role: 'freelancer',
    name: 'Aakash Verma',
    status: 'approved',
    skills: ['Wedding Films', 'Color Grading', 'Sound Design'],
    software: ['Premiere Pro', 'DaVinci Resolve'],
    earnings: 38500
  },
  admin: {
    phone: '+91 98765 00001',
    role: 'admin',
    name: 'Karan (Studio Director)',
    status: 'active'
  }
};

const Auth = {
  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  },

  sendOtp(phone, role, fullName = '', mode = 'signin') {
    const mockOtp = '123456';
    sessionStorage.setItem('pending_phone', phone);
    sessionStorage.setItem('pending_role', role);
    sessionStorage.setItem('pending_name', fullName);
    sessionStorage.setItem('pending_mode', mode);
    sessionStorage.setItem('pending_otp', mockOtp);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `OTP sent via WhatsApp to ${phone}`,
          testCode: mockOtp
        });
      }, 400);
    });
  },

  verifyOtp(code) {
    const pendingRole = sessionStorage.getItem('pending_role') || 'client';
    const pendingPhone = sessionStorage.getItem('pending_phone') || '+91 98765 43210';
    const pendingName = sessionStorage.getItem('pending_name') || '';
    const correctOtp = sessionStorage.getItem('pending_otp') || '123456';

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code === correctOtp || code === '123456') {
          const defaultInfo = DEFAULT_USERS[pendingRole] || {
            name: pendingRole === 'admin' ? 'Studio Director' : (pendingRole === 'freelancer' ? 'Aakash Verma' : 'Sneha Patel'),
            status: 'active'
          };

          const user = {
            ...defaultInfo,
            phone: pendingPhone,
            role: pendingRole,
            name: pendingName.trim() || defaultInfo.name,
            status: 'active'
          };

          Auth.setCurrentUser(user);

          // Determine redirect URL
          const returnRedirect = sessionStorage.getItem('auth_redirect');
          sessionStorage.removeItem('auth_redirect');

          let redirectUrl = returnRedirect;
          if (!redirectUrl || redirectUrl.includes('login.html')) {
            if (pendingRole === 'admin') redirectUrl = 'admin.html';
            else if (pendingRole === 'freelancer') redirectUrl = 'freelancer.html';
            else redirectUrl = 'client-dashboard.html';
          }

          resolve({ success: true, user, redirectUrl });
        } else {
          reject({ success: false, message: 'Invalid OTP. Enter 123456 to sign in.' });
        }
      }, 400);
    });
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.clear();
    window.location.href = 'login.html';
  },

  // Protect Portal Routes: require user to be logged in
  requireAuth(allowedRole) {
    const user = Auth.getCurrentUser();
    if (!user) {
      // Save current page so user returns here after login
      const currentFile = window.location.pathname.split('/').pop() || 'client-dashboard.html';
      sessionStorage.setItem('auth_redirect', currentFile);
      window.location.href = 'login.html';
      return null;
    }

    if (allowedRole && user.role !== allowedRole) {
      if (user.role === 'admin') window.location.href = 'admin.html';
      else if (user.role === 'freelancer') window.location.href = 'freelancer.html';
      else window.location.href = 'client-dashboard.html';
      return null;
    }

    // Populate user display names if elements exist
    document.querySelectorAll('.portal-user-name').forEach(el => {
      el.textContent = user.name;
    });

    return user;
  },

  // Update Navbar on Storefront based on login state
  updateNavbarState() {
    const user = Auth.getCurrentUser();
    const signinContainer = document.querySelector('.nav-actions-group');
    const signinBtn = document.getElementById('nav-signin-trigger');

    if (!signinContainer || !signinBtn) return;

    if (user) {
      // User is logged in: show their dashboard button and sign out
      let destination = 'client-dashboard.html';
      let roleLabel = 'Client Portal';
      if (user.role === 'admin') {
        destination = 'admin.html';
        roleLabel = 'Admin Panel';
      } else if (user.role === 'freelancer') {
        destination = 'freelancer.html';
        roleLabel = 'Editor Portal';
      }

      signinBtn.href = destination;
      signinBtn.innerHTML = `
        <span>${user.name.split(' ')[0]} (${roleLabel})</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      `;

      // Check if sign out link exists
      let logoutBtn = document.getElementById('nav-logout-action');
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'nav-logout-action';
        logoutBtn.innerText = 'Log out';
        logoutBtn.style.cssText = 'background:none; border:none; font-size:12px; font-weight:600; color:var(--color-text-muted); cursor:pointer; padding:6px 10px; margin-left:4px; border-radius:6px;';
        logoutBtn.onmouseenter = () => logoutBtn.style.color = '#EF4444';
        logoutBtn.onmouseleave = () => logoutBtn.style.color = 'var(--color-text-muted)';
        logoutBtn.onclick = () => Auth.logout();
        signinContainer.appendChild(logoutBtn);
      }
    } else {
      // Not logged in: ensure clean state
      signinBtn.href = 'login.html';
      signinBtn.innerHTML = `
        <span>Sign In</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      `;
      const logoutBtn = document.getElementById('nav-logout-action');
      if (logoutBtn) logoutBtn.remove();
    }
  }
};
