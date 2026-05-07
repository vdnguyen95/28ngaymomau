<?php
/**
 * MẪU CẤU HÌNH – KHÔNG CHỈNH FILE NÀY.
 * Tạo bản sao tên `config.php` trong cùng thư mục, rồi điền thông tin thật.
 *
 * 1. Vào cPanel iNet → MySQL Databases:
 *    - Create New Database: tên `momau28` (cPanel sẽ đổi thành `<cpaneluser>_momau28`)
 *    - Create New User → đặt mật khẩu
 *    - Add User to Database → tick ALL PRIVILEGES
 * 2. Copy file này thành `config.php` ngay tại thư mục api/
 * 3. Điền 4 dòng dưới đây bằng thông tin DB vừa tạo
 * 4. Truy cập 1 LẦN: https://28ngaymomau.duocsidat.vn/api/setup.php
 *    (sẽ tự tạo các bảng cần thiết)
 * 5. XÓA file setup.php sau khi tạo xong (bảo mật)
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_momau28');     // Đổi
define('DB_USER', 'cpaneluser_momau28');     // Đổi
define('DB_PASS', 'YOUR_DB_PASSWORD_HERE');  // Đổi

// Mật khẩu trang quản trị – đổi ngay khi deploy
define('ADMIN_PASSWORD', 'duocsidat2026');
