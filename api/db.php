<?php
require_once __DIR__ . '/config.php';

function getDb() {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
          PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES   => false,
        ]
      );
    } catch (PDOException $e) {
      jsonResponse(['ok' => false, 'error' => 'DB connection failed: ' . $e->getMessage()], 500);
    }
  }
  return $pdo;
}

function jsonResponse($data, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function getPostData() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) $data = [];
  return array_merge($data, $_POST);
}

function checkAdmin($pwd) {
  return is_string($pwd) && hash_equals(ADMIN_PASSWORD, $pwd);
}
