// ========== CONFIG ==========
const CORRECT_TOKEN = '43408b4793c109dbd9f3828f542d7a66';

// Fecha objetivo: Domingo 12 Julio 2026, 9am CDMX (UTC-6)
const TARGET_DATE = new Date('2026-07-12T09:00:00-06:00');

// Helper: hora actual siempre en CDMX/Tapalpa (UTC-6, sin DST)
function getNowCDMX() {
  const now = new Date();
  // Convertir a UTC-6 fijo (CDMX sin horario de verano)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs - 6 * 3600000);
}

// ========== LOGIN ==========
const loginForm = document.getElementById('loginForm');
const loginContainer = document.getElementById('loginContainer');
const cartaContainer = document.getElementById('cartaContainer');
const loginError = document.getElementById('loginError');
const tokenInput = document.getElementById('tokenInput');

// Check if already authenticated (session storage so closing tab resets)
const storedToken = sessionStorage.getItem('carta_token');
if (storedToken === CORRECT_TOKEN) {
  showCarta();
} else {
  loginContainer.classList.remove('hidden');
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const token = tokenInput.value.trim();

  if (token === CORRECT_TOKEN) {
    sessionStorage.setItem('carta_token', CORRECT_TOKEN);
    showCarta();
  } else {
    loginError.classList.add('show');
    tokenInput.value = '';
    tokenInput.focus();
    tokenInput.style.borderColor = '#e74c3c';
    setTimeout(() => { tokenInput.style.borderColor = ''; }, 1000);
  }
});

function showCarta() {
  loginContainer.classList.add('hidden');
  cartaContainer.classList.remove('hidden');
  cartaContainer.classList.add('fade-in');
  initParticles();
  loadGallery();
  startCountdown();
  initActivityUnlock();
  initSecretUpload();
}

// ========== PARTICLES (hearts) ==========
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const hearts = [];
  const HEART_COUNT = 30;

  for (let i = 0; i < HEART_COUNT; i++) {
    hearts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 16 + 8,
      speedY: -(Math.random() * 0.3 + 0.1),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.1,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hearts.forEach(h => {
      ctx.save();
      ctx.globalAlpha = h.opacity;
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.font = `${h.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💗', 0, 0);
      ctx.restore();

      h.y += h.speedY;
      h.x += h.speedX;
      h.rotation += 0.005;

      if (h.y < -50) {
        h.y = canvas.height + 50;
        h.x = Math.random() * canvas.width;
      }
      if (h.x < -50) h.x = canvas.width + 50;
      if (h.x > canvas.width + 50) h.x = -50;
    });

    animId = requestAnimationFrame(draw);
  }

  draw();

  // Cleanup on page unload (optional)
  window.addEventListener('beforeunload', () => {
    if (animId) cancelAnimationFrame(animId);
  });
}

// ========== GALLERY ==========
let _galleryLoaded = false;

function loadGallery() {
  const gallery = document.getElementById('gallery');
  const gallerySection = document.getElementById('gallerySection');
  if (!gallery) return;

  // Clear gallery first
  gallery.innerHTML = '';
  _galleryLoaded = false;

  // Try to load images from /imagenes/ directory
  // We'll attempt up to 50 images
  const maxImages = 50;
  let attempts = 0;
  let serverImages = [];

  function tryLoadImage(i) {
    const img = new Image();
    const src = `imagenes/foto-${i}.jpg`;

    img.onload = () => {
      serverImages.push({ src, order: i });
      attempts++;
      checkDone();
    };

    img.onerror = () => {
      // Try png
      const imgPng = new Image();
      const srcPng = `imagenes/foto-${i}.png`;
      imgPng.onload = () => {
        serverImages.push({ src: srcPng, order: i });
        attempts++;
        checkDone();
      };
      imgPng.onerror = () => {
        // Try webp
        const imgWebp = new Image();
        const srcWebp = `imagenes/foto-${i}.webp`;
        imgWebp.onload = () => {
          serverImages.push({ src: srcWebp, order: i });
          attempts++;
          checkDone();
        };
        imgWebp.onerror = () => {
          attempts++;
          checkDone();
        };
        imgWebp.src = srcWebp;
      };
      imgPng.src = srcPng;
    };

    img.src = src;
  }

  function checkDone() {
    if (_galleryLoaded) return;
    // All images have been attempted (either loaded or failed all formats)
    if (attempts >= maxImages) {
      _galleryLoaded = true;
      renderAllImages();
    }
  }

  // Start loading
  for (let i = 1; i <= maxImages; i++) {
    tryLoadImage(i);
  }

  // Fallback: if nothing loaded after 3s, still render
  setTimeout(() => {
    if (!_galleryLoaded) {
      _galleryLoaded = true;
      renderAllImages();
    }
  }, 3000);

  function renderAllImages() {
    // Sort server images by order
    serverImages.sort((a, b) => a.order - b.order);

    // Render server images
    serverImages.forEach(item => {
      const galleryImg = document.createElement('img');
      galleryImg.src = item.src;
      galleryImg.alt = `Momento ${item.order}`;
      galleryImg.loading = 'lazy';
      galleryImg.addEventListener('click', () => openLightbox(item.src));
      gallery.appendChild(galleryImg);
    });

    // Render uploaded (localStorage) images
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('carta_uploaded_photos') || '[]');
    } catch { saved = []; }

    saved.forEach(item => {
      const galleryImg = document.createElement('img');
      galleryImg.src = item.dataUrl;
      galleryImg.alt = item.name || 'Foto agregada';
      galleryImg.loading = 'lazy';
      galleryImg.addEventListener('click', () => openLightbox(item.dataUrl));
      gallery.appendChild(galleryImg);
    });

    // Show gallery section only if there are photos
    const totalPhotos = serverImages.length + saved.length;
    if (gallerySection) {
      if (totalPhotos > 0) {
        gallerySection.classList.remove('hidden');
      } else {
        gallerySection.classList.add('hidden');
      }
    }

    updateUploadedBadge();
  }
}

// ========== LIGHTBOX ==========
function openLightbox(src) {
  const existing = document.querySelector('.lightbox');
  if (existing) existing.remove();

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `<img src="${src}" alt="Foto">`;
  document.body.appendChild(lightbox);

  requestAnimationFrame(() => lightbox.classList.add('show'));

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('show');
    setTimeout(() => lightbox.remove(), 300);
  });
}

// ========== COUNTDOWN ==========
function startCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  function update() {
    const now = getNowCDMX();
    const diff = TARGET_DATE - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// ========== ACTIVITY UNLOCK ==========
// Desbloquea actividades 30 minutos antes de su hora (horario Tapalpa = UTC-6)
// En el HTML solo hay candados 🔒 — el texto real se inyecta al desbloquear

// Mapa de actividades por día y posición
const ACTIVITIES = {
  'day-12': [
    { time: '2026-07-12T08:00:00-06:00', label: '✅ 🚗 8am — Salida de GDL 🐾' },
    { time: '2026-07-12T09:30:00-06:00', label: '✅ 🥞 9:30am — Desayuno en Aura Restaurante (Koanze)' },
    { time: '2026-07-12T11:00:00-06:00', label: '✅ 🪨 11am — Valle de los Enigmas / Las Piedrotas 🐾' },
    { time: '2026-07-12T14:00:00-06:00', label: '✅ 🏡 2pm — Check-in Cabaña Luna del Bosque' },
    { time: '2026-07-12T17:00:00-06:00', label: '✅ 🏘️ 5pm — Centro de Tapalpa 🐾' },
    { time: '2026-07-12T19:00:00-06:00', label: '✅ 🍝 7pm — Cena: Spaghetti blanco con pollo' },
    { time: '2026-07-12T21:00:00-06:00', label: '✅ ♟️ 9pm — Ajedrez junto a la chimenea' },
    { time: '2026-07-12T21:30:00-06:00', label: '✅ 🔥 9:30pm — Fogata + estrellas' },
    { time: '2026-07-12T22:30:00-06:00', label: '✅ 😴 10:30pm — Baño y a dormir' },
  ],
  'day-13': [
    { time: '2026-07-13T08:00:00-06:00', label: '✅ 🥞 8am — Desayuno en cabaña 🐾' },
    { time: '2026-07-13T09:30:00-06:00', label: '✅ 🏔️ 9:30am — Salto del Nogal 🐾' },
    { time: '2026-07-13T13:00:00-06:00', label: '✅ 🌙 1pm — Regreso a cabaña a descansar' },
    { time: '2026-07-13T18:00:00-06:00', label: '✅ 🍳 6pm — Cocinar cena + hornear pastel 🎂' },
    { time: '2026-07-13T19:00:00-06:00', label: '✅ 🥩 7pm — Cena romántica 🍷' },
    { time: '2026-07-13T20:30:00-06:00', label: '✅ ✨ 8:30pm — Ver las estrellas' },
    { time: '2026-07-13T22:00:00-06:00', label: '✅ 💗 10pm — 💗' },
  ],
  'day-14': [
    { time: '2026-07-14T09:00:00-06:00', label: '✅ 🥞 9am — Desayuno en cabaña 🐾' },
    { time: '2026-07-14T10:00:00-06:00', label: '✅ 🧹 10am — Preparar salida' },
    { time: '2026-07-14T11:00:00-06:00', label: '✅ 🚗 11am — Check-out' },
    { time: '2026-07-14T13:30:00-06:00', label: '✅ 🏡 1:30pm — Llegada a GDL 🐾' },
    { time: '2026-07-14T15:00:00-06:00', label: '✅ 🍽️ 3pm — Comer / cenar (por definir)' },
  ],
};

function initActivityUnlock() {
  // La primera actividad (day-12, index 0) ya está desbloqueada en el HTML

  function formatTimeLeft(ms) {
    if (ms <= 0) return '🔓';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function checkUnlocks() {
    const now = getNowCDMX();

    Object.entries(ACTIVITIES).forEach(([dayId, activities]) => {
      const ul = document.getElementById(dayId);
      if (!ul) return;
      const items = ul.querySelectorAll('li');

      activities.forEach((act, idx) => {
        const li = items[idx];
        if (!li) return;

        const targetTime = new Date(act.time);
        const unlockTime = new Date(targetTime.getTime() - 30 * 60 * 1000);

        if (now >= unlockTime) {
          // Desbloquear
          if (li.classList.contains('locked')) {
            li.classList.remove('locked');
            li.classList.add('unlocked', 'unlock-anim');
            li.textContent = act.label;
            setTimeout(() => li.classList.remove('unlock-anim'), 600);
          }
        } else {
          // Mostrar cuenta regresiva
          const diff = unlockTime - now;
          const timeStr = formatTimeLeft(diff);
          if (li.classList.contains('locked')) {
            li.textContent = `🔒 ${timeStr}`;
          }
        }
      });
    });
  }

  checkUnlocks();
  setInterval(checkUnlocks, 1000);
}

// ========== SECRET UPLOAD ==========
function initSecretUpload() {
  const title = document.getElementById('galleryTitle');
  const uploadArea = document.getElementById('uploadArea');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const uploadPreview = document.getElementById('uploadPreview');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadCancel = document.getElementById('uploadCancel');

  if (!uploadArea || !title) return;

  // --- Click en el icono 📸 del título abre upload ---
  title.addEventListener('click', () => {
    uploadArea.classList.remove('hidden');
    updateUploadedBadge();
  });

  // --- File selection via click ---
  dropzone.addEventListener('click', () => fileInput.click());

  // --- Drag & drop ---
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  // --- Preview management ---
  let pendingFiles = [];

  function handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      pendingFiles.push(file);
    }
    renderPreview();
  }

  function renderPreview() {
    uploadPreview.innerHTML = '';
    if (pendingFiles.length === 0) {
      uploadBtn.disabled = true;
      return;
    }

    pendingFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <button class="remove-preview" data-idx="${idx}">×</button>
        `;
        uploadPreview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
    uploadBtn.disabled = false;
  }

  // --- Remove individual preview ---
  uploadPreview.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-preview');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    pendingFiles.splice(idx, 1);
    renderPreview();
  });

  // --- Upload (save to localStorage) ---
  uploadBtn.addEventListener('click', () => {
    if (pendingFiles.length === 0) return;

    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('carta_uploaded_photos') || '[]');
    } catch { saved = []; }

    let processed = 0;
    pendingFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        saved.push({
          id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          dataUrl: e.target.result,
          name: file.name,
          added: new Date().toISOString(),
        });
        processed++;
        if (processed === pendingFiles.length) {
          localStorage.setItem('carta_uploaded_photos', JSON.stringify(saved));
          pendingFiles = [];
          renderPreview();
          uploadArea.classList.add('hidden');
          updateUploadedBadge();
          loadGallery(); // Reload gallery to show new photos
        }
      };
      reader.readAsDataURL(file);
    });
  });

  // --- Cancel ---
  uploadCancel.addEventListener('click', () => {
    pendingFiles = [];
    renderPreview();
    uploadArea.classList.add('hidden');
  });
}

function updateUploadedBadge() {
  const title = document.getElementById('galleryTitle');
  if (!title) return;

  // Remove existing badge
  const oldBadge = title.querySelector('.uploaded-badge');
  if (oldBadge) oldBadge.remove();

  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('carta_uploaded_photos') || '[]');
  } catch { saved = []; }

  if (saved.length > 0) {
    const badge = document.createElement('span');
    badge.className = 'uploaded-badge';
    badge.textContent = `+${saved.length}`;
    title.appendChild(badge);
  }
}
