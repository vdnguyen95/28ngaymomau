<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  jsonResponse(['ok' => true]);
}

$action = $_GET['action'] ?? '';
if (!$action) {
  $body = json_decode(file_get_contents('php://input'), true);
  if (is_array($body) && !empty($body['action'])) $action = $body['action'];
}

try {
  switch ($action) {
    case 'register':       handleRegister();      break;
    case 'submission':     handleSubmission();    break;
    case 'event':          handleEvent();         break;
    case 'view':           handleView();          break;
    case 'admin':          handleAdmin();         break;
    case 'lessons':        handleLessons();       break;
    case 'lesson_update':  handleLessonUpdate();  break;
    case 'lesson_delete':  handleLessonDelete();  break;
    default: jsonResponse(['ok' => false, 'error' => 'Unknown action: ' . $action], 400);
  }
} catch (Exception $e) {
  jsonResponse(['ok' => false, 'error' => $e->getMessage()], 500);
}

// =================== HANDLERS ===================

function handleRegister() {
  $d = getPostData();
  if (empty($d['phone'])) jsonResponse(['ok' => false, 'error' => 'Missing phone'], 400);
  $db = getDb();
  $stmt = $db->prepare("SELECT id, name, email FROM users WHERE phone = ?");
  $stmt->execute([$d['phone']]);
  $row = $stmt->fetch();
  if ($row) {
    $db->prepare(
      "UPDATE users
       SET name=COALESCE(NULLIF(?, ''), name),
           email=COALESCE(NULLIF(?, ''), email),
           last_seen=NOW()
       WHERE phone=?"
    )->execute([$d['name'] ?? '', $d['email'] ?? '', $d['phone']]);
  } else {
    $db->prepare("INSERT INTO users (phone, name, email) VALUES (?, ?, ?)")
       ->execute([$d['phone'], $d['name'] ?? '', $d['email'] ?? '']);
  }
  jsonResponse(['ok' => true]);
}

function handleSubmission() {
  $d = getPostData();
  if (empty($d['phone']) || empty($d['day'])) jsonResponse(['ok' => false, 'error' => 'Missing fields'], 400);

  $db = getDb();
  $day = max(1, min(28, intval($d['day'])));
  $mealUrl = saveImageFromBase64($d['mealImage']     ?? '', $d['phone'], $day, 'meal');
  $exUrl   = saveImageFromBase64($d['exerciseImage'] ?? '', $d['phone'], $day, 'exercise');

  $db->prepare("INSERT INTO submissions (phone, day, lesson_title, meal_image, exercise_image) VALUES (?, ?, ?, ?, ?)")
     ->execute([$d['phone'], $day, $d['title'] ?? '', $mealUrl, $exUrl]);

  $stmt = $db->prepare("SELECT completed_days FROM users WHERE phone = ?");
  $stmt->execute([$d['phone']]);
  $row = $stmt->fetch();
  $completed = $row ? (json_decode($row['completed_days'] ?? '[]', true) ?: []) : [];
  if (!in_array($day, $completed)) $completed[] = $day;
  sort($completed);

  $db->prepare("UPDATE users SET current_day = GREATEST(current_day, ?), completed_days = ?, last_seen = NOW() WHERE phone = ?")
     ->execute([min(28, $day + 1), json_encode($completed), $d['phone']]);

  jsonResponse(['ok' => true, 'mealUrl' => $mealUrl, 'exerciseUrl' => $exUrl]);
}

function saveImageFromBase64($dataUrl, $phone, $day, $type) {
  if (empty($dataUrl) || !preg_match('/^data:([^;]+);base64,(.+)$/', $dataUrl, $m)) return '';
  $mime = $m[1];
  $data = base64_decode($m[2]);
  if ($data === false) return '';
  $ext = ($mime === 'image/png') ? 'png' : 'jpg';
  $uploadDir = __DIR__ . '/../uploads/';
  if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
  $filename = preg_replace('/[^0-9]/', '', $phone) . '-d' . $day . '-' . $type . '-' . time() . '.' . $ext;
  if (file_put_contents($uploadDir . $filename, $data) === false) return '';
  return 'uploads/' . $filename;
}

function handleEvent() {
  $d = getPostData();
  $db = getDb();
  $db->prepare("INSERT INTO events (type, phone, name, detail) VALUES (?, ?, ?, ?)")
     ->execute([$d['type'] ?? '', $d['phone'] ?? '', $d['name'] ?? '', $d['detail'] ?? '']);
  jsonResponse(['ok' => true]);
}

function handleView() {
  $db = getDb();
  $db->exec("INSERT INTO stats (key_name, value) VALUES ('views', 1) ON DUPLICATE KEY UPDATE value = value + 1");
  jsonResponse(['ok' => true]);
}

function handleAdmin() {
  $pwd = $_GET['password'] ?? '';
  if (!checkAdmin($pwd)) jsonResponse(['ok' => false, 'error' => 'Sai mật khẩu'], 401);

  $db = getDb();
  $users = $db->query("SELECT * FROM users ORDER BY created_at DESC")->fetchAll();
  foreach ($users as &$u) {
    $arr = json_decode($u['completed_days'] ?? '[]', true);
    $u['completed_days_arr'] = is_array($arr) ? $arr : [];
    $u['completed_count'] = count($u['completed_days_arr']);
  }
  unset($u);

  $submissions = $db->query("SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 500")->fetchAll();
  $events      = $db->query("SELECT * FROM events ORDER BY created_at DESC LIMIT 500")->fetchAll();

  $stmt = $db->query("SELECT value FROM stats WHERE key_name='views'");
  $row = $stmt->fetch();
  $views = $row ? intval($row['value']) : 0;

  jsonResponse([
    'ok' => true,
    'users' => $users,
    'submissions' => $submissions,
    'events' => $events,
    'views' => $views,
  ]);
}

function handleLessons() {
  // Public endpoint: trả về danh sách lesson override (không cần password)
  $db = getDb();
  $rows = $db->query("SELECT day, title, subtitle, body, video_url FROM lesson_content")->fetchAll();
  jsonResponse(['ok' => true, 'lessons' => $rows]);
}

function handleLessonUpdate() {
  $d = getPostData();
  if (!checkAdmin($d['password'] ?? '')) jsonResponse(['ok' => false, 'error' => 'Sai mật khẩu'], 401);
  $day = intval($d['day'] ?? 0);
  if ($day < 1 || $day > 28) jsonResponse(['ok' => false, 'error' => 'Day must be 1-28'], 400);

  $db = getDb();
  $db->prepare(
    "INSERT INTO lesson_content (day, title, subtitle, body, video_url)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        title    = VALUES(title),
        subtitle = VALUES(subtitle),
        body     = VALUES(body),
        video_url= VALUES(video_url)"
  )->execute([
    $day,
    $d['title']    ?? '',
    $d['subtitle'] ?? '',
    $d['body']     ?? '',
    $d['videoUrl'] ?? '',
  ]);
  jsonResponse(['ok' => true]);
}

function handleLessonDelete() {
  $d = getPostData();
  if (!checkAdmin($d['password'] ?? '')) jsonResponse(['ok' => false, 'error' => 'Sai mật khẩu'], 401);
  $day = intval($d['day'] ?? 0);
  if ($day < 1 || $day > 28) jsonResponse(['ok' => false, 'error' => 'Day must be 1-28'], 400);
  getDb()->prepare("DELETE FROM lesson_content WHERE day = ?")->execute([$day]);
  jsonResponse(['ok' => true]);
}
