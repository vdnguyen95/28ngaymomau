const USERS_KEY = "momau28_users_v1";
const SESSION_KEY = "momau28_session_v1";
const VIEWS_KEY = "momau28_views_v1";
const CONTACTS_KEY = "momau28_zalo_contacts_v1";
const PROGRAM_NAME = "28 ngày giảm mỡ máu cùng dược sĩ Đạt";
const ADMIN_ZALO = "0916839623";

// =========================================================================
// BACKEND: PHP API trên hosting iNet
// Mặc định trỏ đến /api/index.php (cùng domain)
// =========================================================================
const BACKEND_URL = "/api/index.php";  // Chung domain – không cần CORS

// =========================================================================
// CẤU HÌNH GETRESPONSE
// API key được giữ trên Cloudflare Worker (server side, không lộ).
// Frontend chỉ gọi đến Worker URL bên dưới.
// =========================================================================
const GR_API_KEY = "";   // KHÔNG ĐIỀN ở đây – key đã chuyển sang Cloudflare Worker
const GR_LIST_NAME = "28_ngay_mo_mau";
const GR_CAMPAIGN_ID = "";
const GR_WEBHOOK_URL = "https://get28.vdnguyen95.workers.dev";  // Cloudflare Worker proxy
const GR_CACHE_KEY = "momau28_gr_campaign_id_v1";

// Chế độ xem trước (mở khóa toàn bộ bài học để admin/giáo viên duyệt nội dung).
// Bật bằng cách mở trang với URL ?preview=1
const PREVIEW_MODE = new URLSearchParams(window.location.search).has("preview");
// Chế độ admin (xem dashboard quản trị)
const ADMIN_MODE = new URLSearchParams(window.location.search).has("admin");

// 2 khung ảnh bắt buộc cho báo cáo
const SLOTS = [
  { key: "meal", title: "1. Hình ảnh bữa ăn", desc: "Bữa ăn lành mạnh của bạn hôm nay" },
  { key: "exercise", title: "2. Hình ảnh tập thể dục", desc: "Hoạt động thể chất bạn đã làm" },
];

let currentUser = null;

const el = {
  loginScreen: document.getElementById("loginScreen"),
  app: document.getElementById("app"),
  signinForm: document.getElementById("signinForm"),
  signinPhone: document.getElementById("signinPhone"),
  signinError: document.getElementById("signinError"),
  signupForm: document.getElementById("signupForm"),
  loginName: document.getElementById("loginName"),
  loginPhone: document.getElementById("loginPhone"),
  loginEmail: document.getElementById("loginEmail"),
  loginError: document.getElementById("loginError"),

  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  userPhone: document.getElementById("userPhone"),
  welcomeName: document.getElementById("welcomeName"),

  lessonList: document.getElementById("lessonList"),
  welcome: document.getElementById("welcome"),
  lessonView: document.getElementById("lessonView"),
  quizView: document.getElementById("quizView"),
  historyView: document.getElementById("historyView"),
  startBtn: document.getElementById("startBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  historyBtn: document.getElementById("historyBtn"),
  leaderboardBtn: document.getElementById("leaderboardBtn"),
  leaderboardView: document.getElementById("leaderboardView"),
  progressFill: document.getElementById("progressFill"),
  progressSummary: document.getElementById("progressSummary"),
};

// ---------- Store ----------
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    alert("Bộ nhớ trình duyệt đã đầy. Vui lòng đăng xuất bớt tài khoản khác hoặc xóa cache.");
    return false;
  }
}
function normalizePhone(phone) {
  return String(phone).replace(/\s|-|\./g, "").replace(/^\+84/, "0");
}
function isValidPhone(phone) {
  return /^0\d{9,10}$/.test(phone);
}
function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2;
}
function isValidEmail(email) {
  if (!email) return true; // không bắt buộc
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] || "";
  return (last[0] || "?").toUpperCase();
}
function formatDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- Auth ----------
// isNewSignup = true: đăng ký mới (sync email + show toast)
// isNewSignup = false: đăng nhập lại tài khoản đã có (không sync lại)
function login(name, phone, email, isNewSignup = false) {
  const users = loadUsers();
  let user = users[phone];
  const cleanEmail = (email || "").trim();
  if (!user) {
    user = {
      name: name.trim(),
      phone,
      email: cleanEmail,
      createdAt: Date.now(),
      currentDay: 1,
      completed: [],
      submissions: {},
      history: [],
    };
    users[phone] = user;
    isNewSignup = true; // chắc chắn là mới
  } else {
    if (name && name.trim() && user.name !== name.trim()) user.name = name.trim();
    if (cleanEmail && user.email !== cleanEmail) user.email = cleanEmail;
    if (!user.email && cleanEmail) user.email = cleanEmail;
    if (!user.submissions) user.submissions = {};
    if (!user.history) user.history = [];
  }
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, phone);
  currentUser = user;

  // Chỉ sync GetResponse + show toast khi ĐĂNG KÝ MỚI (không lặp lại mỗi lần đăng nhập)
  if (isNewSignup && cleanEmail) {
    syncToGetResponse({ name: user.name, email: cleanEmail, phone, program: PROGRAM_NAME })
      .then((ok) => {
        if (ok) showCopyToast("🎁 Quà tặng đã được gửi vào email " + cleanEmail);
      });
  }

  // Đồng bộ vào backend (luôn ghi để track activity)
  syncToBackend("register", { name: user.name, phone: user.phone, email: cleanEmail });

  showApp();
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  el.app.classList.add("hidden");
  el.loginScreen.classList.remove("hidden");
  if (el.signinForm) el.signinForm.reset();
  if (el.signupForm) el.signupForm.reset();
  if (el.signinError) el.signinError.classList.add("hidden");
  if (el.loginError) el.loginError.classList.add("hidden");
  pickDefaultTab();
}
function persistCurrent() {
  if (!currentUser) return true;
  const users = loadUsers();
  users[currentUser.phone] = currentUser;
  return saveUsers(users);
}
function restoreSession() {
  const phone = localStorage.getItem(SESSION_KEY);
  if (!phone) return false;
  const users = loadUsers();
  const user = users[phone];
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
  if (!user.submissions) user.submissions = {};
  if (!user.history) user.history = [];
  currentUser = user;
  return true;
}

// ---------- Image helpers ----------
function resizeImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Tập tin không phải là hình ảnh."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Không đọc được hình ảnh."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Lỗi đọc tập tin."));
    reader.readAsDataURL(file);
  });
}

// ---------- UI: App ----------
function showApp() {
  el.loginScreen.classList.add("hidden");
  el.app.classList.remove("hidden");

  // Tải nội dung bài học mới nhất từ backend (text + video YouTube admin chỉnh)
  fetchLessonOverrides().catch(() => {});

  el.userName.textContent = currentUser.name;
  el.userPhone.textContent = currentUser.phone;
  el.userAvatar.textContent = getInitials(currentUser.name);
  el.welcomeName.textContent = currentUser.name;

  el.lessonView.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.welcome.classList.remove("hidden");

  el.startBtn.textContent =
    currentUser.completed.length === 0
      ? "Bắt đầu ngày 1"
      : currentUser.completed.length >= 28
      ? "Xem lại bài học"
      : `Tiếp tục ngày ${currentUser.currentDay}`;

  renderSidebar();
}

function isUnlocked(day) {
  if (!currentUser) return false;
  if (PREVIEW_MODE) return true;
  if (day === 1) return true;
  return currentUser.completed.includes(day - 1);
}

function renderSidebar() {
  el.lessonList.innerHTML = "";
  LESSONS.forEach((lesson) => {
    const unlocked = isUnlocked(lesson.day);
    const completed = currentUser.completed.includes(lesson.day);

    const li = document.createElement("li");
    li.className = "lesson-item";
    if (!unlocked) li.classList.add("locked");
    if (completed) li.classList.add("completed");
    if (currentUser.currentDay === lesson.day) li.classList.add("active");

    const status = completed ? "✓" : unlocked ? lesson.day : "🔒";
    li.innerHTML = `
      <span class="lesson-status">${status}</span>
      <span class="lesson-title">Ngày ${lesson.day}: ${lesson.title}</span>
    `;

    if (unlocked) {
      li.addEventListener("click", () => openLesson(lesson.day));
    }
    el.lessonList.appendChild(li);
  });

  const done = currentUser.completed.length;
  el.progressSummary.textContent = `${done} / 28 bài`;
  el.progressFill.style.width = `${(done / 28) * 100}%`;
}

function openLesson(day) {
  if (!isUnlocked(day)) return;
  currentUser.currentDay = day;
  persistCurrent();
  const lesson = resolveLesson(day);

  el.welcome.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.lessonView.classList.remove("hidden");

  const submitted = !!currentUser.submissions[day];
  const videoHtml = youTubeEmbed(lesson.videoUrl);
  el.lessonView.innerHTML = `
    <div class="lesson-header">
      <span class="lesson-day">Ngày ${day} / 28</span>
      <h2>${lesson.title}</h2>
      <p class="lesson-subtitle">${lesson.subtitle}</p>
    </div>
    ${videoHtml}
    <div class="lesson-body">${lesson.body}</div>
    <div class="lesson-actions">
      ${submitted ? `<span style="color: var(--green-700); font-weight:600; align-self:center; margin-right:auto;">✓ Đã nộp báo cáo</span>` : ""}
      <button class="btn btn-primary" id="toSubmissionBtn">${submitted ? "Xem/Nộp lại báo cáo" : "Nộp báo cáo"}</button>
    </div>
  `;
  document.getElementById("toSubmissionBtn").addEventListener("click", () => openSubmission(day));
  renderSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Submission (upload ảnh báo cáo) ----------
// Trạng thái tạm cho ảnh đang chọn
let pendingSubmission = { day: null, meal: null, exercise: null };

function openSubmission(day) {
  el.lessonView.classList.add("hidden");
  el.welcome.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.quizView.classList.remove("hidden");

  const lesson = LESSONS[day - 1];
  const existing = currentUser.submissions[day] || {};

  pendingSubmission = {
    day,
    meal: existing.meal || null,
    exercise: existing.exercise || null,
  };

  const slotsHtml = SLOTS.map(
    (s) => `
      <div class="upload-slot" data-slot="${s.key}">
        <h3>${s.title}</h3>
        <div class="upload-desc">${s.desc}</div>
        <div class="upload-preview" id="preview-${s.key}"></div>
        <label class="upload-btn" for="file-${s.key}" id="btn-${s.key}">Chọn ảnh</label>
        <input type="file" id="file-${s.key}" accept="image/*" capture="environment" />
      </div>
    `
  ).join("");

  el.quizView.innerHTML = `
    <h2>Báo cáo ngày ${lesson.day}: ${lesson.title}</h2>
    <p class="quiz-intro">Hãy nộp đủ <strong>2 hình ảnh bắt buộc</strong> dưới đây để hoàn thành báo cáo và mở bài tiếp theo. Hình ảnh được lưu riêng cho tài khoản của bạn.</p>
    <div class="upload-grid upload-grid-2">${slotsHtml}</div>
    <div id="uploadStatus" class="upload-status warn">Bạn cần tải lên đủ 2 hình ảnh để nộp báo cáo.</div>
    <div class="submission-actions">
      <button type="button" class="btn btn-secondary" id="backToLessonBtn">Xem lại bài học</button>
      <button type="button" class="btn btn-primary" id="submitBtn" disabled>Nộp báo cáo</button>
    </div>
  `;

  document.getElementById("backToLessonBtn").addEventListener("click", () => openLesson(day));
  document.getElementById("submitBtn").addEventListener("click", () => submitImages(day));

  SLOTS.forEach((s) => {
    const input = document.getElementById(`file-${s.key}`);
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        document.getElementById(`btn-${s.key}`).textContent = "Đang xử lý...";
        const dataUrl = await resizeImage(file);
        pendingSubmission[s.key] = dataUrl;
        renderSlotPreview(s.key);
        refreshSubmitButton();
      } catch (err) {
        alert("Không tải được ảnh: " + err.message);
      } finally {
        const btn = document.getElementById(`btn-${s.key}`);
        if (btn) btn.textContent = pendingSubmission[s.key] ? "Đổi ảnh khác" : "Chọn ảnh";
      }
    });
    renderSlotPreview(s.key);
  });
  refreshSubmitButton();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderSlotPreview(key) {
  const preview = document.getElementById(`preview-${key}`);
  const slotEl = document.querySelector(`.upload-slot[data-slot="${key}"]`);
  const btn = document.getElementById(`btn-${key}`);
  const src = pendingSubmission[key];
  if (src) {
    preview.innerHTML = `
      <img src="${src}" alt="${key}" />
      <button type="button" class="upload-remove" title="Xóa ảnh này">×</button>
    `;
    slotEl.classList.add("filled");
    btn.textContent = "Đổi ảnh khác";
    preview.querySelector(".upload-remove").addEventListener("click", () => {
      pendingSubmission[key] = null;
      document.getElementById(`file-${key}`).value = "";
      renderSlotPreview(key);
      refreshSubmitButton();
    });
  } else {
    preview.innerHTML = `<div class="upload-icon">📷</div>`;
    slotEl.classList.remove("filled");
    btn.textContent = "Chọn ảnh";
  }
}

function refreshSubmitButton() {
  const allDone = SLOTS.every((s) => !!pendingSubmission[s.key]);
  const btn = document.getElementById("submitBtn");
  const status = document.getElementById("uploadStatus");
  if (!btn || !status) return;
  btn.disabled = !allDone;
  const filledCount = SLOTS.filter((s) => !!pendingSubmission[s.key]).length;
  const total = SLOTS.length;
  if (allDone) {
    status.className = "upload-status ok";
    status.textContent = `Đã đủ ${total} ảnh. Bạn có thể nộp báo cáo!`;
  } else {
    status.className = "upload-status warn";
    status.textContent = `Đã tải ${filledCount}/${total} ảnh. Vui lòng bổ sung các ảnh còn thiếu.`;
  }
}

function submitImages(day) {
  const allDone = SLOTS.every((s) => !!pendingSubmission[s.key]);
  if (!allDone) return;

  const submission = {
    at: Date.now(),
    meal: pendingSubmission.meal,
    exercise: pendingSubmission.exercise,
  };
  currentUser.submissions[day] = submission;
  if (!currentUser.completed.includes(day)) currentUser.completed.push(day);
  if (day < 28) currentUser.currentDay = day + 1;

  currentUser.history.push({
    day,
    title: LESSONS[day - 1].title,
    at: submission.at,
    images: SLOTS.length,
  });

  const ok = persistCurrent();
  if (!ok) return;

  // Đồng bộ báo cáo (kèm ảnh) lên backend
  syncToBackend("submission", {
    phone: currentUser.phone,
    name: currentUser.name,
    day,
    title: LESSONS[day - 1].title,
    mealImage: submission.meal,
    exerciseImage: submission.exercise,
  });

  renderSidebar();

  const resultHtml = `
    <div class="quiz-result pass">
      <div>🎉 Chúc mừng, bạn đã nộp báo cáo ngày ${day}!</div>
      <div style="margin: 10px 0 16px;">${SLOTS.length} hình ảnh đã được lưu vào lịch sử học tập của bạn.</div>
      <div class="submission-gallery submission-gallery-2">
        <div>
          <img src="${submission.meal}" alt="Bữa ăn" data-zoom />
          <div class="gallery-label">Bữa ăn</div>
        </div>
        <div>
          <img src="${submission.exercise}" alt="Tập thể dục" data-zoom />
          <div class="gallery-label">Tập thể dục</div>
        </div>
      </div>
      <div style="margin-top:18px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        ${day < 28 ? `<button class="btn btn-primary" id="nextLessonBtn">Học ngày ${day + 1}</button>` : ""}
        <button class="btn btn-secondary" id="viewHistoryBtn">Xem lịch sử</button>
        <button class="btn btn-secondary" id="reviewLessonBtn">Xem lại bài</button>
      </div>
    </div>
  `;
  el.quizView.innerHTML = resultHtml;

  const nextBtn = document.getElementById("nextLessonBtn");
  if (nextBtn) nextBtn.addEventListener("click", () => openLesson(day + 1));
  document.getElementById("viewHistoryBtn").addEventListener("click", openHistory);
  document.getElementById("reviewLessonBtn").addEventListener("click", () => openLesson(day));
  attachLightbox(el.quizView);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Lightbox xem ảnh ----------
function attachLightbox(scope) {
  scope.querySelectorAll("img[data-zoom]").forEach((img) => {
    img.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "lightbox";
      overlay.innerHTML = `<img src="${img.src}" alt="" />`;
      overlay.addEventListener("click", () => overlay.remove());
      document.body.appendChild(overlay);
    });
  });
}

// ---------- Lịch sử ----------
function openHistory() {
  el.lessonView.classList.add("hidden");
  el.welcome.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.remove("hidden");

  const submittedDays = Object.keys(currentUser.submissions)
    .map((d) => parseInt(d, 10))
    .sort((a, b) => b - a);

  const totalSubmissions = submittedDays.length;
  const completedCount = currentUser.completed.length;

  const rows = submittedDays
    .map((day) => {
      const sub = currentUser.submissions[day];
      const lesson = LESSONS[day - 1];
      return `
        <div class="quiz-question" data-day="${day}">
          <div class="quiz-question-text">Ngày ${day}: ${lesson.title} · <span style="font-weight:400; color: var(--gray-600); font-size: 13px;">${formatDate(sub.at)}</span></div>
          <div class="submission-gallery submission-gallery-2">
            <div>
              <img src="${sub.meal}" alt="Bữa ăn" data-zoom />
              <div class="gallery-label">Bữa ăn</div>
            </div>
            <div>
              <img src="${sub.exercise}" alt="Tập thể dục" data-zoom />
              <div class="gallery-label">Tập thể dục</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const rowsHtml = submittedDays.length
    ? rows
    : `<div class="history-empty">Bạn chưa có bài tập nào được nộp. Hãy bắt đầu bài học đầu tiên!</div>`;

  el.historyView.innerHTML = `
    <div class="lesson-header">
      <span class="lesson-day">Tài khoản: ${currentUser.phone}</span>
      <h2>Lịch sử học tập của ${currentUser.name}</h2>
      <p class="lesson-subtitle">Đăng ký lúc ${formatDate(currentUser.createdAt)}</p>
    </div>
    <div class="history-stats">
      <div class="stat-card">
        <div class="stat-value">${completedCount} / 28</div>
        <div class="stat-label">Bài đã hoàn thành</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalSubmissions}</div>
        <div class="stat-label">Báo cáo đã nộp</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalSubmissions * SLOTS.length}</div>
        <div class="stat-label">Ảnh đã tải lên</div>
      </div>
    </div>
    <h3 style="color: var(--green-700); margin-top: 18px;">Chi tiết các báo cáo đã nộp</h3>
    ${rowsHtml}
    <div class="lesson-actions">
      <button class="btn btn-primary" id="backFromHistory">Quay lại học</button>
    </div>
  `;
  attachLightbox(el.historyView);
  document.getElementById("backFromHistory").addEventListener("click", () => {
    el.historyView.classList.add("hidden");
    const day = currentUser.currentDay || 1;
    if (isUnlocked(day)) openLesson(day);
    else el.welcome.classList.remove("hidden");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Bảng xếp hạng ----------
const SIM_USERS_KEY = "momau28_sim_users_v1";

function makeSimulatedUsers() {
  // Tạo 12 học viên ảo có tên/thành phố Việt Nam, tiến độ đa dạng
  const cached = localStorage.getItem(SIM_USERS_KEY);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data && Array.isArray(data.users) && data.users.length) {
        // Cập nhật tự nhiên: cứ ~24h thì 30% học viên ảo tiến thêm 1 ngày
        const lastUpdated = data.lastUpdated || 0;
        const elapsed = Date.now() - lastUpdated;
        if (elapsed > 24 * 3600 * 1000) {
          data.users.forEach((u) => {
            if (u.completed < 28 && Math.random() < 0.3) {
              u.completed = Math.min(28, u.completed + 1);
              u.currentDay = Math.min(28, u.completed + 1);
              u.lastActivity = Date.now();
            }
          });
          data.lastUpdated = Date.now();
          localStorage.setItem(SIM_USERS_KEY, JSON.stringify(data));
        }
        return data.users;
      }
    } catch (e) {}
  }
  // Lần đầu: tạo 12 học viên ảo
  const users = [];
  const used = new Set();
  for (let i = 0; i < 12; i++) {
    let name;
    do {
      const last = NOTIF_HOLO_NAMES[0][Math.floor(Math.random() * NOTIF_HOLO_NAMES[0].length)];
      const mid  = NOTIF_HOLO_NAMES[1][Math.floor(Math.random() * NOTIF_HOLO_NAMES[1].length)];
      const first = NOTIF_HOLO_NAMES[2][Math.floor(Math.random() * NOTIF_HOLO_NAMES[2].length)];
      name = `${last} ${mid} ${first}`;
    } while (used.has(name));
    used.add(name);

    const completed = 3 + Math.floor(Math.random() * 25); // 3-27 ngày
    users.push({
      id: "sim_" + i,
      name,
      city: NOTIF_CITIES[Math.floor(Math.random() * NOTIF_CITIES.length)],
      phoneSuffix: String(100 + Math.floor(Math.random() * 900)),
      completed,
      currentDay: Math.min(28, completed + 1),
      joinedDaysAgo: 5 + Math.floor(Math.random() * 25),
      lastActivity: Date.now() - Math.floor(Math.random() * 24 * 3600 * 1000),
      isSimulated: true,
    });
  }
  localStorage.setItem(SIM_USERS_KEY, JSON.stringify({ users, lastUpdated: Date.now() }));
  return users;
}

function maskName(name) {
  // "Nguyễn Văn An" → "Nguyễn V. A***"
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${parts[1][0]}.`;
  return `${parts[0]} ${parts[1][0]}. ${parts[2]}`;
}

function getInitial(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1][0] || "?").toUpperCase();
}

function buildLeaderboardData() {
  // Học viên thật trên thiết bị này
  const realUsers = Object.values(loadUsers()).map((u) => ({
    id: "real_" + u.phone,
    name: u.name,
    city: "Học viên",
    phoneSuffix: u.phone.slice(-3),
    completed: (u.completed || []).length,
    currentDay: u.currentDay || 1,
    isMe: currentUser && u.phone === currentUser.phone,
    isSimulated: false,
  }));
  const simUsers = makeSimulatedUsers();
  // Gộp lại + sort theo số bài hoàn thành giảm dần, trùng thì sort theo currentDay
  const all = [...realUsers, ...simUsers]
    .filter((u) => u.id !== "real_preview") // bỏ tài khoản preview
    .sort((a, b) => {
      if (b.completed !== a.completed) return b.completed - a.completed;
      return (b.currentDay || 0) - (a.currentDay || 0);
    });
  return all;
}

function openLeaderboard() {
  el.lessonView.classList.add("hidden");
  el.welcome.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.leaderboardView.classList.remove("hidden");

  const all = buildLeaderboardData();
  const top3 = all.slice(0, 3);
  const rest = all.slice(3, 30);

  // Tìm thứ hạng của user hiện tại
  const myRank = all.findIndex((u) => u.isMe) + 1;
  const me = currentUser ? all.find((u) => u.isMe) : null;

  const podiumHtml = `
    <div class="leaderboard-podium">
      ${top3[1] ? podiumCard(top3[1], "silver", "🥈", 2) : "<div></div>"}
      ${top3[0] ? podiumCard(top3[0], "gold",   "🥇", 1) : "<div></div>"}
      ${top3[2] ? podiumCard(top3[2], "bronze", "🥉", 3) : "<div></div>"}
    </div>
  `;

  const tableRows = rest.map((u, i) => {
    const rank = i + 4;
    const pct = Math.round((u.completed / 28) * 100);
    return `
      <tr class="${u.isMe ? "me" : ""}">
        <td class="rank">${rank}</td>
        <td>
          <span class="lb-avatar">${getInitial(u.name)}</span>
          ${u.isMe ? "<strong>" + u.name + " (Bạn)</strong>" : maskName(u.name)}
        </td>
        <td>${u.city}</td>
        <td>
          <span class="lb-progress"><span style="width:${pct}%"></span></span>
          <span class="pct">${u.completed}/28</span>
        </td>
        <td>Ngày ${u.currentDay}</td>
      </tr>
    `;
  }).join("");

  const myBanner = me
    ? `<div class="leaderboard-mine-banner">
        🏅 Bạn đang ở <strong>vị trí #${myRank}</strong> với <strong>${me.completed}/28 bài</strong>.
        ${me.completed < 28 ? "Cố lên! Vượt qua thêm vài học viên nữa nhé." : "Tuyệt vời, bạn đã hoàn thành chương trình!"}
      </div>`
    : "";

  el.leaderboardView.innerHTML = `
    <div class="lesson-header">
      <span class="lesson-day">🏆 Bảng xếp hạng</span>
      <h2>Top học viên 28 ngày giảm mỡ máu</h2>
      <p class="lesson-subtitle">Xem ai đang dẫn đầu và thi đua cùng họ nhé!</p>
    </div>
    ${myBanner}
    ${podiumHtml}
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th class="rank">#</th>
          <th>Học viên</th>
          <th>Địa điểm</th>
          <th>Tiến độ</th>
          <th>Đang học</th>
        </tr>
      </thead>
      <tbody>${tableRows || `<tr><td colspan="5" style="text-align:center; color:var(--gray-400); padding: 20px;">Chưa có dữ liệu</td></tr>`}</tbody>
    </table>
    <div class="lesson-actions">
      <button class="btn btn-primary" id="backFromLeaderboard">Quay lại học</button>
    </div>
  `;
  document.getElementById("backFromLeaderboard").addEventListener("click", () => {
    el.leaderboardView.classList.add("hidden");
    const day = currentUser.currentDay || 1;
    if (isUnlocked(day)) openLesson(day);
    else el.welcome.classList.remove("hidden");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function podiumCard(u, kind, medal, rank) {
  return `
    <div class="podium ${kind} ${u.isMe ? "is-me" : ""}">
      <span class="medal">${medal}</span>
      <div class="podium-name">${u.isMe ? u.name + " (Bạn)" : maskName(u.name)}</div>
      <div class="podium-city">${u.city}</div>
      <div class="podium-score">${u.completed}/28</div>
      <div class="podium-score-label">bài hoàn thành</div>
    </div>
  `;
}

// ---------- Event binding ----------

// Tab switching
function switchLoginTab(tab) {
  document.querySelectorAll(".login-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  el.signinForm.classList.toggle("hidden", tab !== "signin");
  el.signupForm.classList.toggle("hidden", tab !== "signup");
  el.signinError.classList.add("hidden");
  el.loginError.classList.add("hidden");
}
document.querySelectorAll(".login-tab").forEach((t) => {
  t.addEventListener("click", () => switchLoginTab(t.dataset.tab));
});
const _goSignup = document.getElementById("goToSignup");
if (_goSignup) _goSignup.addEventListener("click", (e) => { e.preventDefault(); switchLoginTab("signup"); });
const _goSignin = document.getElementById("goToSignin");
if (_goSignin) _goSignin.addEventListener("click", (e) => { e.preventDefault(); switchLoginTab("signin"); });

// Mặc định: đã có tài khoản trên thiết bị → mở Đăng nhập; còn không → mở Đăng ký
function pickDefaultTab() {
  const users = loadUsers();
  switchLoginTab(Object.keys(users).length > 0 ? "signin" : "signup");
}

// Form: Đăng nhập (chỉ SĐT)
el.signinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const phone = normalizePhone(el.signinPhone.value);
  if (!isValidPhone(phone)) {
    showSigninError("Số điện thoại không hợp lệ. Ví dụ: 0912345678");
    return;
  }
  const users = loadUsers();
  const user = users[phone];
  if (!user) {
    showSigninError("Chưa có tài khoản với số này. Hãy chuyển sang tab Đăng ký.");
    return;
  }
  el.signinError.classList.add("hidden");
  // Dùng dữ liệu đã lưu — không spam mail GetResponse
  login(user.name, phone, user.email || "", false);
});

// Form: Đăng ký (đầy đủ thông tin)
el.signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = el.loginName.value.trim();
  const phone = normalizePhone(el.loginPhone.value);
  const email = el.loginEmail.value.trim();
  if (!isValidName(name)) {
    showLoginError("Họ tên phải có ít nhất 2 ký tự.");
    return;
  }
  if (!isValidPhone(phone)) {
    showLoginError("Số điện thoại không hợp lệ. Ví dụ: 0912345678");
    return;
  }
  if (!isValidEmail(email)) {
    showLoginError("Email không hợp lệ. Bạn có thể bỏ trống nếu không muốn cung cấp.");
    return;
  }
  const users = loadUsers();
  if (users[phone]) {
    showLoginError("Số điện thoại này đã có tài khoản. Hãy chuyển sang tab Đăng nhập.");
    return;
  }
  el.loginError.classList.add("hidden");
  // Đăng ký mới: sync GR + show toast quà tặng
  login(name, phone, email, true);
});

function showSigninError(msg) {
  el.signinError.textContent = msg;
  el.signinError.classList.remove("hidden");
}


// ---------- Đồng bộ GetResponse ----------
async function fetchCampaignIdByName(name) {
  // Lấy từ cache nếu đã từng tra cứu thành công
  const cached = localStorage.getItem(GR_CACHE_KEY);
  if (cached) return cached;
  try {
    const url = "https://api.getresponse.com/v3/campaigns?" +
      new URLSearchParams({ "query[name]": name });
    const res = await fetch(url, {
      headers: { "X-Auth-Token": `api-key ${GR_API_KEY}` },
    });
    if (!res.ok) {
      console.warn("[GR] Không tra được campaign:", res.status, await res.text());
      return null;
    }
    const list = await res.json();
    if (!list.length) {
      console.warn(`[GR] Không tìm thấy danh sách "${name}"`);
      return null;
    }
    const id = list[0].campaignId;
    localStorage.setItem(GR_CACHE_KEY, id);
    return id;
  } catch (e) {
    console.warn("[GR] Lỗi tra cứu campaign:", e);
    return null;
  }
}

async function syncToGetResponse(data) {
  // Phương án 1 (an toàn): qua webhook proxy
  if (GR_WEBHOOK_URL) {
    try {
      const res = await fetch(GR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) console.warn("[GR webhook]", res.status, await res.text());
      else console.log("[GR webhook] OK");
    } catch (e) {
      console.warn("[GR webhook] error", e);
    }
    return true;
  }

  // Phương án 2: gọi thẳng API (lộ API key – chấp nhận trade-off)
  if (!GR_API_KEY) {
    console.info("[GR] chưa cấu hình API key – bỏ qua.");
    return false;
  }

  const campaignId = GR_CAMPAIGN_ID || (await fetchCampaignIdByName(GR_LIST_NAME));
  if (!campaignId) return false;

  try {
    const res = await fetch("https://api.getresponse.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": `api-key ${GR_API_KEY}`,
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        campaign: { campaignId },
        // Nếu sau này bạn tạo custom field "phone" trong GetResponse, bật bên dưới:
        // customFieldValues: [{ customFieldId: "<id>", value: [data.phone] }],
      }),
    });
    if (res.ok || res.status === 202) {
      console.log("[GR] Đã thêm contact:", data.email);
      return true;
    }
    const errBody = await res.text();
    // 409 = email đã có trong list → coi như thành công
    if (res.status === 409) {
      console.log("[GR] Contact đã tồn tại:", data.email);
      return true;
    }
    console.warn("[GR API]", res.status, errBody);
    return false;
  } catch (e) {
    // CORS bị chặn ở một số trình duyệt → log để bạn biết, không phá UX
    console.warn("[GR API] Lỗi mạng/CORS:", e);
    return false;
  }
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  // Fallback: dùng textarea
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function showCopyToast(text) {
  const t = document.createElement("div");
  t.className = "copy-toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2100);
}


function showLoginError(msg) {
  el.loginError.textContent = msg;
  el.loginError.classList.remove("hidden");
}

el.logoutBtn.addEventListener("click", logout);
el.historyBtn.addEventListener("click", openHistory);
el.leaderboardBtn.addEventListener("click", openLeaderboard);
el.startBtn.addEventListener("click", () => openLesson(currentUser.currentDay || 1));

// ---------- Social proof notifications ----------
const NOTIF_HOLO_NAMES = [
  ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Trương", "Đinh"],
  ["Văn", "Thị", "Hữu", "Quang", "Thanh", "Minh", "Đức", "Quốc", "Anh", "Ngọc"],
  ["An", "Bình", "Dũng", "Hà", "Hải", "Hạnh", "Hiếu", "Hoa", "Hương", "Khánh", "Lan", "Linh", "Long", "Mai", "Nam", "Nga", "Nhàn", "Phúc", "Quỳnh", "Sơn", "Thảo", "Thu", "Trang", "Tú", "Tuấn", "Vân", "Việt", "Yến", "Hồng", "Loan"]
];
const NOTIF_CITIES = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Biên Hòa", "Huế", "Nha Trang", "Vũng Tàu", "Quy Nhơn", "Vinh", "Thanh Hóa", "Nam Định", "Bắc Giang", "Thái Bình", "Đắk Lắk", "Bình Dương"];
let notifTimerId = null;
let notifCurrentEl = null;

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomName() {
  const last = randFrom(NOTIF_HOLO_NAMES[0]);
  const mid = randFrom(NOTIF_HOLO_NAMES[1]);
  const first = randFrom(NOTIF_HOLO_NAMES[2]);
  return `${last} ${mid} ${first}`;
}
function maskPhone() {
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `09*****${suffix}`;
}
function minsAgoLabel() {
  const n = Math.floor(Math.random() * 9) + 1;
  return `${n} phút trước`;
}

function buildNotification() {
  const name = randomName();
  const city = randFrom(NOTIF_CITIES);
  const day = Math.floor(Math.random() * 28) + 1;
  const lesson = LESSONS[day - 1];
  const initials = name.split(" ").pop()[0];

  const types = [
    {
      weight: 3,
      kind: "login",
      icon: "🎓",
      title: `<span class="n-name">${name}</span> vừa đăng nhập học chương trình`,
    },
    {
      weight: 4,
      kind: "submit",
      icon: "📸",
      title: `<span class="n-name">${name}</span> vừa nộp bài tập ngày ${day}`,
    },
    {
      weight: 4,
      kind: "complete",
      icon: "✅",
      title: `<span class="n-name">${name}</span> đã hoàn thành bài ${day}: ${lesson.title}`,
    },
    {
      weight: 1,
      kind: "milestone",
      icon: "🏆",
      title: `<span class="n-name">${name}</span> đã hoàn thành trọn 28 ngày!`,
    },
  ];
  const pool = [];
  types.forEach((t) => { for (let i = 0; i < t.weight; i++) pool.push(t); });
  const t = randFrom(pool);

  return {
    kind: t.kind,
    icon: t.icon,
    initials,
    title: t.title,
    city,
    time: minsAgoLabel(),
  };
}

function showNotification(n) {
  // Xóa thông báo cũ nếu còn
  if (notifCurrentEl && notifCurrentEl.parentNode) {
    notifCurrentEl.classList.remove("show");
    const oldEl = notifCurrentEl;
    setTimeout(() => oldEl.remove(), 400);
  }

  const node = document.createElement("div");
  node.className = "notification";
  node.innerHTML = `
    <div class="notification-avatar ${n.kind}">${n.icon}</div>
    <div class="notification-body">
      <div class="notification-title">${n.title}</div>
      <div class="notification-meta">
        <span class="n-dot"></span>
        <span>${n.city}</span>
        <span>·</span>
        <span>${n.time}</span>
      </div>
    </div>
    <button class="notification-close" aria-label="Đóng">×</button>
  `;
  document.body.appendChild(node);
  notifCurrentEl = node;

  requestAnimationFrame(() => node.classList.add("show"));

  const close = () => {
    node.classList.remove("show");
    setTimeout(() => { if (node.parentNode) node.remove(); }, 400);
  };
  node.querySelector(".notification-close").addEventListener("click", close);
  setTimeout(close, 6000);
}

function scheduleNextNotification() {
  const delay = 12000 + Math.random() * 18000; // 12 – 30 giây
  notifTimerId = setTimeout(() => {
    if (currentUser) {
      showNotification(buildNotification());
      scheduleNextNotification();
    }
  }, delay);
}

function startSocialProof() {
  stopSocialProof();
  // Thông báo đầu tiên sau 5 giây đăng nhập
  notifTimerId = setTimeout(() => {
    if (currentUser) {
      showNotification(buildNotification());
      scheduleNextNotification();
    }
  }, 5000);
}
function stopSocialProof() {
  if (notifTimerId) {
    clearTimeout(notifTimerId);
    notifTimerId = null;
  }
  if (notifCurrentEl && notifCurrentEl.parentNode) notifCurrentEl.remove();
  notifCurrentEl = null;
}

// Gắn vào vòng đời showApp/logout
const _origShowApp = showApp;
showApp = function () {
  _origShowApp();
  startSocialProof();
};
const _origLogout = logout;
logout = function () {
  stopSocialProof();
  _origLogout();
};
el.logoutBtn.removeEventListener("click", _origLogout);
el.logoutBtn.addEventListener("click", logout);

// ---------- Preview banner ----------
function showPreviewBanner() {
  if (!PREVIEW_MODE) return;
  if (document.getElementById("previewBanner")) return;
  const b = document.createElement("div");
  b.id = "previewBanner";
  b.className = "preview-banner";
  b.innerHTML = `
    <span>🔓 Đang ở <strong>chế độ xem trước</strong> – tất cả 28 bài đã được mở khóa để bạn duyệt nội dung.</span>
    <a href="${window.location.pathname}" class="preview-exit">Thoát chế độ xem trước</a>
  `;
  document.body.prepend(b);
}

// ---------- Analytics tracking ----------
function trackPageView() {
  // Đếm 1 lần / 1 phiên (sessionStorage giữ trong tab) để tránh tăng đếm khi reload nhiều lần
  if (sessionStorage.getItem("mm_view_counted")) return;
  sessionStorage.setItem("mm_view_counted", "1");
  const v = parseInt(localStorage.getItem(VIEWS_KEY) || "0", 10);
  localStorage.setItem(VIEWS_KEY, String(v + 1));
  // Đồng bộ backend
  syncToBackend("view", {});
}

// ---------- Backend sync (PHP API trên hosting iNet) ----------
async function syncToBackend(action, data) {
  if (!BACKEND_URL) return;
  try {
    await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    });
  } catch (e) {
    console.warn("[backend]", action, e);
  }
}

// Tải lesson override từ DB (text + video YouTube admin chỉnh sau này)
let LESSON_OVERRIDES = {};
async function fetchLessonOverrides() {
  try {
    const r = await fetch(`${BACKEND_URL}?action=lessons`);
    const j = await r.json();
    if (j && j.ok && Array.isArray(j.lessons)) {
      j.lessons.forEach((l) => { LESSON_OVERRIDES[l.day] = l; });
    }
  } catch (e) {
    console.warn("[fetchLessonOverrides]", e);
  }
}

// Trả về object lesson đã merge override
function resolveLesson(day) {
  const base = LESSONS[day - 1];
  const ov = LESSON_OVERRIDES[day];
  if (!ov) return base;
  return {
    ...base,
    title:    (ov.title    && ov.title.trim())    ? ov.title    : base.title,
    subtitle: (ov.subtitle && ov.subtitle.trim()) ? ov.subtitle : base.subtitle,
    body:     (ov.body     && ov.body.trim())     ? ov.body     : base.body,
    videoUrl: ov.video_url || "",
  };
}

function youTubeEmbed(url) {
  if (!url) return "";
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\/\s]+)/);
  if (!m) return "";
  return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${m[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
}

function loadContacts() {
  try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]"); }
  catch (e) { return []; }
}
function saveContacts(arr) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(arr));
}
function trackZaloContact(source) {
  const list = loadContacts();
  list.push({
    at: Date.now(),
    source,                                 // "register" | "consult"
    name: currentUser ? currentUser.name : null,
    phone: currentUser ? currentUser.phone : null,
  });
  saveContacts(list);
  // Đồng bộ event lên backend
  syncToBackend("event", {
    type: "zalo_contact",
    name: currentUser ? currentUser.name : "",
    phone: currentUser ? currentUser.phone : "",
    detail: source,
  });
}

// Gắn tracking cho nút Zalo nổi
const zaloFab = document.getElementById("zaloFab");
if (zaloFab) {
  zaloFab.addEventListener("click", () => trackZaloContact("consult"));
}

// ---------- ADMIN PASSWORD ----------
const ADMIN_SESSION_KEY = "mm_admin_pwd_v1";

function getAdminPassword() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
}
function setAdminPassword(pwd) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, pwd);
}
function clearAdminPassword() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

async function promptAdminPassword() {
  const pwd = prompt("Nhập mật khẩu quản trị:");
  if (!pwd) return null;
  // Verify ngay bằng cách gọi API admin
  try {
    const r = await fetch(`${BACKEND_URL}?action=admin&password=${encodeURIComponent(pwd)}`);
    const j = await r.json();
    if (j.ok) {
      setAdminPassword(pwd);
      return pwd;
    } else {
      alert(j.error || "Sai mật khẩu");
      return null;
    }
  } catch (e) {
    alert("Không kết nối được tới backend. Hãy đảm bảo /api/index.php đã được deploy.");
    return null;
  }
}

// ---------- ADMIN DASHBOARD ----------

async function renderAdmin() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.add("hidden");
  const adminEl = document.getElementById("adminScreen");
  adminEl.classList.remove("hidden");
  if (zaloFab) zaloFab.style.display = "none";

  // Yêu cầu mật khẩu nếu chưa có
  let pwd = getAdminPassword();
  if (!pwd) {
    pwd = await promptAdminPassword();
    if (!pwd) {
      window.location.href = "?";
      return;
    }
  }

  // Đọc dữ liệu từ backend
  let allUsers = [], views = 0, contacts = [], submissionsRaw = [], fromBackend = false;
  document.getElementById("adminStats").innerHTML = `<div class="admin-stat"><div class="label">Đang tải dữ liệu...</div></div>`;
  try {
    const r = await fetch(`${BACKEND_URL}?action=admin&password=${encodeURIComponent(pwd)}`);
    const j = await r.json();
    if (j.ok) {
      fromBackend = true;
      allUsers = (j.users || []).map((u) => ({
        name: u.name,
        phone: u.phone,
        email: u.email,
        createdAt: u.created_at ? new Date(u.created_at + "Z").getTime() : 0,
        lastSeen:  u.last_seen  ? new Date(u.last_seen + "Z").getTime()  : 0,
        currentDay: parseInt(u.current_day || 1, 10),
        completed: u.completed_days_arr || [],
        submissions: {},
        history: [{ at: u.last_seen ? new Date(u.last_seen + "Z").getTime() : 0 }],
      }));
      views = parseInt(j.views || 0, 10);
      contacts = (j.events || [])
        .filter((e) => e.type === "zalo_contact")
        .map((e) => ({
          at: e.created_at ? new Date(e.created_at + "Z").getTime() : 0,
          source: e.detail,
          name: e.name,
          phone: e.phone,
        }));
      submissionsRaw = j.submissions || [];
    } else if (j.error && j.error.includes("mật khẩu")) {
      clearAdminPassword();
      adminEl.classList.add("hidden");
      pwd = await promptAdminPassword();
      if (pwd) return renderAdmin();
      window.location.href = "?";
      return;
    } else {
      throw new Error(j.error);
    }
  } catch (e) {
    console.warn("[admin] Fallback localStorage:", e);
    const users = loadUsers();
    allUsers = Object.values(users);
    views = parseInt(localStorage.getItem(VIEWS_KEY) || "0", 10);
    contacts = loadContacts();
  }
  const learningUsers = allUsers.filter((u) => (u.completed || []).length > 0 && (u.completed || []).length < 28);
  const completedUsers = allUsers.filter((u) => (u.completed || []).length >= 28);
  const newUsers = allUsers.filter((u) => (u.completed || []).length === 0);

  // Stats
  const stats = [
    { label: "Lượt xem trang", value: views, kind: "views" },
    { label: "Đã đăng ký", value: allUsers.length, kind: "registered" },
    { label: "Đang học", value: learningUsers.length, kind: "learning" },
    { label: "Đã hoàn thành 28/28", value: completedUsers.length, kind: "completed" },
    { label: "Lần liên hệ Zalo", value: contacts.length, kind: "contacts" },
  ];
  document.getElementById("adminStats").innerHTML =
    `<div class="admin-source-tag">${fromBackend ? "🟢 Đang đọc dữ liệu từ MySQL trên hosting" : "🟡 Đang đọc từ localStorage (backend chưa kết nối)"}</div>` +
    stats.map((s) => `
      <div class="admin-stat ${s.kind}">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>
    `).join("");

  // Bảng học viên
  const usersHtml = allUsers.length ? `
    <div class="admin-table-wrapper">
    <table class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Họ tên</th>
          <th>Số điện thoại</th>
          <th>Email</th>
          <th>Trạng thái</th>
          <th>Tiến độ</th>
          <th>Ngày học hiện tại</th>
          <th>Báo cáo đã nộp</th>
          <th>Đăng ký lúc</th>
          <th>Hoạt động cuối</th>
          <th>Liên hệ Zalo</th>
        </tr>
      </thead>
      <tbody>
        ${allUsers
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((u, idx) => {
            const completed = (u.completed || []).length;
            const submissions = Object.keys(u.submissions || {}).length;
            const status = completed >= 28 ? "completed" : completed > 0 ? "learning" : "new";
            const statusLabel = completed >= 28 ? "Hoàn thành" : completed > 0 ? "Đang học" : "Mới đăng ký";
            const lastActivity = u.history && u.history.length
              ? formatDate(u.history[u.history.length - 1].at)
              : "—";
            const userContacts = contacts.filter((c) => c.phone === u.phone).length;
            const pct = Math.round((completed / 28) * 100);
            return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${u.name || ""}</strong></td>
                <td>${u.phone || ""}</td>
                <td>${u.email || "<span style='color:var(--gray-400)'>—</span>"}</td>
                <td><span class="badge ${status}">${statusLabel}</span></td>
                <td>
                  <div class="progress-mini"><span style="width:${pct}%"></span></div>
                  <span>${completed}/28</span>
                </td>
                <td>Ngày ${u.currentDay || 1}</td>
                <td>${submissions}</td>
                <td>${u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                <td>${lastActivity}</td>
                <td>${userContacts > 0
                    ? `<span class="badge contact">${userContacts} lần</span>`
                    : `<span style="color:var(--gray-400)">—</span>`}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
    </div>
  ` : `<div class="admin-empty">Chưa có học viên nào đăng ký trên thiết bị này.</div>`;
  document.getElementById("adminUsers").innerHTML = usersHtml;

  // Bảng liên hệ Zalo
  const contactsHtml = contacts.length ? `
    <div class="admin-table-wrapper">
    <table class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Thời gian</th>
          <th>Học viên</th>
          <th>Số điện thoại</th>
          <th>Nguồn</th>
        </tr>
      </thead>
      <tbody>
        ${contacts
          .slice()
          .sort((a, b) => b.at - a.at)
          .map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${formatDate(c.at)}</td>
              <td>${c.name || "<span style='color:var(--gray-400)'>(chưa đăng nhập)</span>"}</td>
              <td>${c.phone || "—"}</td>
              <td>${c.source === "register" ? "Đăng ký (modal Zalo)" : "Tư vấn (nút nổi)"}</td>
            </tr>
          `)
          .join("")}
      </tbody>
    </table>
    </div>
  ` : `<div class="admin-empty">Chưa có lượt liên hệ Zalo nào được ghi nhận.</div>`;
  document.getElementById("adminContacts").innerHTML = contactsHtml;

  // Render khu vực quản lý bài học
  await renderLessonManager(pwd);

  // Nút làm mới
  document.getElementById("refreshAdminBtn").onclick = renderAdmin;

  // Xuất CSV
  document.getElementById("exportCsvBtn").onclick = () => exportCsv(allUsers, contacts);
}

// ---------- LESSON MANAGER (Admin) ----------
async function renderLessonManager(pwd) {
  // Tạo card nếu chưa có
  let card = document.getElementById("lessonManagerCard");
  if (!card) {
    card = document.createElement("div");
    card.className = "admin-card";
    card.id = "lessonManagerCard";
    document.querySelector("#adminScreen main.container").insertBefore(
      card, document.querySelector("#adminScreen .admin-note")
    );
  }
  // Tải overrides mới nhất
  await fetchLessonOverrides();
  const rows = LESSONS.map((base) => {
    const ov = LESSON_OVERRIDES[base.day];
    const hasCustom = !!ov;
    const hasVideo  = ov && ov.video_url;
    return `
      <tr>
        <td>Ngày ${base.day}</td>
        <td><strong>${(ov && ov.title) || base.title}</strong></td>
        <td>${hasCustom ? '<span class="badge contact">Đã tùy chỉnh</span>' : '<span style="color:var(--gray-400)">Mặc định</span>'}</td>
        <td>${hasVideo ? '🎬' : '—'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" data-edit-lesson="${base.day}">Sửa</button>
          ${hasCustom ? `<button class="btn btn-secondary btn-sm" data-reset-lesson="${base.day}" style="margin-left:6px; color: var(--danger);">Khôi phục</button>` : ''}
        </td>
      </tr>
    `;
  }).join("");

  card.innerHTML = `
    <h2>📚 Quản lý nội dung 28 bài học</h2>
    <p style="color: var(--gray-600); font-size: 13px; margin-bottom: 12px;">
      Sửa nội dung bài học và nhúng video YouTube. Học viên sẽ thấy nội dung mới ở lần truy cập tiếp theo.
    </p>
    <div class="admin-table-wrapper">
    <table class="admin-table">
      <thead><tr><th>Ngày</th><th>Tiêu đề</th><th>Trạng thái</th><th>Video</th><th>Hành động</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
  `;
  card.querySelectorAll("[data-edit-lesson]").forEach((b) => {
    b.addEventListener("click", () => openLessonEditor(parseInt(b.dataset.editLesson, 10), pwd));
  });
  card.querySelectorAll("[data-reset-lesson]").forEach((b) => {
    b.addEventListener("click", async () => {
      if (!confirm("Khôi phục bài này về nội dung mặc định?")) return;
      const r = await fetch(`${BACKEND_URL}?action=lesson_delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd, day: parseInt(b.dataset.resetLesson, 10) }),
      });
      const j = await r.json();
      if (j.ok) {
        delete LESSON_OVERRIDES[parseInt(b.dataset.resetLesson, 10)];
        renderLessonManager(pwd);
      } else alert(j.error || "Lỗi");
    });
  });
}

function openLessonEditor(day, pwd) {
  const base = LESSONS[day - 1];
  const ov = LESSON_OVERRIDES[day] || {};

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" style="max-width: 800px;">
      <h2>Sửa bài ngày ${day}</h2>
      <p class="modal-desc">Để trống một trường để dùng nội dung mặc định. Body hỗ trợ HTML (nếu copy từ Word, dán dưới dạng văn bản).</p>
      <form id="lessonEditorForm">
        <div style="margin-bottom: 12px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Tiêu đề</label>
          <input type="text" id="le_title" style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${(ov.title || base.title || '').replace(/"/g, '&quot;')}" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Phụ đề</label>
          <input type="text" id="le_subtitle" style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${(ov.subtitle || base.subtitle || '').replace(/"/g, '&quot;')}" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">URL video YouTube (tùy chọn)</label>
          <input type="url" id="le_video" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${ov.video_url || ''}" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Nội dung bài học (HTML)</label>
          <textarea id="le_body" rows="14" style="width:100%; padding:12px; border:1.5px solid var(--gray-200); border-radius:8px; font-family: ui-monospace, monospace; font-size: 13px;">${(ov.body || base.body || '').trim()}</textarea>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" class="btn btn-secondary" id="le_cancel">Hủy</button>
          <button type="submit" class="btn btn-primary">💾 Lưu</button>
        </div>
      </form>
      <button type="button" class="modal-close" id="le_close">×</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  document.getElementById("le_cancel").onclick = close;
  document.getElementById("le_close").onclick = close;

  document.getElementById("lessonEditorForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      password: pwd,
      day,
      title:    document.getElementById("le_title").value,
      subtitle: document.getElementById("le_subtitle").value,
      body:     document.getElementById("le_body").value,
      videoUrl: document.getElementById("le_video").value,
    };
    const r = await fetch(`${BACKEND_URL}?action=lesson_update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (j.ok) {
      LESSON_OVERRIDES[day] = {
        day,
        title: payload.title,
        subtitle: payload.subtitle,
        body: payload.body,
        video_url: payload.videoUrl,
      };
      close();
      renderLessonManager(pwd);
      alert("Đã lưu bài " + day);
    } else {
      alert(j.error || "Lỗi lưu");
    }
  });
}

function exportCsv(users, contacts) {
  const csvLines = [];
  csvLines.push("STT,Họ tên,Số điện thoại,Email,Ngày đăng ký,Số bài hoàn thành,Ngày hiện tại,Lần liên hệ Zalo");
  users
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach((u, i) => {
      const userContacts = contacts.filter((c) => c.phone === u.phone).length;
      const cells = [
        i + 1,
        `"${(u.name || "").replace(/"/g, '""')}"`,
        u.phone || "",
        u.email || "",
        u.createdAt ? formatDate(u.createdAt) : "",
        (u.completed || []).length,
        u.currentDay || 1,
        userContacts,
      ];
      csvLines.push(cells.join(","));
    });
  const csv = "﻿" + csvLines.join("\n"); // BOM cho Excel UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hoc-vien-momau28-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Bootstrap ----------
trackPageView();
showPreviewBanner();

if (ADMIN_MODE) {
  renderAdmin();
} else if (restoreSession()) {
  showApp();
} else if (PREVIEW_MODE) {
  // Trong chế độ xem trước, tự đăng nhập với tài khoản admin tạm để duyệt
  currentUser = {
    name: "Admin (Xem trước)",
    phone: "preview",
    email: "",
    createdAt: Date.now(),
    currentDay: 1,
    completed: [],
    submissions: {},
    history: [],
  };
  showApp();
} else {
  el.loginScreen.classList.remove("hidden");
  el.app.classList.add("hidden");
  pickDefaultTab();
}
