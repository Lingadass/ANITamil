/**
 * auth-gate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared authentication guard, navbar updater & toast utility.
 * Import this at the bottom of any protected page's <body>.
 *
 * Public export:
 *   showToast(message, type)  — type: 'success' | 'error' | 'info'
 */
import { auth, onAuthStateChanged, signOut } from './firebase-config.js';

// ─── Page detection ───────────────────────────────────────────────────────────
const PAGE = window.location.pathname.split('/').pop() || 'index.html';
const PUBLIC_PAGES = new Set(['index.html', 'login.html', 'signup.html', '']);
const IS_PROTECTED = !PUBLIC_PAGES.has(PAGE);

// ─── Overlay helpers ─────────────────────────────────────────────────────────
const overlay = document.getElementById('authOverlay');

function removeOverlay() {
  if (!overlay) {
    document.body.style.opacity = '1';
    return;
  }
  overlay.style.transition = 'opacity 0.35s ease';
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.remove();
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '1';
  }, 360);
}

function setOverlayMessage(msg) {
  if (!overlay) return;
  const spinner = overlay.querySelector('.ag-spinner');
  if (spinner) { spinner.style.transition = 'opacity 0.2s'; spinner.style.opacity = '0'; }
  const label = overlay.querySelector('.ag-label');
  if (label) label.textContent = msg;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `ag-toast ag-toast-${type}`;
  t.innerHTML = `<span class="ag-toast-icon">${icons[type] || icons.info}</span><span class="ag-toast-msg">${message}</span>`;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('ag-toast-show'));
  setTimeout(() => {
    t.classList.remove('ag-toast-show');
    setTimeout(() => t.remove(), 420);
  }, 3500);
}

// ─── Navbar builder ──────────────────────────────────────────────────────────
function buildUserNav(user) {
  const name = (user.displayName || user.email.split('@')[0]).trim();
  const initial = name.charAt(0).toUpperCase();
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  const loginLink   = document.getElementById('loginLink');
  const signupLink  = document.getElementById('signupLink');
  const userProfile = document.getElementById('userProfile');
  const userName    = document.getElementById('userName');
  const logoutLink  = document.getElementById('logoutLink');

  if (loginLink) {
    // index.html — toggle existing nav elements
    loginLink.style.display  = 'none';
    signupLink.style.display = 'none';
    userProfile.style.display = 'flex';
    logoutLink.style.display  = 'flex';
    if (!userProfile.querySelector('.nav-avatar')) {
      const av = document.createElement('span');
      av.className = 'nav-avatar';
      av.textContent = initial;
      userProfile.insertBefore(av, userProfile.firstChild);
    }
    if (userName) userName.textContent = name;
  } else {
    // Anime pages — inject chip + logout if not already present
    if (document.getElementById('navUserChip')) return;
    const chipLi = document.createElement('li');
    chipLi.innerHTML = `<a href="profile.html" id="navUserChip" class="nav-user-chip"><span class="nav-avatar">${initial}</span><span class="nav-chip-name">${name}</span></a>`;
    navLinks.appendChild(chipLi);

    const logoutLi = document.createElement('li');
    logoutLi.innerHTML = `<a href="#" id="logoutLink" class="nav-logout-btn">🚪 Logout</a>`;
    navLinks.appendChild(logoutLi);
  }

  // Attach logout handler
  const lBtn = document.getElementById('logoutLink');
  if (lBtn && !lBtn.dataset.listenerAttached) {
    lBtn.dataset.listenerAttached = '1';
    lBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      lBtn.textContent = '⏳ Signing out…';
      lBtn.style.pointerEvents = 'none';
      try {
        await signOut(auth);
        showToast('Logged out. See you soon! 👋', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      } catch {
        showToast('Logout failed. Please try again.', 'error');
        lBtn.textContent = '🚪 Logout';
        lBtn.style.pointerEvents = '';
      }
    });
  }
}

function buildGuestNav() {
  const loginLink   = document.getElementById('loginLink');
  const signupLink  = document.getElementById('signupLink');
  const userProfile = document.getElementById('userProfile');
  const logoutLink  = document.getElementById('logoutLink');
  if (loginLink)   loginLink.style.display   = '';
  if (signupLink)  signupLink.style.display  = '';
  if (userProfile) userProfile.style.display = 'none';
  if (logoutLink)  logoutLink.style.display  = 'none';
}

// ─── Welcome banner (index.html only) ───────────────────────────────────────
function showWelcomeBanner(user) {
  const banner = document.getElementById('welcomeBanner');
  if (!banner) return;
  const nameEl = banner.querySelector('.wb-name');
  if (nameEl) nameEl.textContent = user.displayName || user.email.split('@')[0];
  banner.style.display = 'flex';
  requestAnimationFrame(() => banner.classList.add('wb-show'));
}

// ─── Main auth listener ──────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (IS_PROTECTED && !user) {
    setOverlayMessage('Please log in to continue…');
    setTimeout(() => {
      window.location.replace(`login.html?redirect=${encodeURIComponent(PAGE)}`);
    }, 700);
    return;
  }

  removeOverlay();

  if (user) {
    buildUserNav(user);
    showWelcomeBanner(user);
    if (IS_PROTECTED) {
      const name = user.displayName || user.email.split('@')[0];
      showToast(`Welcome back, ${name}! 🎌`, 'success');
    }
  } else {
    buildGuestNav();
  }
});
