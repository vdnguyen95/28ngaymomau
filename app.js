const USERS_KEY = "momau28_users_v1";
const SESSION_KEY = "momau28_session_v1";
const VIEWS_KEY = "momau28_views_v1";
const CONTACTS_KEY = "momau28_zalo_contacts_v1";
const PROGRAM_NAME = "28 ngày đồng hành thay đổi thói quen cùng dược sĩ Đạt";
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

// Cooldown giữa 2 bài: chờ qua ngày mới (00:00 sáng hôm sau)
// Đặt false để tắt cooldown.
const COOLDOWN_NEXT_DAY = true;

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

  // Bật ticker cập nhật countdown mỗi giây
  startCountdownTicker();

  el.userName.textContent = currentUser.name;
  el.userPhone.textContent = currentUser.phone;
  el.userAvatar.textContent = getInitials(currentUser.name);
  el.welcomeName.textContent = currentUser.name;

  el.lessonView.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.welcome.classList.remove("hidden");

  // Đổi nhãn nút theo trạng thái
  const cd = getCooldownRemaining(currentUser.currentDay);
  if (currentUser.completed.length === 0) {
    el.startBtn.textContent = "Bắt đầu ngày 1";
  } else if (currentUser.completed.length >= 28) {
    el.startBtn.textContent = "Xem lại bài học";
  } else if (cd !== null && cd > 0) {
    el.startBtn.textContent = `⏱ Chờ mở khóa ngày ${currentUser.currentDay}`;
  } else {
    el.startBtn.textContent = `Tiếp tục ngày ${currentUser.currentDay}`;
  }

  renderSidebar();
}

function getCompletionTime(day) {
  // Lấy thời điểm user hoàn thành bài `day` (từ submissions hoặc history)
  if (!currentUser) return null;
  const sub = currentUser.submissions && currentUser.submissions[day];
  if (sub && sub.at) return sub.at;
  if (Array.isArray(currentUser.history)) {
    const entries = currentUser.history.filter((h) => h.day === day && h.at);
    if (entries.length) return Math.max(...entries.map((e) => e.at));
  }
  return null;
}

function getCooldownRemaining(day) {
  // Trả về số ms còn lại đến khi mở khóa; null nếu không trong cooldown.
  // Cơ chế: mở khóa vào 00:00:00 của ngày SAU ngày hoàn thành bài trước.
  if (PREVIEW_MODE || day === 1 || !COOLDOWN_NEXT_DAY) return null;
  if (!currentUser) return null;
  // Bài đã hoàn thành thì không có cooldown
  if (currentUser.completed.includes(day)) return null;
  if (!currentUser.completed.includes(day - 1)) return null;
  const prevTime = getCompletionTime(day - 1);
  if (!prevTime) return null;
  const unlockAt = new Date(prevTime);
  unlockAt.setDate(unlockAt.getDate() + 1);
  unlockAt.setHours(0, 0, 0, 0);
  return Math.max(0, unlockAt.getTime() - Date.now());
}

function getUnlockDate(day) {
  // Trả về Date object thời điểm bài `day` sẽ mở khóa (hoặc null)
  if (PREVIEW_MODE || day === 1 || !COOLDOWN_NEXT_DAY) return null;
  if (!currentUser) return null;
  if (currentUser.completed.includes(day)) return null;
  if (!currentUser.completed.includes(day - 1)) return null;
  const prevTime = getCompletionTime(day - 1);
  if (!prevTime) return null;
  const d = new Date(prevTime);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatUnlockDate(date) {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `00:00 ngày ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function isUnlocked(day) {
  if (!currentUser) return false;
  if (PREVIEW_MODE) return true;
  if (day === 1) return true;
  if (!currentUser.completed.includes(day - 1)) return false;
  // Check cooldown 24h
  const remaining = getCooldownRemaining(day);
  if (remaining !== null && remaining > 0) return false;
  return true;
}

function formatCountdown(ms) {
  if (ms <= 0) return "Sẵn sàng";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function renderSidebar() {
  el.lessonList.innerHTML = "";
  LESSONS.forEach((lesson) => {
    const unlocked = isUnlocked(lesson.day);
    const completed = currentUser.completed.includes(lesson.day);
    const cooldown = getCooldownRemaining(lesson.day);
    const inCooldown = cooldown !== null && cooldown > 0;

    const li = document.createElement("li");
    li.className = "lesson-item";
    if (!unlocked) li.classList.add("locked");
    if (completed) li.classList.add("completed");
    if (currentUser.currentDay === lesson.day) li.classList.add("active");
    if (inCooldown) li.classList.add("cooldown");

    let status;
    if (completed) status = "✓";
    else if (unlocked) status = lesson.day;
    else if (inCooldown) status = "⏱";
    else status = "🔒";

    li.innerHTML = `
      <span class="lesson-status">${status}</span>
      <span class="lesson-title">Ngày ${lesson.day}: ${lesson.title}</span>
      ${inCooldown ? `<span class="lesson-countdown" data-cooldown-day="${lesson.day}">${formatCountdown(cooldown)}</span>` : ''}
    `;

    if (unlocked) {
      li.addEventListener("click", () => openLesson(lesson.day));
    } else if (inCooldown) {
      li.addEventListener("click", () => showCooldownView(lesson.day));
    }
    el.lessonList.appendChild(li);
  });

  const done = currentUser.completed.length;
  el.progressSummary.textContent = `${done} / 28 bài`;
  el.progressFill.style.width = `${(done / 28) * 100}%`;
}

// Hiển thị màn hình chờ với đồng hồ đếm ngược
function showCooldownView(day) {
  el.welcome.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.lessonView.classList.remove("hidden");

  const remaining = getCooldownRemaining(day) || 0;
  const unlockDate = getUnlockDate(day);
  const lesson = resolveLesson(day);
  el.lessonView.innerHTML = `
    <div class="cooldown-screen">
      <div class="cooldown-icon">⏱</div>
      <h2>Bài ngày ${day} sắp mở khóa</h2>
      <p class="cooldown-subtitle">${lesson.title}</p>
      <div class="cooldown-clock" data-cooldown-day="${day}">${formatCountdown(remaining)}</div>
      ${unlockDate ? `<div class="cooldown-unlock-at">Mở khóa lúc <strong>${formatUnlockDate(unlockDate)}</strong></div>` : ""}
      <p class="cooldown-hint">Mỗi ngày một bài — hãy dành thời gian áp dụng bài học hôm nay. Bài tiếp theo sẽ tự động mở khi sang ngày mới.</p>
      <div class="lesson-actions" style="justify-content: center;">
        <button class="btn btn-secondary" id="cooldownBackBtn">← Quay lại bài đã học</button>
      </div>
    </div>
  `;
  document.getElementById("cooldownBackBtn").addEventListener("click", () => {
    const lastDone = Math.max(...(currentUser.completed.length ? currentUser.completed : [1]));
    if (isUnlocked(lastDone)) openLesson(lastDone);
    else { el.lessonView.classList.add("hidden"); el.welcome.classList.remove("hidden"); }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Cập nhật mọi đồng hồ đếm ngược trên trang mỗi giây
let _countdownTickerStarted = false;
function startCountdownTicker() {
  if (_countdownTickerStarted) return;
  _countdownTickerStarted = true;
  setInterval(() => {
    if (!currentUser) return;
    const elements = document.querySelectorAll("[data-cooldown-day]");
    if (!elements.length) return;
    let needsRefresh = false;
    elements.forEach((node) => {
      const day = parseInt(node.dataset.cooldownDay, 10);
      const remaining = getCooldownRemaining(day);
      if (remaining === null || remaining <= 0) {
        node.textContent = "Sẵn sàng";
        needsRefresh = true;
      } else {
        node.textContent = formatCountdown(remaining);
      }
    });
    if (needsRefresh) renderSidebar();
  }, 1000);
}

function openLesson(day) {
  if (!isUnlocked(day)) {
    // Nếu bị khóa do cooldown → hiển thị đồng hồ đếm ngược
    const remaining = getCooldownRemaining(day);
    if (remaining !== null && remaining > 0) return showCooldownView(day);
    return;
  }
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

  // Vinh danh: hoàn thành ngày 7, 14, 21, 28 → bật modal huy hiệu
  if (MILESTONES.includes(day)) {
    setTimeout(() => showBadgeCelebration(day), 800);
  }

  renderSidebar();

  // Cooldown info
  const nextDay = day + 1;
  const nextRemaining = day < 28 ? getCooldownRemaining(nextDay) : null;
  const inCooldown = nextRemaining !== null && nextRemaining > 0;
  const nextUnlockDate = day < 28 ? getUnlockDate(nextDay) : null;
  const cooldownHtml = (day < 28 && COOLDOWN_NEXT_DAY)
    ? `
      <div class="cooldown-info">
        <div class="cooldown-info-title">⏱ Bài ngày ${nextDay} sẽ mở khóa sau:</div>
        <div class="cooldown-clock" data-cooldown-day="${nextDay}">${formatCountdown(nextRemaining || 0)}</div>
        ${nextUnlockDate ? `<div class="cooldown-info-when">Mở khóa lúc <strong>${formatUnlockDate(nextUnlockDate)}</strong></div>` : ""}
        <div class="cooldown-info-hint">Mỗi ngày một bài — hãy áp dụng nội dung hôm nay vào cuộc sống. Bài tiếp theo sẽ tự mở khi sang ngày mới.</div>
      </div>
    `
    : "";

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
      ${cooldownHtml}
      <div style="margin-top:18px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        ${day < 28 && !inCooldown ? `<button class="btn btn-primary" id="nextLessonBtn">Học ngày ${day + 1}</button>` : ""}
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
      <h2>Top học viên 28 ngày đồng hành thay đổi thói quen</h2>
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
      title: `<span class="n-name">${name}</span> đã hoàn thành trọn 28 ngày đồng hành!`,
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
  let body = base.body;
  if (ov.body && ov.body.trim()) {
    // Nếu admin lưu plain text, chuyển sang HTML khi hiển thị
    body = plainTextToHtml(ov.body);
  }
  return {
    ...base,
    title:    (ov.title    && ov.title.trim())    ? ov.title    : base.title,
    subtitle: (ov.subtitle && ov.subtitle.trim()) ? ov.subtitle : base.subtitle,
    body,
    videoUrl: ov.video_url || "",
  };
}

// ---------- Plain text ⇄ HTML chuyển đổi ----------
function plainTextToHtml(text) {
  if (!text) return "";
  // Nếu đã là HTML (có thẻ) → giữ nguyên
  if (/<\w+[^>]*>/.test(text)) return text;

  const formatInline = (s) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  const lines = text.replace(/\r/g, "").split("\n");
  const out = [];
  let buffer = [];
  let inList = false;

  const flushPara = () => {
    if (buffer.length) {
      out.push("<p>" + buffer.join("<br>") + "</p>");
      buffer = [];
    }
  };
  const closeList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      closeList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara(); closeList();
      out.push("<h3>" + formatInline(line.slice(3)) + "</h3>");
    } else if (line.startsWith("> ")) {
      flushPara(); closeList();
      out.push('<div class="callout">' + formatInline(line.slice(2)) + "</div>");
    } else if (line.startsWith("- ")) {
      flushPara();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push("<li>" + formatInline(line.slice(2)) + "</li>");
    } else {
      closeList();
      buffer.push(formatInline(line));
    }
  }
  flushPara();
  closeList();
  return out.join("\n");
}

function htmlToPlainText(html) {
  if (!html) return "";
  // Nếu không có thẻ HTML → đã là plain text
  if (!/<\w+[^>]*>/.test(html)) return html;

  return String(html)
    .replace(/<h[1-6][^>]*>/gi, "\n## ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<div\s+class=["']callout["'][^>]*>/gi, "\n> ")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<ul[^>]*>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "\n")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<strong[^>]*>|<b[^>]*>/gi, "**")
    .replace(/<\/strong>|<\/b>/gi, "**")
    .replace(/<em[^>]*>|<i[^>]*>/gi, "*")
    .replace(/<\/em>|<\/i>/gi, "*")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

// Lưu dữ liệu admin để các view chi tiết có thể tra cứu
let _adminCache = null;

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
      // Cache để các view chi tiết tra cứu
      _adminCache = {
        allUsers,
        submissions: submissionsRaw,
        events: j.events || [],
        contacts,
      };
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
          <th>Chi tiết</th>
        </tr>
      </thead>
      <tbody>
        ${allUsers
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((u, idx) => {
            const completed = (u.completed || []).length;
            // Đếm số báo cáo thực tế từ DB nếu có
            const userSubs = _adminCache ? _adminCache.submissions.filter(s => s.phone === u.phone) : [];
            const submissions = userSubs.length || Object.keys(u.submissions || {}).length;
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
                <td><button class="btn btn-secondary btn-sm" data-view-user="${u.phone}">👁 Xem</button></td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
    </div>
  ` : `<div class="admin-empty">Chưa có học viên nào đăng ký trên thiết bị này.</div>`;
  document.getElementById("adminUsers").innerHTML = usersHtml;

  // Gắn nút xem chi tiết
  document.querySelectorAll("[data-view-user]").forEach((btn) => {
    btn.addEventListener("click", () => showUserDetail(btn.dataset.viewUser));
  });

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

  // Render khu vực quà tặng cuối chương trình
  await renderGiftManager(pwd);

  // Khu xem học viên đã đạt huy hiệu
  renderBadgeAchievers(allUsers);

  // Khu xem trước mẫu huy hiệu
  await renderBadgePreview();

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
  // Hiển thị nội dung dưới dạng plain text (nếu là HTML thì tự chuyển đổi)
  const initialBody = htmlToPlainText(ov.body && ov.body.trim() ? ov.body : base.body);

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" style="max-width: 820px;">
      <h2>Sửa bài ngày ${day}</h2>
      <p class="modal-desc">Soạn nội dung dưới dạng văn bản thông thường — không cần viết HTML.</p>
      <form id="lessonEditorForm">

        <div style="margin-bottom: 14px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Tiêu đề bài học</label>
          <input type="text" id="le_title" style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px; font-size:15px;" value="${(ov.title || base.title || '').replace(/"/g, '&quot;')}" />
        </div>

        <div style="margin-bottom: 14px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Phụ đề (mô tả ngắn dưới tiêu đề)</label>
          <input type="text" id="le_subtitle" style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${(ov.subtitle || base.subtitle || '').replace(/"/g, '&quot;')}" />
        </div>

        <div style="margin-bottom: 14px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">URL video YouTube (tùy chọn)</label>
          <input type="url" id="le_video" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${ov.video_url || ''}" />
        </div>

        <div style="margin-bottom: 8px;">
          <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Nội dung bài học</label>
          <textarea id="le_body" rows="18" style="width:100%; padding:14px; border:1.5px solid var(--gray-200); border-radius:8px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6;" placeholder="Nhập nội dung bài học...">${initialBody.replace(/</g, '&lt;')}</textarea>
        </div>

        <details style="background: var(--gray-50); padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;">
          <summary style="cursor: pointer; font-weight: 600; color: var(--green-700);">📖 Hướng dẫn định dạng (bấm để xem)</summary>
          <div style="margin-top: 10px; color: var(--gray-700);">
            <p style="margin-bottom: 8px;"><strong>Đoạn văn:</strong> Để 1 dòng trống giữa các đoạn.</p>
            <p style="margin-bottom: 8px;"><strong>Tiêu đề mục:</strong> Bắt đầu dòng bằng <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid var(--gray-200);">## </code> (2 dấu thăng + dấu cách)</p>
            <p style="margin-bottom: 8px;"><strong>Khung ghi chú quan trọng:</strong> Bắt đầu dòng bằng <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid var(--gray-200);">&gt; </code></p>
            <p style="margin-bottom: 8px;"><strong>Mục liệt kê:</strong> Bắt đầu mỗi dòng bằng <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid var(--gray-200);">- </code></p>
            <p style="margin-bottom: 8px;"><strong>Chữ đậm:</strong> Bọc trong <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid var(--gray-200);">**chữ**</code> · <strong>Chữ nghiêng:</strong> Bọc trong <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid var(--gray-200);">*chữ*</code></p>
            <p style="background: var(--green-50); padding: 10px; border-radius: 6px; margin-top: 10px; color: var(--green-800);"><strong>Ví dụ:</strong></p>
            <pre style="background: var(--gray-100); padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin-top: 4px;">## Mỡ máu là gì?

Mỡ máu là chất béo lưu thông trong máu, bao gồm cholesterol và triglyceride.

## Vai trò của mỡ máu

- Cung cấp năng lượng cho tế bào
- Tạo màng tế bào và **hormone**
- Hỗ trợ hấp thu vitamin tan trong dầu

> Lưu ý: Cơ thể cần mỡ máu, nhưng vượt ngưỡng sẽ gây xơ vữa.</pre>
          </div>
        </details>

        <div style="display:flex; gap:10px; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-secondary btn-sm" id="le_preview">👁 Xem trước</button>
          <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-secondary" id="le_cancel">Hủy</button>
            <button type="submit" class="btn btn-primary">💾 Lưu</button>
          </div>
        </div>

        <div id="le_preview_area" style="display:none; margin-top:14px; padding:16px; background:#fff; border:1.5px solid var(--green-200); border-radius:10px;">
          <div style="font-size:12px; color:var(--gray-600); text-transform:uppercase; font-weight:600; margin-bottom:8px;">Xem trước</div>
          <div class="lesson-body" id="le_preview_body"></div>
        </div>
      </form>
      <button type="button" class="modal-close" id="le_close">×</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  document.getElementById("le_cancel").onclick = close;
  document.getElementById("le_close").onclick = close;

  // Xem trước
  document.getElementById("le_preview").onclick = () => {
    const area = document.getElementById("le_preview_area");
    const body = document.getElementById("le_preview_body");
    const plain = document.getElementById("le_body").value;
    body.innerHTML = plainTextToHtml(plain);
    area.style.display = area.style.display === "none" ? "block" : "none";
  };

  document.getElementById("lessonEditorForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      password: pwd,
      day,
      title:    document.getElementById("le_title").value,
      subtitle: document.getElementById("le_subtitle").value,
      body:     document.getElementById("le_body").value, // LƯU dạng plain text
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

// ---------- Admin: quản lý quà tặng cuối chương trình ----------
async function renderGiftManager(pwd) {
  let card = document.getElementById("giftManagerCard");
  if (!card) {
    card = document.createElement("div");
    card.className = "admin-card";
    card.id = "giftManagerCard";
    document.querySelector("#adminScreen main.container").insertBefore(
      card, document.querySelector("#adminScreen .admin-note")
    );
  }
  let settings = {};
  try {
    const r = await fetch(`${BACKEND_URL}?action=settings_get`);
    const j = await r.json();
    if (j.ok) settings = j.settings || {};
  } catch (e) {}

  card.innerHTML = `
    <h2>🎁 Quà tặng đặc biệt (hiển thị khi học viên hoàn thành 28 ngày)</h2>
    <p style="color: var(--gray-600); font-size: 13px; margin-bottom: 12px;">
      Nội dung này sẽ hiện trong modal vinh danh khi học viên hoàn thành ngày 28.
    </p>
    <form id="giftForm">
      <div style="margin-bottom: 12px;">
        <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Tiêu đề quà tặng</label>
        <input type="text" id="g_title" style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${(settings.gift_title || '').replace(/"/g, '&quot;')}" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Mô tả</label>
        <textarea id="g_desc" rows="3" style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;">${settings.gift_description || ''}</textarea>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">Link nhận quà (tùy chọn)</label>
        <input type="url" id="g_link" placeholder="https://..." style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${settings.gift_link || ''}" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="font-weight:600; font-size:14px; display:block; margin-bottom:4px;">URL ảnh quà tặng (tùy chọn)</label>
        <input type="url" id="g_image" placeholder="https://... hoặc uploads/..." style="width:100%; padding:10px; border:1.5px solid var(--gray-200); border-radius:8px;" value="${settings.gift_image || ''}" />
      </div>
      <button type="submit" class="btn btn-primary">💾 Lưu</button>
    </form>
  `;
  document.getElementById("giftForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      password: pwd,
      gift_title: document.getElementById("g_title").value,
      gift_description: document.getElementById("g_desc").value,
      gift_link: document.getElementById("g_link").value,
      gift_image: document.getElementById("g_image").value,
    };
    const r = await fetch(`${BACKEND_URL}?action=settings_update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    alert(j.ok ? "Đã lưu quà tặng" : (j.error || "Lỗi"));
  });
}

// ---------- Admin: xem trước mẫu huy hiệu ----------
async function renderBadgePreview() {
  let card = document.getElementById("badgePreviewCard");
  if (!card) {
    card = document.createElement("div");
    card.className = "admin-card";
    card.id = "badgePreviewCard";
    document.querySelector("#adminScreen main.container").insertBefore(
      card, document.querySelector("#adminScreen .admin-note")
    );
  }
  card.innerHTML = `
    <h2>🎨 Xem trước mẫu huy hiệu</h2>
    <p style="color: var(--gray-600); font-size: 13px; margin-bottom: 14px;">
      Đây là mẫu huy hiệu mà học viên sẽ nhận được. Bấm "Tải" để download mẫu PNG xem chi tiết.
    </p>
    <div id="badgePreviewGrid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;"></div>
  `;
  const grid = document.getElementById("badgePreviewGrid");
  const sampleName = "Nguyễn Văn An";
  const tiers = [
    { days: 7,  label: "Tuần 1 — Ngày 7" },
    { days: 14, label: "Tuần 2 — Ngày 14" },
    { days: 21, label: "Tuần 3 — Ngày 21" },
    { days: 28, label: "🏆 Bằng vinh danh 28 ngày" },
  ];
  for (const t of tiers) {
    const item = document.createElement("div");
    item.style.cssText = "border:1px solid var(--gray-200); border-radius:10px; padding:10px; text-align:center;";
    item.innerHTML = `<div style="font-weight:600; font-size:13px; color:var(--green-700); margin-bottom:8px;">${t.label}</div><div class="preview-canvas-wrap"></div><button class="btn btn-secondary btn-sm" data-preview-days="${t.days}" style="margin-top:8px;">📥 Tải mẫu</button>`;
    grid.appendChild(item);
    const canvas = await generateBadgeCanvas({
      name: sampleName,
      daysCompleted: t.days,
      avatarUrl: "",          // dùng chữ cái đầu
      isFinal: t.days === 28,
    });
    // Thumbnail nhỏ cho admin
    const small = document.createElement("canvas");
    small.width = 200;
    small.height = canvas.height * (200 / canvas.width);
    small.style.maxWidth = "100%";
    small.style.borderRadius = "6px";
    small.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    const sctx = small.getContext("2d");
    sctx.drawImage(canvas, 0, 0, small.width, small.height);
    item.querySelector(".preview-canvas-wrap").appendChild(small);

    item.querySelector("button").addEventListener("click", () => {
      downloadCanvas(canvas, `mau-huy-hieu-${t.days}-ngay.png`);
    });
  }
}

// ---------- Admin: danh sách học viên đã đạt huy hiệu ----------
function renderBadgeAchievers(allUsers) {
  let card = document.getElementById("achieversCard");
  if (!card) {
    card = document.createElement("div");
    card.className = "admin-card";
    card.id = "achieversCard";
    document.querySelector("#adminScreen main.container").insertBefore(
      card, document.querySelector("#adminScreen .admin-note")
    );
  }
  const tiers = [
    { days: 28, label: "🏆 Bằng vinh danh 28 ngày", color: "#d97706" },
    { days: 21, label: "🥇 Huy hiệu tuần 3 (21 ngày)", color: "#15803d" },
    { days: 14, label: "🥈 Huy hiệu tuần 2 (14 ngày)", color: "#22c55e" },
    { days: 7,  label: "🥉 Huy hiệu tuần 1 (7 ngày)",  color: "#86efac" },
  ];
  const html = tiers.map((t) => {
    const winners = allUsers.filter((u) => (u.completed || []).length >= t.days);
    if (!winners.length) return "";
    return `
      <div style="margin-bottom: 16px;">
        <h3 style="color: ${t.color}; font-size: 15px; margin-bottom: 8px;">${t.label} <span style="color:var(--gray-600); font-weight:400;">(${winners.length} học viên)</span></h3>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${winners.map((u) => `<span style="background: var(--green-50); color: var(--green-800); padding: 4px 10px; border-radius: 12px; font-size: 13px;">${u.name} · ${u.phone}</span>`).join("")}
        </div>
      </div>
    `;
  }).join("");
  card.innerHTML = `
    <h2>🎖 Học viên đã đạt huy hiệu</h2>
    ${html || '<div class="admin-empty">Chưa có ai đạt mốc nào.</div>'}
  `;
}

// ---------- Admin: Chi tiết 1 học viên ----------
function showUserDetail(phone) {
  if (!_adminCache) return;
  const user = _adminCache.allUsers.find((u) => u.phone === phone);
  if (!user) return;

  const submissions = _adminCache.submissions
    .filter((s) => s.phone === phone)
    .sort((a, b) => (a.day - b.day) || (new Date(a.submitted_at) - new Date(b.submitted_at)));
  const events = _adminCache.events
    .filter((e) => e.phone === phone)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  const completedDays = user.completed || [];
  const totalSubs = submissions.length;

  // Lưới 28 ô tiến độ
  const progressGridHtml = Array.from({ length: 28 }, (_, i) => {
    const d = i + 1;
    const done = completedDays.includes(d);
    const subCount = submissions.filter((s) => s.day === d).length;
    return `<div class="progress-cell ${done ? 'done' : ''}" title="Ngày ${d}${done ? ' · Đã hoàn thành' : ''}${subCount > 1 ? ' · ' + subCount + ' lần nộp' : ''}">${done ? '✓' : d}</div>`;
  }).join("");

  // Nhóm submissions theo ngày
  const subsByDay = {};
  submissions.forEach((s) => {
    if (!subsByDay[s.day]) subsByDay[s.day] = [];
    subsByDay[s.day].push(s);
  });

  const submissionsHtml = Object.keys(subsByDay)
    .map((d) => parseInt(d, 10))
    .sort((a, b) => a - b)
    .map((d) => {
      const list = subsByDay[d];
      const lessonTitle = list[0].lesson_title || (LESSONS[d - 1] && LESSONS[d - 1].title) || "";
      return `
        <div class="user-submission-card">
          <div class="user-submission-header">
            <span class="user-submission-day">Ngày ${d}</span>
            <span class="user-submission-title">${lessonTitle}</span>
            ${list.length > 1 ? `<span class="badge contact">${list.length} lần nộp</span>` : ""}
          </div>
          ${list.map((s) => `
            <div class="user-submission-entry">
              <div class="user-submission-time">📅 ${formatDate(new Date(s.submitted_at + 'Z').getTime())}</div>
              <div class="user-submission-images">
                ${s.meal_image ? `<div><img src="/${s.meal_image}" alt="Bữa ăn" data-zoom /><div class="ud-label">🍽 Bữa ăn</div></div>` : '<div class="ud-empty">— Không có ảnh bữa ăn —</div>'}
                ${s.exercise_image ? `<div><img src="/${s.exercise_image}" alt="Tập thể dục" data-zoom /><div class="ud-label">🏃 Tập thể dục</div></div>` : '<div class="ud-empty">— Không có ảnh tập thể dục —</div>'}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");

  const eventsHtml = events.length ? events.map((e) => {
    const label = {
      'zalo_contact': '💬 Liên hệ Zalo (' + (e.detail || '') + ')',
    }[e.type] || e.type;
    return `<li><span style="color:var(--gray-500); font-size:12px;">${formatDate(new Date(e.created_at + 'Z').getTime())}</span> · ${label}</li>`;
  }).join("") : '<li style="color: var(--gray-400);">Chưa có hoạt động được ghi nhận</li>';

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card user-detail-card">
      <div class="user-detail-header">
        <div class="user-detail-avatar">${getInitial(user.name || '?')}</div>
        <div>
          <h2 style="margin-bottom: 4px;">${user.name || '(Chưa có tên)'}</h2>
          <div class="user-detail-meta">
            <span>📞 ${user.phone}</span>
            ${user.email ? `<span>📧 ${user.email}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="user-detail-stats">
        <div class="stat-card">
          <div class="stat-value">${completedDays.length} / 28</div>
          <div class="stat-label">Bài hoàn thành</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalSubs}</div>
          <div class="stat-label">Lượt nộp báo cáo</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">Ngày ${user.currentDay || 1}</div>
          <div class="stat-label">Đang học</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${user.createdAt ? formatDate(user.createdAt).split(' ')[0] : '—'}</div>
          <div class="stat-label">Ngày đăng ký</div>
        </div>
      </div>

      <h3 class="user-detail-section">📊 Tiến độ 28 ngày</h3>
      <div class="progress-grid">${progressGridHtml}</div>

      <h3 class="user-detail-section">📸 Báo cáo đã nộp</h3>
      ${submissionsHtml || '<div class="admin-empty">Chưa có báo cáo nào.</div>'}

      <h3 class="user-detail-section">📜 Hoạt động gần đây</h3>
      <ul class="user-detail-events">${eventsHtml}</ul>

      <button type="button" class="modal-close" id="ud_close" aria-label="Đóng">×</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("ud_close").onclick = () => overlay.remove();
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  attachLightbox(overlay);
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

// ---------- Vinh danh huy hiệu ----------
const MILESTONES = [7, 14, 21, 28];

// Tải ảnh thành Image object để dùng cho canvas
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line.length) {
      lines.push(line.trim());
      line = w + ' ';
    } else line = test;
  }
  lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length * lineHeight;
}

async function generateBadgeCanvas({ name, daysCompleted, avatarUrl, isFinal }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const W = isFinal ? 1200 : 800;
  const H = isFinal ? 850 : 800;
  canvas.width = W;
  canvas.height = H;

  if (isFinal) {
    // Bằng vinh danh: nền vàng cream
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#fffbeb');
    g.addColorStop(1, '#fef3c7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Viền vàng
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
  } else {
    // Huy hiệu tuần: nền xanh gradient
    const g = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, W);
    g.addColorStop(0, '#22c55e');
    g.addColorStop(1, '#15803d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Viền trắng
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, W - 60, H - 60);
  }

  // Tiêu đề trên cùng
  ctx.textAlign = 'center';
  ctx.fillStyle = isFinal ? '#92400e' : '#fff';
  ctx.font = `bold ${isFinal ? 56 : 38}px 'Segoe UI', Arial, sans-serif`;
  ctx.fillText(isFinal ? 'BẰNG VINH DANH' : `🏆 HUY HIỆU TUẦN ${Math.ceil(daysCompleted/7)}`, W/2, isFinal ? 130 : 100);

  if (isFinal) {
    ctx.font = `28px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = '#78350f';
    ctx.fillText('Chứng nhận hoàn thành chương trình', W/2, 180);
  }

  // Vẽ ảnh đại diện hình tròn
  const photoY = isFinal ? 290 : 200;
  const photoR = isFinal ? 110 : 130;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W/2, photoY + photoR, photoR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  let avatarLoaded = false;
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      const size = photoR * 2;
      const ratio = Math.max(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, W/2 - w/2, photoY + photoR - h/2, w, h);
      avatarLoaded = true;
    } catch (e) { console.warn('Avatar load fail', e); }
  }
  if (!avatarLoaded) {
    // Fallback: chữ cái đầu trên nền xanh
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(W/2 - photoR, photoY, photoR * 2, photoR * 2);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${photoR}px 'Segoe UI', Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(getInitial(name) || '?', W/2, photoY + photoR + 5);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
  // Viền tròn quanh ảnh
  ctx.strokeStyle = isFinal ? '#d97706' : '#fff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W/2, photoY + photoR, photoR, 0, Math.PI * 2);
  ctx.stroke();

  // Tên học viên
  ctx.fillStyle = isFinal ? '#92400e' : '#fff';
  ctx.font = `bold ${isFinal ? 52 : 44}px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = 'center';
  const nameY = photoY + photoR * 2 + (isFinal ? 70 : 60);
  ctx.fillText(name, W/2, nameY);

  // Subtitle: đã hoàn thành ...
  ctx.font = `${isFinal ? 30 : 28}px 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = isFinal ? '#78350f' : '#fef9c3';
  const subY = nameY + (isFinal ? 60 : 50);
  ctx.fillText('Đã hoàn thành ' + daysCompleted + '/28 ngày', W/2, subY);
  ctx.fillText('đồng hành thay đổi thói quen cùng Dược sĩ Đạt', W/2, subY + (isFinal ? 42 : 38));

  // Logo dưới cùng
  ctx.font = `${isFinal ? 24 : 22}px 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = isFinal ? '#a16207' : 'rgba(255,255,255,0.8)';
  ctx.fillText('🌿 28ngaymomau.duocsidat.vn', W/2, H - (isFinal ? 80 : 60));

  return canvas;
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function shareCanvas(canvas, name) {
  // Dùng Web Share API nếu hỗ trợ (mobile), fallback: copy ảnh + mở Facebook
  canvas.toBlob(async (blob) => {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'huyhieu.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          title: '28 ngày đồng hành thay đổi thói quen cùng Dược sĩ Đạt',
          text: `${name} đã hoàn thành chặng đường thay đổi thói quen! 🌿`,
          files: [new File([blob], 'huyhieu.png', { type: 'image/png' })],
        });
        return;
      } catch (e) {}
    }
    // Fallback: copy vào clipboard rồi mở Facebook share
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showCopyToast('🖼 Đã copy huy hiệu — paste vào bài đăng Facebook/Zalo');
    } catch (e) {
      showCopyToast('Trình duyệt không hỗ trợ share. Hãy bấm "Tải về" rồi đăng thủ công.');
    }
  }, 'image/png');
}

async function uploadAvatar(file) {
  const dataUrl = await resizeImage(file, 600, 0.85);
  const r = await fetch(`${BACKEND_URL}?action=upload_avatar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: currentUser.phone, image: dataUrl }),
  });
  const j = await r.json();
  if (j.ok) {
    currentUser.avatar = j.url;
    return dataUrl; // dùng dataURL ngay (canvas-friendly, không CORS)
  }
  throw new Error(j.error || 'Upload thất bại');
}

async function getAvatarUrl() {
  // Ưu tiên cache cục bộ
  if (currentUser.avatarDataUrl) return currentUser.avatarDataUrl;
  if (!currentUser.avatar) {
    try {
      const r = await fetch(`${BACKEND_URL}?action=get_avatar&phone=${encodeURIComponent(currentUser.phone)}`);
      const j = await r.json();
      if (j.ok && j.url) currentUser.avatar = j.url;
    } catch (e) {}
  }
  return currentUser.avatar || '';
}

async function showBadgeCelebration(daysCompleted) {
  const isFinal = daysCompleted >= 28;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card badge-modal-card">
      <h2>${isFinal ? '🏆 Chúc mừng! Bạn đã hoàn thành 28 ngày!' : `🎉 Chúc mừng hoàn thành tuần ${Math.ceil(daysCompleted/7)}!`}</h2>
      <p class="modal-desc">${isFinal ? 'Đây là bằng vinh danh dành cho bạn — tải về và chia sẻ thành tích nhé!' : 'Đây là huy hiệu dành cho bạn — tải về hoặc chia sẻ lên mạng xã hội.'}</p>
      <div id="avatarUploaderArea"></div>
      <div class="badge-canvas-wrap" id="badgeWrap"><div style="padding: 40px; color: var(--gray-400);">Đang tạo huy hiệu...</div></div>
      <div class="badge-actions">
        <button class="btn btn-primary" id="downloadBadgeBtn">📥 Tải huy hiệu</button>
        <button class="btn btn-secondary" id="shareBadgeBtn">📤 Chia sẻ</button>
        <button class="btn btn-secondary" id="closeBadgeBtn">Đóng</button>
      </div>
      ${isFinal ? '<div id="finalGiftArea"></div>' : ''}
    </div>
  `;
  document.body.appendChild(overlay);

  const renderBadge = async () => {
    const wrap = document.getElementById('badgeWrap');
    const avatarUrl = await getAvatarUrl();
    const fullUrl = avatarUrl
      ? (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? avatarUrl : '/' + avatarUrl)
      : '';
    const canvas = await generateBadgeCanvas({
      name: currentUser.name,
      daysCompleted,
      avatarUrl: fullUrl,
      isFinal,
    });
    wrap.innerHTML = '';
    wrap.appendChild(canvas);

    document.getElementById('downloadBadgeBtn').onclick = () => {
      downloadCanvas(canvas, `huy-hieu-${currentUser.name.replace(/\s+/g, '-')}-${daysCompleted}ngay.png`);
    };
    document.getElementById('shareBadgeBtn').onclick = () => shareCanvas(canvas, currentUser.name);
  };

  // Phần upload avatar nếu chưa có
  const avatarArea = document.getElementById('avatarUploaderArea');
  const hasAvatar = !!(await getAvatarUrl());
  if (!hasAvatar) {
    avatarArea.innerHTML = `
      <div class="avatar-uploader">
        <p style="margin-bottom: 10px; color: var(--gray-700);">Tải ảnh đại diện để xuất hiện trên huy hiệu (khuyến nghị):</p>
        <label class="avatar-uploader-label" for="avatarFile">📷 Chọn ảnh</label>
        <input type="file" id="avatarFile" accept="image/*" />
      </div>
    `;
    document.getElementById('avatarFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        avatarArea.innerHTML = '<p style="padding: 14px; color: var(--gray-600);">Đang tải lên...</p>';
        const dataUrl = await uploadAvatar(file);
        currentUser.avatarDataUrl = dataUrl;
        avatarArea.innerHTML = `<div class="avatar-uploader"><div class="avatar-preview-circle" style="background-image:url('${dataUrl}')"></div><p style="color: var(--green-700); font-weight:600;">✓ Đã lưu ảnh đại diện</p></div>`;
        await renderBadge();
      } catch (err) {
        avatarArea.innerHTML = `<p style="color:var(--danger); padding: 10px;">Lỗi: ${err.message}</p>`;
      }
    });
  }

  await renderBadge();

  // Quà tặng đặc biệt cuối chương trình
  if (isFinal) {
    try {
      const r = await fetch(`${BACKEND_URL}?action=settings_get`);
      const j = await r.json();
      if (j.ok && j.settings) {
        const s = j.settings;
        const gArea = document.getElementById('finalGiftArea');
        gArea.innerHTML = `
          <div class="gift-card">
            <h3>${s.gift_title || ''}</h3>
            <p>${s.gift_description || ''}</p>
            ${s.gift_image ? `<img src="${s.gift_image.startsWith('http') ? s.gift_image : '/' + s.gift_image}" alt="Quà tặng" />` : ''}
            ${s.gift_link ? `<a href="${s.gift_link}" target="_blank" rel="noopener" class="btn btn-primary">🎁 Nhận quà ngay</a>` : ''}
          </div>
        `;
      }
    } catch (e) {}
  }

  document.getElementById('closeBadgeBtn').onclick = () => overlay.remove();
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
