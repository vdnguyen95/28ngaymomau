const USERS_KEY = "momau28_users_v1";
const SESSION_KEY = "momau28_session_v1";
const VIEWS_KEY = "momau28_views_v1";
const CONTACTS_KEY = "momau28_zalo_contacts_v1";
const PROGRAM_NAME = "28 ngày giảm mỡ máu cùng dược sĩ Đạt";
const ADMIN_ZALO = "0916839623";

// =========================================================================
// BACKEND: Google Apps Script Web App URL
// Sau khi deploy backend-google-apps-script.gs, dán URL vào đây.
// Để TRỐNG nếu chưa có backend (sẽ chỉ chạy ở chế độ localStorage cũ).
// =========================================================================
const BACKEND_URL = "";  // Ví dụ: "https://script.google.com/macros/s/AKfycb.../exec"
const BACKEND_ADMIN_KEY = "duocsidat-admin-2026"; // PHẢI khớp ADMIN_KEY trong file .gs

// =========================================================================
// CẤU HÌNH GETRESPONSE - chọn 1 trong 2 cách:
//
// CÁCH A (gọi trực tiếp từ trình duyệt – nhanh, KHÔNG AN TOÀN vì lộ API key):
//   - Điền GR_API_KEY và GR_CAMPAIGN_ID
//   - Bỏ trống GR_WEBHOOK_URL
//
// CÁCH B (an toàn – qua backend proxy / webhook bạn tự dựng):
//   - Điền GR_WEBHOOK_URL (URL Cloudflare Workers / Vercel / Apps Script)
//   - Backend nhận POST { name, email, phone, program } và gọi GetResponse
//   - Có thể bỏ trống GR_API_KEY, GR_CAMPAIGN_ID
//
// Nếu cả 2 đều rỗng, email sẽ chỉ được lưu cục bộ và đưa vào tin nhắn Zalo.
// =========================================================================
const GR_API_KEY = "";          // Ví dụ: "abc123..."  (KHÔNG khuyến nghị nhúng vào trang public)
const GR_CAMPAIGN_ID = "";      // Ví dụ: "AbC1d"  – ID list / campaign trong GetResponse
const GR_WEBHOOK_URL = "";      // Ví dụ: "https://your-worker.workers.dev/subscribe"  – ưu tiên cách này

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
  loginForm: document.getElementById("loginForm"),
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
function login(name, phone, email) {
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
  } else {
    if (user.name !== name.trim()) user.name = name.trim();
    if (cleanEmail && user.email !== cleanEmail) user.email = cleanEmail;
    if (!user.email && cleanEmail) user.email = cleanEmail;
    if (!user.submissions) user.submissions = {};
    if (!user.history) user.history = [];
  }
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, phone);
  currentUser = user;

  // Đồng bộ email vào GetResponse (chạy nền, không chặn UX)
  if (cleanEmail) {
    syncToGetResponse({ name: user.name, email: cleanEmail, phone, program: PROGRAM_NAME });
  }

  // Đồng bộ đăng ký vào backend (Google Sheets)
  syncToBackend("register", { name: user.name, phone: user.phone, email: cleanEmail });

  showApp();
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  el.app.classList.add("hidden");
  el.loginScreen.classList.remove("hidden");
  el.loginForm.reset();
  el.loginError.classList.add("hidden");
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
  const lesson = LESSONS[day - 1];

  el.welcome.classList.add("hidden");
  el.quizView.classList.add("hidden");
  el.historyView.classList.add("hidden");
  el.lessonView.classList.remove("hidden");

  const submitted = !!currentUser.submissions[day];
  el.lessonView.innerHTML = `
    <div class="lesson-header">
      <span class="lesson-day">Ngày ${lesson.day} / 28</span>
      <h2>${lesson.title}</h2>
      <p class="lesson-subtitle">${lesson.subtitle}</p>
    </div>
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

// ---------- Event binding ----------
el.loginForm.addEventListener("submit", (e) => {
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
  el.loginError.classList.add("hidden");
  openZaloConfirm(name, phone, email);
});

// ---------- Xác nhận đăng ký qua Zalo ----------
function buildRegistrationMessage(name, phone, email) {
  const lines = [
    "XÁC NHẬN ĐĂNG KÝ",
    `Tên: ${name}`,
    `Số điện thoại: ${phone}`,
  ];
  if (email && email.trim()) lines.push(`Email: ${email.trim()}`);
  lines.push(`Đăng ký chương trình: ${PROGRAM_NAME}`);
  return lines.join("\n");
}

// ---------- Đồng bộ GetResponse ----------
async function syncToGetResponse(data) {
  // Cách B: webhook backend (an toàn, được ưu tiên)
  if (GR_WEBHOOK_URL) {
    try {
      const res = await fetch(GR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) console.warn("[GetResponse webhook]", res.status, await res.text());
      else console.log("[GetResponse webhook] OK");
    } catch (e) {
      console.warn("[GetResponse webhook] error", e);
    }
    return;
  }

  // Cách A: gọi trực tiếp API GetResponse từ trình duyệt
  if (GR_API_KEY && GR_CAMPAIGN_ID) {
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
          campaign: { campaignId: GR_CAMPAIGN_ID },
          customFieldValues: [
            // Nếu bạn đã tạo custom field "phone" trong GetResponse, có thể bật:
            // { customFieldId: "<id>", value: [data.phone] }
          ],
        }),
      });
      if (!res.ok) console.warn("[GetResponse API]", res.status, await res.text());
      else console.log("[GetResponse API] đã thêm contact");
    } catch (e) {
      console.warn("[GetResponse API] error", e);
    }
    return;
  }

  // Không có cấu hình – chỉ ghi log
  console.info("[GetResponse] chưa cấu hình API key/webhook – bỏ qua đồng bộ.");
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

function openZaloConfirm(name, phone, email) {
  const message = buildRegistrationMessage(name, phone, email);
  const modal = document.getElementById("zaloModal");
  const msgEl = document.getElementById("zaloMessage");
  const openZaloBtn = document.getElementById("openZaloBtn");
  const confirmSentBtn = document.getElementById("confirmSentBtn");
  const cancelBtn = document.getElementById("cancelZaloBtn");
  const copyBtn = document.getElementById("copyMsgBtn");

  msgEl.textContent = message;
  openZaloBtn.href = `https://zalo.me/${ADMIN_ZALO}`;

  modal.classList.remove("hidden");

  // Tự động copy ngay khi mở modal
  copyToClipboard(message).then((ok) => {
    if (ok) showCopyToast("Đã sao chép tin nhắn vào bộ nhớ");
  });

  const close = () => {
    modal.classList.add("hidden");
    openZaloBtn.onclick = null;
    confirmSentBtn.onclick = null;
    cancelBtn.onclick = null;
    copyBtn.onclick = null;
  };

  copyBtn.onclick = async () => {
    const ok = await copyToClipboard(message);
    showCopyToast(ok ? "Đã sao chép tin nhắn" : "Không sao chép được, vui lòng copy thủ công");
  };

  openZaloBtn.onclick = () => {
    // Copy lại ngay khi bấm mở Zalo để chắc chắn clipboard có tin nhắn
    copyToClipboard(message);
    // Ghi nhận lần liên hệ Zalo (nguồn từ form đăng ký)
    const list = loadContacts();
    list.push({ at: Date.now(), source: "register", name, phone });
    saveContacts(list);
    syncToBackend("event", { type: "zalo_contact", name, phone, detail: "register" });
  };

  confirmSentBtn.onclick = () => {
    close();
    // Đăng nhập/tạo tài khoản sau khi người dùng xác nhận đã gửi tin nhắn
    login(name, phone, email);
  };

  cancelBtn.onclick = close;
}

function showLoginError(msg) {
  el.loginError.textContent = msg;
  el.loginError.classList.remove("hidden");
}

el.logoutBtn.addEventListener("click", logout);
el.historyBtn.addEventListener("click", openHistory);
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

// ---------- Backend sync (Google Apps Script) ----------
async function syncToBackend(action, data) {
  if (!BACKEND_URL) return; // chưa cấu hình backend → bỏ qua
  try {
    // text/plain để tránh CORS preflight với Apps Script
    await fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...data }),
    });
  } catch (e) {
    console.warn("[backend sync]", action, e);
  }
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

// ---------- ADMIN DASHBOARD ----------

async function renderAdmin() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.add("hidden");
  const adminEl = document.getElementById("adminScreen");
  adminEl.classList.remove("hidden");
  if (zaloFab) zaloFab.style.display = "none";

  // Cố gắng đọc dữ liệu từ backend trước; nếu không có thì rơi về localStorage
  let allUsers, views, contacts, fromBackend = false;
  if (BACKEND_URL) {
    try {
      document.getElementById("adminStats").innerHTML = `<div class="admin-stat"><div class="label">Đang tải dữ liệu từ backend...</div></div>`;
      const r = await fetch(`${BACKEND_URL}?key=${encodeURIComponent(BACKEND_ADMIN_KEY)}`);
      const j = await r.json();
      if (j.ok) {
        fromBackend = true;
        allUsers = (j.users || []).map((u) => ({
          name: u.Name,
          phone: u.Phone,
          email: u.Email,
          createdAt: u.CreatedAt ? new Date(u.CreatedAt).getTime() : 0,
          lastSeen: u.LastSeen ? new Date(u.LastSeen).getTime() : 0,
          currentDay: u.CurrentDay || 1,
          completed: Array.from({ length: u.CompletedCount || 0 }, (_, i) => i + 1),
          submissions: {},
          history: [{ at: u.LastSeen ? new Date(u.LastSeen).getTime() : 0 }],
        }));
        views = j.views || 0;
        contacts = (j.events || [])
          .filter((e) => e.Type === "zalo_contact")
          .map((e) => ({
            at: e.Time ? new Date(e.Time).getTime() : 0,
            source: e.Detail,
            name: e.Name,
            phone: e.Phone,
          }));
      } else {
        throw new Error(j.error || "Không lấy được dữ liệu");
      }
    } catch (e) {
      console.warn("[admin] Fallback localStorage:", e);
    }
  }
  if (!fromBackend) {
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
    `<div class="admin-source-tag">${fromBackend ? "🟢 Đang đọc từ Google Sheets backend" : "🟡 Đang đọc từ localStorage (chưa kết nối backend)"}</div>` +
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

  // Nút làm mới
  document.getElementById("refreshAdminBtn").onclick = renderAdmin;

  // Xuất CSV
  document.getElementById("exportCsvBtn").onclick = () => exportCsv(allUsers, contacts);
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
}
