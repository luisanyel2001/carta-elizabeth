// ========== CONFIG ==========
const CORRECT_TOKEN = '43408b4793c109dbd9f3828f542d7a66';

// Fecha objetivo: Lunes 13 Julio 2026
const TARGET_DATE = new Date('2026-07-13T09:00:00-06:00'); // 9am hora CDMX (UTC-6)

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
function loadGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  // Try to load images from /imagenes/ directory
  // We'll attempt up to 50 images
  const maxImages = 50;
  let loadedCount = 0;
  const loadAttempts = [];

  for (let i = 1; i <= maxImages; i++) {
    const ext = 'jpg';
    const img = new Image();
    const src = `imagenes/foto-${i}.${ext}`;
    
    img.onload = () => {
      const galleryImg = document.createElement('img');
      galleryImg.src = src;
      galleryImg.alt = `Momento ${i}`;
      galleryImg.loading = 'lazy';
      galleryImg.addEventListener('click', () => openLightbox(src));
      gallery.appendChild(galleryImg);
      loadedCount++;
    };
    
    img.onerror = () => {
      // If jpg fails, try png
      const imgPng = new Image();
      const srcPng = `imagenes/foto-${i}.png`;
      imgPng.onload = () => {
        const galleryImg = document.createElement('img');
        galleryImg.src = srcPng;
        galleryImg.alt = `Momento ${i}`;
        galleryImg.loading = 'lazy';
        galleryImg.addEventListener('click', () => openLightbox(srcPng));
        gallery.appendChild(galleryImg);
        loadedCount++;
      };
      imgPng.onerror = () => {
        // Also try webp
        const imgWebp = new Image();
        const srcWebp = `imagenes/foto-${i}.webp`;
        imgWebp.onload = () => {
          const galleryImg = document.createElement('img');
          galleryImg.src = srcWebp;
          galleryImg.alt = `Momento ${i}`;
          galleryImg.loading = 'lazy';
          galleryImg.addEventListener('click', () => openLightbox(srcWebp));
          gallery.appendChild(galleryImg);
          loadedCount++;
        };
        imgWebp.onerror = () => {
          // No more images
          if (loadedCount === 0 && i === 1) {
            // Show placeholder
            showGalleryPlaceholder(gallery);
          }
        };
        imgWebp.src = srcWebp;
      };
      imgPng.src = srcPng;
    };
    
    img.src = src;
  }
}

function showGalleryPlaceholder(gallery) {
  const placeholder = document.createElement('div');
  placeholder.className = 'gallery-empty';
  placeholder.innerHTML = `
    <div class="gallery-icon">📸</div>
    <p>Sube tus fotos a la carpeta <code>/imagenes/</code></p>
    <p style="font-size:12px;margin-top:8px;color:#999">Nombres: foto-1.jpg, foto-2.jpg, etc.</p>
  `;
  gallery.appendChild(placeholder);
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
    const now = new Date();
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

// ========== SMOOTH SCROLL (optional) ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
