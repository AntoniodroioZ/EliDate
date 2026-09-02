/**
 * EliDate — Invitación romántica estilo Instagram
 * Vanilla JS (ES6) — sin frameworks
 */

const STORAGE_KEY = 'elidate-story-progress';

// Imágenes de historias 1–4 se asignan aleatoriamente desde Cloudinary al cargar.
// Historia 5 mantiene su imagen local (invitación / CENART).
const stories = [
  {
    id: 1,
    img: 'assets/images/placeholder-historia-1.svg',
    question: '¿Dónde comimos en nuestra primera cita?',
    options: [
      { text: 'KFC', isCorrect: true },
      { text: 'Starbucks', isCorrect: false },
      { text: 'Vips', isCorrect: false },
      { text: 'Sanborns', isCorrect: false },
    ],
    bonusMessage: 'Para comer algo de tus cosas favoritas… ¡boneless! (aunque no son boneless 😄)',
  },
  {
    id: 2,
    img: 'assets/images/placeholder-historia-2.svg',
    question: '¿Cuál fue la primera película que vimos?',
    options: [
      { text: 'Michael Jackson', isCorrect: false },
      { text: 'Kafka', isCorrect: false },
      { text: 'Arco', isCorrect: true },
      { text: 'Mario Bros', isCorrect: false },
    ],
  },
  {
    id: 3,
    img: 'assets/images/placeholder-historia-3.svg',
    question: '¿De qué color eran las primeras flores que te regalé?',
    options: [
      { text: 'Rojo', isCorrect: false },
      { text: 'Amarillo', isCorrect: true },
      { text: 'Rosa', isCorrect: false },
      { text: 'Blanco', isCorrect: false },
    ],
  },
  {
    id: 4,
    img: 'assets/images/placeholder-historia-4.svg',
    question: '¿Cuál fue el primer Lego que armamos?',
    options: [
      { text: 'Girasoles', isCorrect: false },
      { text: 'Flores de Loto', isCorrect: false },
      { text: 'Figuritas de Lego', isCorrect: true },
      { text: 'Castillo', isCorrect: false },
    ],
  },
  {
    id: 5,
    img: 'assets/images/placeholder-cenart.svg',
    type: 'invitation',
    message: '¡Felicidades, ganaste! Te espero para un picnic especial en las áreas verdes del CENART.',
  },
];

const PROFILE_IMG = 'assets/images/profile-antoniodroioz.jpg';
const STORY_USERNAME = 'antoniodroioz';

const CLOUDINARY = {
  cloudName: 'dmhrscavh',
  tag: 'fotos-eli',
};

const FEED_PROFILE = {
  username: 'antoniodroioz',
  avatar: 'assets/images/profile-antoniodroioz.jpg',
};

const FEED_POST_COUNT = 4;
const STORY_QUIZ_COUNT = 4;

const IG_ICONS = {
  heart: 'assets/images/icon-heart.svg',
  comment: 'assets/images/icon-comment.svg',
  share: 'assets/images/icon-share.svg',
};

function getFeedActionsHtml() {
  return `
    <div class="feed-post__actions">
      <button type="button" class="feed-post__action-btn" aria-label="Me gusta">
        <img src="${IG_ICONS.heart}" alt="" class="feed-post__action-icon" width="24" height="24">
      </button>
      <button type="button" class="feed-post__action-btn" aria-label="Comentar">
        <img src="${IG_ICONS.comment}" alt="" class="feed-post__action-icon" width="24" height="24">
      </button>
      <button type="button" class="feed-post__action-btn" aria-label="Compartir">
        <img src="${IG_ICONS.share}" alt="" class="feed-post__action-icon" width="24" height="24">
      </button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let state = loadState();
let currentIndex = 0;
let advanceTimeout = null;

// DOM refs
const openStoriesBtn = document.getElementById('open-stories-btn');
const closeStoriesBtn = document.getElementById('close-stories-btn');
const storyViewer = document.getElementById('story-viewer');
const storyProgress = document.getElementById('story-progress');
const storyOverlay = document.getElementById('story-overlay');
const storyImageCurrent = document.getElementById('story-image-current');
const storyImageNext = document.getElementById('story-image-next');
const tapPrev = document.getElementById('story-tap-prev');
const tapNext = document.getElementById('story-tap-next');
const confettiContainer = document.getElementById('confetti-container');
const heartsContainer = document.getElementById('hearts-container');
const itemCascadeContainer = document.getElementById('item-cascade-container');
const feedEl = document.getElementById('feed');

const CASCADE_ITEMS = [
  { src: 'assets/images/item-cajita-arcilla.svg', label: 'Cajita de figuritas' },
  { src: 'assets/images/item-ramo-flores.svg', label: 'Ramo de flores' },
  { src: 'assets/images/item-carta.svg', label: 'Carta' },
  { src: 'assets/images/item-bolsa.svg', label: 'Bolsa' },
  { src: 'assets/images/item-camara.svg', label: 'Cámara vintage' },
  { src: 'assets/images/item-album-up.svg', label: 'Álbum de fotos' },
];

// ---------------------------------------------------------------------------
// localStorage
// ---------------------------------------------------------------------------

function getDefaultState() {
  return {
    currentIndex: 0,
    answers: {},
    completedQuizzes: [],
    wrongAttempts: {},
    accepted: false,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    return { ...getDefaultState(), ...parsed };
  } catch {
    return getDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearStoredProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

function isQuizCompleted(storyId) {
  return state.completedQuizzes.includes(storyId);
}

function canAdvanceFrom(index) {
  const story = stories[index];
  if (!story) return false;
  if (story.type === 'invitation') return true;
  return isQuizCompleted(story.id);
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function buildProgressBar() {
  storyProgress.innerHTML = '';
  stories.forEach(() => {
    const segment = document.createElement('div');
    segment.className = 'progress-segment';
    const fill = document.createElement('div');
    fill.className = 'progress-segment__fill';
    segment.appendChild(fill);
    storyProgress.appendChild(segment);
  });
}

function updateProgressBar() {
  const segments = storyProgress.querySelectorAll('.progress-segment');
  segments.forEach((seg, i) => {
    seg.classList.remove('is-completed', 'is-active', 'is-paused');
    const fill = seg.querySelector('.progress-segment__fill');
    fill.style.animation = 'none';
    fill.offsetHeight;
    fill.style.animation = '';

    if (i < currentIndex) {
      seg.classList.add('is-completed');
    } else if (i === currentIndex) {
      seg.classList.add('is-active');
      const story = stories[i];
      const hasPendingQuiz = story && !story.type && !isQuizCompleted(story.id);
      if (hasPendingQuiz) {
        seg.classList.add('is-paused');
      }
    }
  });
}

function pauseProgress() {
  const active = storyProgress.querySelector('.progress-segment.is-active');
  if (active) active.classList.add('is-paused');
}

function resumeProgress() {
  const active = storyProgress.querySelector('.progress-segment.is-active');
  if (active) active.classList.remove('is-paused');
}

// ---------------------------------------------------------------------------
// Story viewer open/close
// ---------------------------------------------------------------------------

function openStoryViewer() {
  currentIndex = state.accepted ? stories.length - 1 : (state.currentIndex || 0);
  storyViewer.classList.add('is-open');
  storyViewer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('story-open');
  buildProgressBar();
  renderStory(currentIndex, false);
}

function closeStoryViewer() {
  clearTimeout(advanceTimeout);
  storyViewer.classList.remove('is-open');
  storyViewer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('story-open');
  confettiContainer.innerHTML = '';
  heartsContainer.innerHTML = '';
  stopItemCascade();
  const finalMsg = storyViewer.querySelector('.final-message');
  if (finalMsg) finalMsg.remove();
  state.currentIndex = currentIndex;
  saveState();
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function goToStory(index, animate = true) {
  if (index < 0 || index >= stories.length) {
    if (index >= stories.length) closeStoryViewer();
    return;
  }
  currentIndex = index;
  state.currentIndex = index;
  saveState();
  renderStory(index, animate);
}

function nextStory() {
  if (currentIndex >= stories.length - 1) {
    closeStoryViewer();
    return;
  }
  goToStory(currentIndex + 1);
}

function prevStory() {
  if (currentIndex > 0) goToStory(currentIndex - 1);
}

function handleTapNext() {
  if (!canAdvanceFrom(currentIndex)) return;
  nextStory();
}

// ---------------------------------------------------------------------------
// Render story
// ---------------------------------------------------------------------------

function renderStory(index, animate = true) {
  clearTimeout(advanceTimeout);
  stopItemCascade();
  const story = stories[index];
  if (!story) return;

  updateProgressBar();

  if (animate && storyImageCurrent.src) {
    storyImageNext.src = story.img;
    storyImageNext.classList.add('is-fading-in');
    storyImageCurrent.classList.add('is-fading-out');
    setTimeout(() => {
      storyImageCurrent.src = story.img;
      storyImageCurrent.classList.remove('is-fading-out');
      storyImageNext.classList.remove('is-fading-in');
    }, 200);
  } else {
    storyImageCurrent.src = story.img;
  }

  storyOverlay.innerHTML = '';
  confettiContainer.innerHTML = '';

  if (story.type === 'invitation') {
    renderInvitation(story);
  } else {
    renderQuiz(story);
  }
}

// ---------------------------------------------------------------------------
// Quiz sticker
// ---------------------------------------------------------------------------

function renderQuiz(story) {
  pauseProgress();

  const sticker = document.createElement('div');
  sticker.className = 'quiz-sticker';
  sticker.setAttribute('role', 'group');
  sticker.setAttribute('aria-label', 'Pregunta de trivia');

  const question = document.createElement('p');
  question.className = 'quiz-sticker__question';
  question.textContent = story.question;
  sticker.appendChild(question);

  const optionsWrap = document.createElement('div');
  optionsWrap.className = 'quiz-sticker__options';

  const savedAnswer = state.answers[String(story.id)];
  const alreadyCompleted = isQuizCompleted(story.id);

  story.options.forEach((option, optionIndex) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = option.text;

    if (alreadyCompleted) {
      btn.disabled = true;
      if (option.isCorrect) btn.classList.add('quiz-option--correct');
      if (savedAnswer === optionIndex && !option.isCorrect) {
        btn.classList.add('quiz-option--wrong');
      }
    }

    btn.addEventListener('click', () => handleQuizAnswer(story, optionIndex, btn, sticker, optionsWrap));
    optionsWrap.appendChild(btn);
  });

  sticker.appendChild(optionsWrap);

  if (alreadyCompleted) {
    const check = document.createElement('span');
    check.className = 'quiz-sticker__check';
    check.textContent = '✓';
    sticker.appendChild(check);
    if (story.bonusMessage) {
      showBonusMessage(sticker, story.bonusMessage);
    }
    resumeProgress();
  }

  storyOverlay.appendChild(sticker);
}

function handleQuizAnswer(story, optionIndex, btn, sticker, optionsWrap) {
  if (isQuizCompleted(story.id)) return;

  const option = story.options[optionIndex];
  const buttons = optionsWrap.querySelectorAll('.quiz-option');

  if (option.isCorrect) {
    btn.classList.add('quiz-option--correct');
    buttons.forEach((b) => { b.disabled = true; });

    state.answers[String(story.id)] = optionIndex;
    if (!state.completedQuizzes.includes(story.id)) {
      state.completedQuizzes.push(story.id);
    }
    saveState();

    const check = document.createElement('span');
    check.className = 'quiz-sticker__check';
    check.textContent = '✓';
    sticker.appendChild(check);

    if (story.bonusMessage) {
      showBonusMessage(sticker, story.bonusMessage);
    }

    launchConfetti();
    resumeProgress();

    advanceTimeout = setTimeout(() => nextStory(), 1500);
  } else {
    btn.classList.add('quiz-option--wrong');
    btn.disabled = true;

    const wrongKey = String(story.id);
    state.wrongAttempts[wrongKey] = (state.wrongAttempts[wrongKey] || 0) + 1;
    saveState();

    setTimeout(() => {
      btn.classList.remove('quiz-option--wrong');
      btn.disabled = false;
    }, 600);
  }
}

function showBonusMessage(sticker, message) {
  if (sticker.querySelector('.quiz-bonus')) return;
  const bonus = document.createElement('p');
  bonus.className = 'quiz-bonus';
  bonus.textContent = message;
  sticker.appendChild(bonus);
}

// ---------------------------------------------------------------------------
// Invitation (historia 5)
// ---------------------------------------------------------------------------

function renderInvitation(story) {
  resumeProgress();
  startItemCascade();

  const card = document.createElement('div');
  card.className = 'invitation-card';

  const message = document.createElement('p');
  message.className = 'invitation-card__message';
  message.textContent = story.message;
  card.appendChild(message);

  if (state.accepted) {
    showFinalMessage();
    card.style.opacity = '0.5';
  } else {
    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'invitation-card__btn';
    acceptBtn.textContent = '¡Acepto!';
    acceptBtn.addEventListener('click', handleAccept);
    card.appendChild(acceptBtn);
  }

  storyOverlay.appendChild(card);
}

function handleAccept() {
  state.accepted = true;
  saveState();

  launchHeartRain();
  showFinalMessage();

  const btn = storyOverlay.querySelector('.invitation-card__btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '¡Acepto! 💕';
  }
}

function showFinalMessage() {
  if (storyViewer.querySelector('.final-message')) return;

  const overlay = document.createElement('div');
  overlay.className = 'final-message';
  overlay.setAttribute('aria-live', 'polite');

  const text = document.createElement('p');
  text.className = 'final-message__text';
  text.textContent = 'Nos vemos el domingo ❤️';
  overlay.appendChild(text);

  storyViewer.appendChild(overlay);
}

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = ['#f09433', '#dc2743', '#bc1888', '#58c322', '#405de6', '#ffd700'];
  confettiContainer.innerHTML = '';

  for (let i = 0; i < 12; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.background = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 12;
    const dist = 80 + Math.random() * 120;
    piece.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
    piece.style.setProperty('--ty', `${Math.sin(angle) * dist - 60}px`);
    piece.style.setProperty('--rot', `${Math.random() * 720}deg`);
    piece.style.left = `${40 + Math.random() * 20}%`;
    piece.style.top = `${35 + Math.random() * 15}%`;
    confettiContainer.appendChild(piece);
  }

  setTimeout(() => { confettiContainer.innerHTML = ''; }, 1100);
}

function launchHeartRain() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  heartsContainer.innerHTML = '';

  for (let i = 0; i < 24; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart-float';
    heart.textContent = '♥';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.setProperty('--size', `${14 + Math.random() * 22}px`);
    heart.style.setProperty('--duration', `${2.5 + Math.random() * 2}s`);
    heart.style.animationDelay = `${Math.random() * 1.5}s`;
    heartsContainer.appendChild(heart);
  }
}

function stopItemCascade() {
  if (itemCascadeContainer) itemCascadeContainer.innerHTML = '';
}

function startItemCascade() {
  if (!itemCascadeContainer) return;
  stopItemCascade();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const columns = [8, 20, 32, 44, 56, 68, 80, 92];
  const itemsPerType = 3;
  let itemIndex = 0;

  CASCADE_ITEMS.forEach((item) => {
    for (let i = 0; i < itemsPerType; i++) {
      const el = document.createElement('div');
      el.className = 'cascade-item';

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      el.appendChild(img);

      const col = columns[itemIndex % columns.length];
      const size = 36 + Math.random() * 16;
      const duration = 9 + Math.random() * 7;
      const delay = reducedMotion ? 0 : -(Math.random() * duration);

      el.style.left = `calc(${col}% - ${size / 2}px)`;
      el.style.setProperty('--size', `${size}px`);
      el.style.setProperty('--duration', `${duration}s`);
      el.style.setProperty('--delay', `${delay}s`);

      if (reducedMotion) {
        el.style.top = `${10 + (itemIndex % 8) * 11}%`;
        el.style.animation = 'none';
      }

      itemCascadeContainer.appendChild(el);
      itemIndex += 1;
    }
  });
}

// ---------------------------------------------------------------------------
// Feed (Cloudinary)
// ---------------------------------------------------------------------------

function buildFeedPostUrl(publicId, version, format) {
  const { cloudName } = CLOUDINARY;
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_800,q_auto/v${version}/${publicId}.${format}`;
}

function buildStoryImageUrl(publicId, version, format) {
  const { cloudName } = CLOUDINARY;
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1080,h_1920,q_auto/v${version}/${publicId}.${format}`;
}

function mapCloudinaryResources(resources) {
  return resources.map((img) => {
    const { public_id: publicId, version, format } = img;
    return {
      feedUrl: buildFeedPostUrl(publicId, version, format),
      storyUrl: buildStoryImageUrl(publicId, version, format),
    };
  });
}

function pickRandomPhotos(fotos, count) {
  const shuffled = [...fotos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function assignRandomStoryImages(fotos) {
  const selected = pickRandomPhotos(fotos, STORY_QUIZ_COUNT);
  stories.forEach((story) => {
    if (story.type === 'invitation') return;
    const photo = selected[story.id - 1];
    if (photo) story.img = photo.storyUrl;
  });
}

function renderFeedSkeletonPosts(count = 2) {
  if (!feedEl) return;

  feedEl.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const article = document.createElement('article');
    article.className = 'feed-post';
    article.setAttribute('aria-hidden', 'true');
    article.innerHTML = `
      <header class="feed-post__header">
        <div class="skeleton skeleton--avatar-sm"></div>
        <div class="skeleton skeleton--username"></div>
      </header>
      <div class="skeleton skeleton--post-image"></div>
      ${getFeedActionsHtml()}
    `;
    feedEl.appendChild(article);
  }
}

function renderFeedPosts(fotos) {
  if (!feedEl) return;

  feedEl.innerHTML = '';
  fotos.forEach((foto, index) => {
    const article = document.createElement('article');
    article.className = 'feed-post';
    article.innerHTML = `
      <header class="feed-post__header">
        <img src="${FEED_PROFILE.avatar}" alt="" class="feed-post__avatar">
        <span class="feed-post__username">${FEED_PROFILE.username}</span>
      </header>
      <img src="${foto.feedUrl}" alt="Publicación ${index + 1}" class="feed-post__image" loading="lazy">
      ${getFeedActionsHtml()}
    `;
    feedEl.appendChild(article);
  });
}

async function cargarFotosCloudinary() {
  const { cloudName, tag } = CLOUDINARY;
  const listUrl = `https://res.cloudinary.com/${cloudName}/image/list/${tag}.json`;

  try {
    const response = await fetch(listUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const fotos = mapCloudinaryResources(data.resources);

    assignRandomStoryImages(fotos);
    renderFeedPosts(pickRandomPhotos(fotos, FEED_POST_COUNT));
  } catch (error) {
    console.error('Error al cargar el feed desde Cloudinary:', error);
    renderFeedSkeletonPosts(2);
  }
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

openStoriesBtn.addEventListener('click', openStoryViewer);
closeStoriesBtn.addEventListener('click', closeStoryViewer);
tapPrev.addEventListener('click', prevStory);
tapNext.addEventListener('click', handleTapNext);

document.addEventListener('keydown', (e) => {
  if (!storyViewer.classList.contains('is-open')) return;

  if (e.key === 'Escape') closeStoryViewer();
  if (e.key === 'ArrowLeft') prevStory();
  if (e.key === 'ArrowRight') handleTapNext();
});

document.querySelectorAll('.story-item__avatar, #story-viewer-avatar').forEach((img) => {
  img.src = PROFILE_IMG;
});

const usernameEl = document.getElementById('story-viewer-username');
if (usernameEl) usernameEl.textContent = STORY_USERNAME;

cargarFotosCloudinary();

// ---------------------------------------------------------------------------
// Debug: limpiar localStorage (quitar antes de entregar)
// ---------------------------------------------------------------------------

const DEBUG_STORAGE_RESET = false;

const debugClearBtn = document.getElementById('debug-clear-storage');

if (DEBUG_STORAGE_RESET && debugClearBtn) {
  debugClearBtn.addEventListener('click', () => {
    clearStoredProgress();
    location.reload();
  });
} else if (debugClearBtn) {
  debugClearBtn.hidden = true;
}
