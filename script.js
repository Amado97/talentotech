// ============================================================
//  SUPABASE CONFIG
// ============================================================
const SUPABASE_URL  = 'https://tcyfpjmgpidojdtrmdal.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjeWZwam1ncGlkb2pkdHJtZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzY1NTgsImV4cCI6MjA4OTU1MjU1OH0.675M8bOhdnKAViEaxVbanY-menLlZbU2KEv2Uq5JzzY';

const SCHEMA = 'talento_tech';

let db;
if (typeof supabase !== 'undefined') {
  const { createClient } = window.supabase;
  db = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: SCHEMA
    }
  });
} else {
  console.error('CRÍTICO: El SDK de Supabase no está cargado.');
}

// ============================================================
//  STATE
// ============================================================
let currentUser = null;
let currentProfile = null;
let userLikes = new Set();
const PAGE_SLUG = 'home';

// ============================================================
//  DOM REFERENCES
// ============================================================
const $ = id => document.getElementById(id);
const authModal           = $('auth-modal');
const formLogin           = $('form-login');
const formRegister        = $('form-register');
const formForgot          = $('form-forgot');
const formSuccess         = $('form-success');
const tabLoginBtn         = $('tab-login');
const tabRegisterBtn      = $('tab-register');
const loginForm           = $('login-form');
const registerForm        = $('register-form');
const forgotForm          = $('forgot-form');
const navUserInfo         = $('nav-user-info');
const navUsername         = $('nav-username');
const navAvatar           = $('nav-avatar');
const btnOpenAuth         = $('btn-open-auth');
const btnOpenAuthComments = $('btn-open-auth-comments');
const btnCloseModal       = $('btn-close-modal');
const btnLogout           = $('btn-logout');
const commentLoginPrompt  = $('comment-login-prompt');
const commentFormWrapper  = $('comment-form-wrapper');
const commentForm         = $('comment-form');
const commentInput        = $('comment-input');
const charCount           = $('char-count');
const commentsLoading     = $('comments-loading');
const commentsEmpty       = $('comments-empty');
const commentsContainer   = $('comments-container');
const toastContainer      = $('toast-container');
const formAvatar          = $('form-avatar');
const formUsernameLabel   = $('form-username');

// ============================================================
//  TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// ============================================================
//  AUTH MODAL HELPERS
// ============================================================
function openModal(tab = 'login') {
  authModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  switchTab(tab);
}
function closeModal() {
  authModal.classList.add('hidden');
  document.body.style.overflow = '';
  clearFormErrors();
}
function showForm(form) {
  [formLogin, formRegister, formForgot, formSuccess].forEach(f => f.classList.add('hidden'));
  form.classList.remove('hidden');
}
function switchTab(tab) {
  tabLoginBtn.classList.toggle('active', tab === 'login');
  tabRegisterBtn.classList.toggle('active', tab === 'register');
  showForm(tab === 'login' ? formLogin : formRegister);
}
function clearFormErrors() {
  ['login-error','register-error','forgot-error'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '';
  });
}
function setButtonLoading(btn, loading) {
  const txt = btn.querySelector('.btn-text');
  const sp  = btn.querySelector('.spinner');
  if (loading) { btn.disabled = true; if(txt) txt.textContent = 'Cargando...'; if(sp) sp.classList.remove('hidden'); }
  else          { btn.disabled = false; if(sp) sp.classList.add('hidden'); }
}

// ============================================================
//  PASSWORD STRENGTH
// ============================================================
const regPw       = $('reg-password');
const strengthFill  = $('strength-fill');
const strengthLabel = $('strength-label');
if (regPw) {
  regPw.addEventListener('input', () => {
    const pw = regPw.value;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Muy débil','Débil','Regular','Fuerte','Muy fuerte'];
    const colors = ['#ef4444','#f59e0b','#f59e0b','#10b981','#06d6a0'];
    const pct    = [15, 30, 60, 80, 100];
    strengthFill.style.width = pct[score] + '%';
    strengthFill.style.background = colors[score];
    strengthLabel.textContent = labels[score];
  });
}

// ============================================================
//  TOGGLE PASSWORD VISIBILITY
// ============================================================
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

// ============================================================
//  AUTH: REGISTRO
// ============================================================
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = $('register-error');
    errEl.textContent = '';

    const name    = $('reg-name').value.trim();
    const email   = $('reg-email').value.trim();
    const pw      = $('reg-password').value;
    const pwConf  = $('reg-password-confirm').value;

    if (!name)               return errEl.textContent = 'El nombre es requerido.';
    if (pw.length < 8)       return errEl.textContent = 'La contraseña debe tener al menos 8 caracteres.';
    if (pw !== pwConf)       return errEl.textContent = 'Las contraseñas no coinciden.';

    const btn = $('btn-register');
    const originalText = btn.querySelector('.btn-text').textContent;
    btn.querySelector('.btn-text').textContent = 'Creando cuenta...';
    setButtonLoading(btn, true);

    const { error } = await db.auth.signUp({
      email,
      password: pw,
      options: {
        data: { full_name: name, username: email.split('@')[0] },
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });

    setButtonLoading(btn, false);
    btn.querySelector('.btn-text').textContent = originalText;

    if (error) {
      errEl.textContent = translateAuthError(error.message);
    } else {
      $('success-title').textContent   = '¡Registro exitoso!';
      $('success-message').textContent = `Hemos enviado un correo de verificación a ${email}. Por favor revísalo y haz clic en el enlace para activar tu cuenta.`;
      showForm(formSuccess);
    }
  });
}

// ============================================================
//  AUTH: LOGIN
// ============================================================
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = $('login-error');
    errEl.textContent = '';

    const email = $('login-email').value.trim();
    const pw    = $('login-password').value;
    if (!email || !pw) return errEl.textContent = 'Completa todos los campos.';

    const btn = $('btn-login');
    const originalText = btn.querySelector('.btn-text').textContent;
    btn.querySelector('.btn-text').textContent = 'Ingresando...';
    setButtonLoading(btn, true);

    const { error } = await db.auth.signInWithPassword({ email, password: pw });

    setButtonLoading(btn, false);
    btn.querySelector('.btn-text').textContent = originalText;

    if (error) {
      errEl.textContent = translateAuthError(error.message);
    } else {
      closeModal();
      showToast('¡Bienvenido!', 'success');
    }
  });
}

// ============================================================
//  AUTH: CONTRASEÑA OLVIDADA
// ============================================================
if (forgotForm) {
  forgotForm.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl  = $('forgot-error');
    errEl.textContent = '';
    const email  = $('forgot-email').value.trim();
    if (!email) return errEl.textContent = 'Ingresa tu correo.';

    const btn = $('btn-forgot');
    setButtonLoading(btn, true);

    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    setButtonLoading(btn, false);

    if (error) {
      errEl.textContent = translateAuthError(error.message);
    } else {
      $('success-title').textContent   = '¡Correo enviado!';
      $('success-message').textContent = `Revisa tu bandeja de entrada en ${email}.`;
      showForm(formSuccess);
    }
  });
}

// ============================================================
//  AUTH: TRADUCCIÓN DE ERRORES
// ============================================================
function translateAuthError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed'))       return 'Debes verificar tu correo antes de iniciar sesión.';
  if (msg.includes('already registered'))        return 'Este correo ya está registrado. Intenta iniciar sesión.';
  if (msg.includes('Password should be'))        return 'La contraseña debe tener al menos 8 caracteres.';
  if (msg.includes('rate limit'))                return 'Demasiados intentos. Espera unos minutos.';
  if (msg.includes('signup_disabled'))           return 'El registro está deshabilitado temporalmente.';
  return msg;
}

// ============================================================
//  AUTH: EVENTOS DE BOTONES
// ============================================================
btnOpenAuth?.addEventListener('click',          () => openModal('login'));
btnOpenAuthComments?.addEventListener('click',  () => openModal('login'));
btnCloseModal?.addEventListener('click',        closeModal);
authModal?.addEventListener('click', e => { if (e.target === authModal) closeModal(); });
tabLoginBtn?.addEventListener('click',          () => switchTab('login'));
tabRegisterBtn?.addEventListener('click',       () => switchTab('register'));
$('btn-forgot-pw')?.addEventListener('click',  () => showForm(formForgot));
$('btn-back-login')?.addEventListener('click', () => showForm(formLogin));
$('btn-close-success')?.addEventListener('click', closeModal);

btnLogout?.addEventListener('click', async () => {
  await db.auth.signOut();
  showToast('Sesión cerrada', 'info');
});

// ============================================================
//  NAVBAR scroll effect
// ============================================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

$('hamburger')?.addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  links?.classList.toggle('show-mobile');
});

// ============================================================
//  INITIALIZATION & AUTH STATE LISTENER
// ============================================================
async function initApp() {
  console.log('Iniciando aplicación...');

  if (!db) {
    console.error('Error: El cliente de base de datos no se inicializó.');
    showToast('Error de conexión con el servidor.', 'error');
    return;
  }

  db.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth Event:', event, session?.user?.email);

    if (session?.user) {
      currentUser = session.user;
      updateNavUI(true);
      updateCommentFormUI(true);

      try {
        await loadProfile();
        updateNavUI(true);
        updateCommentFormUI(true);
        await loadUserLikes();
      } catch (e) {
        console.error('Error al cargar datos del usuario:', e);
      }

      await loadComments();
    } else {
      currentUser    = null;
      currentProfile = null;
      userLikes      = new Set();
      updateNavUI(false);
      updateCommentFormUI(false);
    }

    if (event === 'SIGNED_IN' && (window.location.hash.includes('access_token') || window.location.search.includes('code'))) {
      showToast('¡Sesión iniciada correctamente!', 'success');
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
    }
  });

  try {
    const { data: { session }, error } = await db.auth.getSession();
    if (error) throw error;
    if (session) {
      currentUser = session.user;
      updateNavUI(true);
      updateCommentFormUI(true);
    }
  } catch (e) {
    console.error('Error al obtener sesión inicial:', e);
  }

  try {
    await loadComments();
  } catch (e) {
    console.error('Error fatal en loadComments:', e);
    if (commentsLoading) commentsLoading.classList.add('hidden');
    if (commentsEmpty) commentsEmpty.classList.remove('hidden');
  }
}

initApp().catch(err => {
  console.error('Error crítico en el arranque:', err);
});

// ============================================================
//  PERFIL
// ============================================================
async function loadProfile() {
  if (!currentUser) return;
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!error && data) {
    currentProfile = data;
  } else {
    const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    const { data: newProfile } = await db
      .from('profiles')
      .upsert({
        id:         currentUser.id,
        full_name:  name,
        username:   currentUser.email.split('@')[0],
        avatar_url: null
      })
      .select()
      .single();
    currentProfile = newProfile;
  }
}

function getDisplayName() {
  if (!currentProfile) return currentUser?.email?.split('@')[0] || 'Usuario';
  return currentProfile.full_name || currentProfile.username || currentUser.email.split('@')[0];
}

function getAvatarInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ============================================================
//  UI UPDATES
// ============================================================
function updateNavUI(loggedIn) {
  if (loggedIn) {
    btnOpenAuth.classList.add('hidden');
    navUserInfo.classList.remove('hidden');
    const name = getDisplayName();
    navUsername.textContent = name;
    navAvatar.textContent   = getAvatarInitials(name);
  } else {
    btnOpenAuth.classList.remove('hidden');
    navUserInfo.classList.add('hidden');
  }
}

function updateCommentFormUI(loggedIn) {
  if (loggedIn) {
    commentLoginPrompt.classList.add('hidden');
    commentFormWrapper.classList.remove('hidden');
    const name = getDisplayName();
    formAvatar.textContent        = getAvatarInitials(name);
    formUsernameLabel.textContent = name;
  } else {
    commentLoginPrompt.classList.remove('hidden');
    commentFormWrapper.classList.add('hidden');
  }
}

// ============================================================
//  COMMENTS: CHARACTER COUNTER
// ============================================================
commentInput?.addEventListener('input', () => {
  const len = commentInput.value.length;
  charCount.textContent = len;
  charCount.style.color = len > 450 ? '#f59e0b' : '';
});

// ============================================================
//  COMMENTS: SUBMIT
// ============================================================
commentForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const content = commentInput.value.trim();
  if (!currentUser) return openModal('login');
  if (content.length < 10) return showToast('El comentario debe tener al menos 10 caracteres.', 'warning');

  const submitBtn  = $('btn-submit-comment');
  const submitText = $('submit-text');
  const submitSpin = $('submit-spinner');
  submitBtn.disabled = true;
  submitText.textContent = 'Publicando...';
  submitSpin.classList.remove('hidden');

  const { error } = await db.from('comments').insert({
    user_id:   currentUser.id,
    name:      getDisplayName(),
    content,
    page_slug: PAGE_SLUG,
  });

  submitBtn.disabled = false;
  submitText.textContent = 'Publicar comentario';
  submitSpin.classList.add('hidden');

  if (error) {
    showToast('Error al publicar. Intenta de nuevo.', 'error');
    console.error(error);
  } else {
    commentInput.value = '';
    charCount.textContent = '0';
    showToast('¡Comentario publicado!', 'success');
    await loadComments();
  }
});

// ============================================================
//  COMMENTS: LOAD
// ============================================================
async function loadComments() {
  if (!commentsLoading) return;

  commentsLoading.classList.remove('hidden');
  if (commentsEmpty) commentsEmpty.classList.add('hidden');
  if (commentsContainer) commentsContainer.classList.add('hidden');

  try {
    const { data: comments, error } = await db
      .from('comments')
      .select(`
        id,
        name,
        content,
        created_at,
        user_id,
        comment_likes(id)
      `)
      .eq('page_slug', PAGE_SLUG)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (commentsLoading) commentsLoading.classList.add('hidden');

    if (!comments || comments.length === 0) {
      if (commentsEmpty) commentsEmpty.classList.remove('hidden');
      return;
    }

    if (commentsContainer) {
      commentsContainer.innerHTML = '';
      comments.forEach((c, i) => {
        const likesData = c.comment_likes || [];
        c.likes_count = likesData.length;
        commentsContainer.appendChild(renderComment(c, i));
      });
      commentsContainer.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Error al cargar comentarios:', err);
    if (commentsLoading) commentsLoading.classList.add('hidden');
    showToast('No se pudieron cargar los comentarios.', 'error');
  }
}

// ============================================================
//  COMMENTS: RENDER
// ============================================================
function renderComment(c, i) {
  const initials  = getAvatarInitials(c.name || 'U');
  const likeCount = c.likes_count || 0;
  const isLiked   = userLikes.has(c.id);
  const isOwner   = currentUser && currentUser.id === c.user_id;
  const dateStr   = formatDate(c.created_at);

  const card = document.createElement('article');
  card.className = 'comment-card';
  card.style.animationDelay = `${i * .05}s`;
  card.setAttribute('data-comment-id', c.id);

  card.innerHTML = `
    <div class="comment-avatar">${initials}</div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(c.name)}</span>
        <time class="comment-date">${dateStr}</time>
      </div>
      <p class="comment-text">${escapeHtml(c.content)}</p>
      <div class="comment-actions">
        <button class="btn-like${isLiked ? ' liked' : ''}"
                id="like-btn-${c.id}"
                data-comment-id="${c.id}"
                aria-label="Like">
          ${isLiked ? '❤️' : '🤍'} <span class="like-count">${likeCount}</span>
        </button>
        ${isOwner ? `<button class="btn-delete-comment" data-comment-id="${c.id}" aria-label="Eliminar comentario">🗑 Eliminar</button>` : ''}
      </div>
    </div>
  `;

  card.querySelector('.btn-like')?.addEventListener('click', () => toggleLike(c.id));
  card.querySelector('.btn-delete-comment')?.addEventListener('click', () => deleteComment(c.id));

  return card;
}

// ============================================================
//  COMMENTS: LIKES
// ============================================================
async function loadUserLikes() {
  if (!currentUser) return;
  const { data } = await db
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', currentUser.id);
  userLikes = new Set((data || []).map(l => l.comment_id));
}

async function toggleLike(commentId) {
  if (!currentUser) return openModal('login');

  const btn     = document.getElementById(`like-btn-${commentId}`);
  const isLiked = userLikes.has(commentId);
  let count     = parseInt(btn?.querySelector('.like-count')?.textContent || '0');

  if (isLiked) {
    userLikes.delete(commentId);
    count--;
    btn.classList.remove('liked');
    btn.innerHTML = `🤍 <span class="like-count">${count}</span>`;
    await db.from('comment_likes').delete()
      .eq('comment_id', commentId)
      .eq('user_id', currentUser.id);
  } else {
    userLikes.add(commentId);
    count++;
    btn.classList.add('liked');
    btn.innerHTML = `❤️ <span class="like-count">${count}</span>`;
    await db.from('comment_likes').insert({
      comment_id: commentId,
      user_id:    currentUser.id
    });
  }
}

// ============================================================
//  COMMENTS: DELETE
// ============================================================
async function deleteComment(commentId) {
  if (!currentUser) return;
  if (!confirm('¿Eliminar este comentario?')) return;

  const { error } = await db
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', currentUser.id);

  if (error) {
    showToast('Error al eliminar.', 'error');
  } else {
    showToast('Comentario eliminado.', 'info');
    document.querySelector(`[data-comment-id="${commentId}"].comment-card`)?.remove();
    const remaining = commentsContainer.querySelectorAll('.comment-card');
    if (remaining.length === 0) {
      commentsContainer.classList.add('hidden');
      commentsEmpty.classList.remove('hidden');
    }
  }
}

// ============================================================
//  REAL-TIME COMMENTS
// ============================================================
const commentsChannel = db
  .channel('talento_tech:comments')
  .on('postgres_changes', {
    event:  'INSERT',
    schema: SCHEMA,
    table:  'comments',
    filter: `page_slug=eq.${PAGE_SLUG}`
  }, payload => {
    if (!currentUser || payload.new.user_id !== currentUser.id) {
      loadComments();
    }
  })
  .subscribe();

// ============================================================
//  UTILITIES
// ============================================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function formatDate(iso) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'ahora mismo';
  if (mins < 60)  return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days < 7)   return `hace ${days} días`;
  return new Date(iso).toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' });
}

// ============================================================
//  INTERSECTION OBSERVER — skill bars animation
// ============================================================
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-fill').forEach(fill => {
        fill.style.animationPlayState = 'running';
      });
    }
  });
}, { threshold: .3 });

document.querySelectorAll('.skill-category').forEach(el => {
  el.querySelectorAll('.skill-fill').forEach(f => f.style.animationPlayState = 'paused');
  skillObserver.observe(el);
});

// ============================================================
//  INSCRIPTION FORM
// ============================================================
function showSuccess() {
  const successMsg = document.getElementById('form-success-insc');
  successMsg.classList.remove('hidden');
  document.getElementById('registro-form').reset();
  setTimeout(() => {
    successMsg.classList.add('hidden');
  }, 5000);
}

// ============================================================
//  CHATBOT
// ============================================================
const chatbox = {
  knowledgeBase: {
    "inscripcion": "Para inscribirte, ve a la sección 'Formulario de Inscripción' en esta misma página, llena tus datos y selecciona tu área de interés.",
    "bootcamps": "Ofrecemos bootcamps en Programación Web Full Stack, Inteligencia Artificial, Blockchain, Análisis de Datos, Cloud Computing y Ciberseguridad.",
    "costo": "El programa Talento Tech es 100% gratuito y certificado por el MinTIC.",
    "gratis": "¡Sí! El programa es totalmente gratuito.",
    "requisitos": "Está dirigido a jóvenes y adultos colombianos con ganas de aprender habilidades digitales para el siglo XXI.",
    "modalidad": "Las capacitaciones son presenciales en la región de Talento Tech.",
    "default": "Disculpa, solo puedo responder dudas sobre el programa Talento Tech, sus bootcamps y la inscripción. ¿Puedes reformular tu pregunta?"
  }
};

function toggleChat() {
  const body = document.getElementById('chat-body');
  const icon = document.getElementById('chat-toggle-icon');
  if (body.classList.contains('hidden')) {
    body.classList.remove('hidden');
    icon.textContent = '▼';
  } else {
    body.classList.add('hidden');
    icon.textContent = '▲';
  }
}

function handleChatEnter(event) {
  if (event.key === 'Enter') sendMessage();
}

function sendMessage() {
  const inputField = document.getElementById('chat-input');
  const msg = inputField.value.trim();
  if (msg === "") return;
  addMessage(msg, 'user-msg');
  inputField.value = '';
  setTimeout(() => {
    const response = generateChatResponse(msg);
    addMessage(response, 'bot-msg');
  }, 600);
}

function addMessage(text, className) {
  const messagesContainer = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = className;
  msgDiv.textContent = text;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateChatResponse(userMsg) {
  const lowerMsg = userMsg.toLowerCase();
  if (lowerMsg.includes('inscribir') || lowerMsg.includes('registro') || lowerMsg.includes('formulario')) return chatbox.knowledgeBase["inscripcion"];
  if (lowerMsg.includes('curso') || lowerMsg.includes('bootcamp') || lowerMsg.includes('aprender')) return chatbox.knowledgeBase["bootcamps"];
  if (lowerMsg.includes('precio') || lowerMsg.includes('costo') || lowerMsg.includes('gratis')) return chatbox.knowledgeBase["costo"];
  if (lowerMsg.includes('requisito')) return chatbox.knowledgeBase["requisitos"];
  if (lowerMsg.includes('presencial') || lowerMsg.includes('modalidad')) return chatbox.knowledgeBase["modalidad"];
  if (lowerMsg.includes('ciberseguridad')) return "La ciberseguridad se enfoca en proteger sistemas, redes y datos contra ataques digitales.";
  if (lowerMsg.includes('inteligencia artificial') || lowerMsg.includes('ia')) return "El bootcamp de IA enseña a crear modelos que aprenden de datos, como chatbots y sistemas de recomendación.";
  if (lowerMsg.includes('programacion') || lowerMsg.includes('web')) return "En Programación Web aprenderás desarrollo Full Stack: HTML, CSS, JavaScript y tecnologías backend.";
  if (lowerMsg.includes('blockchain')) return "Blockchain permite registrar transacciones de forma segura y descentralizada. Aprenderás contratos inteligentes.";
  if (lowerMsg.includes('datos')) return "En Análisis de Datos aprenderás a interpretar información para apoyar decisiones empresariales.";
  if (lowerMsg.includes('cloud') || lowerMsg.includes('nube')) return "Arquitectura Cloud enseña a crear y desplegar aplicaciones en infraestructuras escalables.";
  if (lowerMsg.includes('hola') || lowerMsg.includes('saludos')) return "¡Hola! ¿En qué te puedo ayudar sobre Talento Tech?";
  return chatbox.knowledgeBase["default"];
}
