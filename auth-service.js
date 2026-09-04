/**
 * AuthService — Authentication and session management
 */

const ADMIN_USERNAME = 'AtulMishra';
const ADMIN_PASSWORD = 'Mishraatul161';

// Safe storage fallback
const safeStorage = {
  get(key) {
    try {
      const localVal = window.localStorage ? window.localStorage.getItem(key) : null;
      if (localVal) return localVal;
      const sessionVal = window.sessionStorage ? window.sessionStorage.getItem(key) : null;
      if (sessionVal) return sessionVal;
      return window.__storageFallback?.[key] || null;
    } catch (e) {
      return window.__storageFallback?.[key] || null;
    }
  },
  set(key, value, persistent = true) {
    try {
      if (persistent && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      window.__storageFallback = window.__storageFallback || {};
      window.__storageFallback[key] = String(value);
    }
  },
  remove(key) {
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
      if (window.sessionStorage) window.sessionStorage.removeItem(key);
    } catch (e) {
      if (window.__storageFallback) delete window.__storageFallback[key];
    }
  }
};

class AuthService {
  constructor() {
    this.defaultUsername = ADMIN_USERNAME;
    this.defaultPassword = ADMIN_PASSWORD;
  }

  getUsername() {
    return safeStorage.get('cmAdminUser') || this.defaultUsername;
  }

  getPassword() {
    return safeStorage.get('cmAdminPass') || this.defaultPassword;
  }

  validateLogin(username, password) {
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();
    const activeUser = this.getUsername().toLowerCase();
    const activePass = this.getPassword();

    return (
      (cleanUsername === activeUser && cleanPassword === activePass) ||
      (cleanUsername === 'atulmishra' && cleanPassword === this.defaultPassword)
    );
  }

  login(username, password) {
    if (this.validateLogin(username, password)) {
      const rememberEl = document.getElementById('rememberMe');
      const isPersistent = rememberEl ? rememberEl.checked : true;
      safeStorage.set('cmUser', 'admin', isPersistent);
      return true;
    }
    return false;
  }

  logout() {
    safeStorage.remove('cmUser');
    try {
      sessionStorage.removeItem('cmActiveTab');
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {}
  }

  guestLogin() {
    safeStorage.set('cmUser', 'guest');
  }

  getUserRole() {
    const user = safeStorage.get('cmUser');
    if (user === 'guest') return 'guest';
    return user === 'admin' ? 'admin' : 'guest';
  }

  changeCredentials(currentPass, newUsername, newPass, confirmPass) {
    const statusMsg = document.getElementById('settingsStatus');
    
    if (currentPass !== this.getPassword()) {
      if (statusMsg) {
        statusMsg.textContent = 'Current password is incorrect.';
        statusMsg.className = 'error-message';
      }
      return false;
    }

    if (!newUsername) {
      if (statusMsg) {
        statusMsg.textContent = 'Username cannot be empty.';
        statusMsg.className = 'error-message';
      }
      return false;
    }

    if (newPass.length < 4) {
      if (statusMsg) {
        statusMsg.textContent = 'New password must be at least 4 characters long.';
        statusMsg.className = 'error-message';
      }
      return false;
    }

    if (newPass !== confirmPass) {
      if (statusMsg) {
        statusMsg.textContent = 'New password and confirmation do not match.';
        statusMsg.className = 'error-message';
      }
      return false;
    }

    safeStorage.set('cmAdminUser', newUsername, true);
    safeStorage.set('cmAdminPass', newPass, true);

    if (statusMsg) {
      statusMsg.textContent = `Credentials updated successfully! Next login username: "${newUsername}".`;
      statusMsg.className = 'success-message';
    }

    const activeUserEl = document.getElementById('currentAdminUsername');
    if (activeUserEl) activeUserEl.value = newUsername;

    if (document.getElementById('currentPassword')) document.getElementById('currentPassword').value = '';
    if (document.getElementById('newPassword')) document.getElementById('newPassword').value = '';
    if (document.getElementById('confirmNewPassword')) document.getElementById('confirmNewPassword').value = '';

    alert(`Admin credentials updated successfully!\nNew Username: ${newUsername}`);
    return true;
  }

  setActiveScreen(screenId) {
    const screens = ['loginScreen', 'guestScreen', 'adminScreen'];
    screens.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.toggle('hidden', id !== screenId);
      }
    });
  }
}

// PWA Install handling
function triggerPwaInstall() {
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    window.deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        console.log('PWA install accepted');
      }
      window.deferredPrompt = null;
    });
  } else {
    alert('Please use your browser\'s "Add to Home Screen" option to install this app.');
  }
}

window.triggerPwaInstall = triggerPwaInstall;

// Handle PWA install event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
  console.log('PWA application successfully installed!');
});

export { AuthService, safeStorage };