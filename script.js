(() => {
  // ===================================================================
  // CONFIG
  //
  // Set this to your deployed Google Apps Script web-app URL once you've
  // followed the steps in google-apps-script.gs (see also README.md).
  //
  // Example: 'https://script.google.com/macros/s/AKfycb.../exec'
  //
  // While unset, submissions are stored in localStorage as a fallback so
  // the form still feels responsive during early dev.
  // ===================================================================
  const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzpJ3MeASO8Mx2i4zAKgPrweFAW_2FZ_FpTJJaWxlZvb8KlaJhLhvyZvt9v-sQTKsac/exec';

  // ===================================================================
  // 1. Marvel-intro flying-text background
  // ===================================================================
  const FLYER_WORDS = [
    'BROOKLYN', 'TONIGHT', 'TECHNO', 'HOUSE', 'HIP-HOP',
    'AFROBEATS', 'JAZZ', 'LIVE MUSIC', 'SILO', 'GOOD ROOM',
    'ELSEWHERE', 'LOT 45', 'BASEMENT', 'NIGHT', 'CLUB',
    'WAREHOUSE', 'B2B', 'ALL NIGHT', 'POPING', 'AFTERS',
    'OPEN LATE', 'FRIDAY', 'SATURDAY', 'SUNDAY',
  ];
  const COLOR_CLASSES = ['', '', '', 'accent', 'magenta', 'electric', 'uv'];

  const stage = document.getElementById('bgFlyer');
  const flyerInterval = 480; // ms between launches
  let lastLaunch = 0;
  let prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function launchWord() {
    if (prefersReduced) return;
    if (!stage) return;
    if (document.hidden) return;

    const el = document.createElement('div');
    el.className = 'flyer-word';
    const colorClass = pick(COLOR_CLASSES);
    if (colorClass) el.classList.add(colorClass);
    el.textContent = pick(FLYER_WORDS);

    // Diagonal trajectory: starts off-axis behind camera, ends on the
    // opposite side past the camera. Some go top-left → bottom-right,
    // some bottom-right → top-left, etc.
    const xStart = (Math.random() * 60 - 30) + 'vw';
    const yStart = (Math.random() * 60 - 30) + 'vh';
    const xEnd = (Math.random() * 80 - 40) + 'vw';
    const yEnd = (Math.random() * 80 - 40) + 'vh';
    const dur = 2.4 + Math.random() * 2.6; // 2.4–5s

    el.style.setProperty('--x-start', xStart);
    el.style.setProperty('--y-start', yStart);
    el.style.setProperty('--x-end', xEnd);
    el.style.setProperty('--y-end', yEnd);
    el.style.setProperty('--dur', dur + 's');

    stage.appendChild(el);

    // Cleanup once the keyframe completes
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function loop(ts) {
    if (ts - lastLaunch > flyerInterval) {
      launchWord();
      lastLaunch = ts;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Pause when tab is backgrounded — saves CPU
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastLaunch = 0;
  });

  // ===================================================================
  // 2. Email signup → Google Apps Script
  // ===================================================================
  const form = document.getElementById('signupForm');
  const input = document.getElementById('email');
  const btn = document.getElementById('submitBtn');
  const hint = document.getElementById('signupHint');
  const success = document.getElementById('signupSuccess');
  const error = document.getElementById('signupError');

  function setState(state, message) {
    if (state === 'idle') {
      hint.hidden = false;
      success.hidden = true;
      error.hidden = true;
      btn.disabled = false;
    } else if (state === 'loading') {
      hint.hidden = false;
      success.hidden = true;
      error.hidden = true;
      btn.disabled = true;
      btn.querySelector('.btn-label').textContent = 'Sending…';
    } else if (state === 'success') {
      hint.hidden = true;
      success.hidden = false;
      error.hidden = true;
      btn.disabled = false;
      btn.querySelector('.btn-label').textContent = 'Get on the list';
    } else if (state === 'error') {
      hint.hidden = true;
      success.hidden = true;
      error.hidden = false;
      if (message) error.textContent = message;
      btn.disabled = false;
      btn.querySelector('.btn-label').textContent = 'Try again';
    }
  }

  function isValidEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  async function submitToSheet(email) {
    if (!SHEETS_ENDPOINT || SHEETS_ENDPOINT.includes('YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')) {
      // Endpoint not configured yet — fall back to localStorage
      const list = JSON.parse(localStorage.getItem('poping_signups') || '[]');
      list.push({ email, ts: new Date().toISOString() });
      localStorage.setItem('poping_signups', JSON.stringify(list));
      console.warn(
        '[poping] SHEETS_ENDPOINT not configured — stored in localStorage. ' +
        'See coming-soon/google-apps-script.gs for the deploy steps.',
      );
      return { ok: true, fallback: true };
    }

    // Apps Script web apps accept POSTs with `text/plain` body to avoid
    // a CORS preflight (cross-domain fetch otherwise needs OPTIONS).
    const res = await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        email,
        source: 'coming-soon',
        ts: new Date().toISOString(),
        ua: navigator.userAgent,
        ref: document.referrer || '',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json().catch(() => ({ ok: true }));
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (input?.value || '').trim();
    if (!isValidEmail(email)) {
      setState('error', 'That email looks off — try again.');
      input?.focus();
      return;
    }
    setState('loading');
    try {
      await submitToSheet(email);
      setState('success');
      input.value = '';
    } catch (err) {
      console.error('[poping] signup error', err);
      setState('error', 'Something glitched. Try again in a sec.');
    }
  });
})();
