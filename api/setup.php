<?php
/**
 * Chạy 1 LẦN sau khi đã điền config.php – tạo các bảng MySQL.
 * Truy cập: https://28ngaymomau.duocsidat.vn/api/setup.php
 *
 * SAU KHI CHẠY XONG, XÓA FILE NÀY ĐỂ AN TOÀN.
 */
require_once __DIR__ . '/db.php';

$db = getDb();

$statements = [
  "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(150),
    current_day INT DEFAULT 1,
    completed_days TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",

  "CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    day INT NOT NULL,
    lesson_title VARCHAR(255),
    meal_image VARCHAR(500),
    exercise_image VARCHAR(500),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_day (phone, day)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",

  "CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    phone VARCHAR(20),
    name VARCHAR(100),
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",

  "CREATE TABLE IF NOT EXISTS stats (
    key_name VARCHAR(50) PRIMARY KEY,
    value INT DEFAULT 0
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",

  "CREATE TABLE IF NOT EXISTS lesson_content (
    day INT PRIMARY KEY,
    title VARCHAR(255),
    subtitle TEXT,
    body LONGTEXT,
    video_url VARCHAR(500),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",

  "CREATE TABLE IF NOT EXISTS program_settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value LONGTEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
];

// Idempotent ALTER TABLE: thêm cột avatar nếu chưa có
try { $db->exec("ALTER TABLE users ADD COLUMN avatar VARCHAR(500)"); $results[] = "✓ Thêm cột avatar vào users"; }
catch (Exception $e) { $results[] = "⊙ Cột avatar đã tồn tại (OK)"; }

// Khởi tạo nội dung quà tặng mặc định nếu chưa có
try {
  $stmt = $db->prepare("INSERT IGNORE INTO program_settings (key_name, value) VALUES (?, ?)");
  $stmt->execute(['gift_title', 'Quà tặng đặc biệt cho học viên hoàn thành 28 ngày']);
  $stmt->execute(['gift_description', 'Chúc mừng bạn đã hoàn thành chương trình! Hãy nhắn Zalo dược sĩ Đạt 0916839623 để nhận quà tặng đặc biệt.']);
  $stmt->execute(['gift_link', '']);
  $stmt->execute(['gift_image', '']);
  $results[] = "✓ Khởi tạo nội dung quà tặng";
} catch (Exception $e) { $results[] = "⊙ Quà tặng đã có (OK)"; }

$results = [];
foreach ($statements as $s) {
  try {
    $db->exec($s);
    $results[] = "✓ OK";
  } catch (Exception $e) {
    $results[] = "✗ " . $e->getMessage();
  }
}

// Tạo thư mục uploads nếu chưa có
$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) {
  mkdir($uploadDir, 0755, true);
  file_put_contents($uploadDir . '/.htaccess', "Options -Indexes\n");
  $results[] = "✓ Tạo thư mục uploads/";
}

?>
<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><title>Setup database</title>
<style>body{font-family:sans-serif;padding:30px;max-width:600px;margin:auto}h1{color:#16a34a}.row{padding:8px 12px;background:#f0fdf4;border-radius:6px;margin:6px 0;font-family:monospace}.warn{background:#fef3c7;color:#92400e;padding:14px;border-radius:8px;margin-top:20px;border-left:4px solid #f59e0b}</style>
</head><body>
<h1>✓ Setup hoàn tất</h1>
<p>Các thao tác:</p>
<?php foreach ($results as $r): ?>
  <div class="row"><?= htmlspecialchars($r) ?></div>
<?php endforeach; ?>
<div class="warn">
  <strong>⚠️ QUAN TRỌNG:</strong> Hãy XÓA file <code>api/setup.php</code> ngay bây giờ
  qua cPanel File Manager để tránh người khác chạy lại.
</div>
<p style="margin-top:20px;"><a href="../">→ Quay lại trang web</a></p>
</body></html>
