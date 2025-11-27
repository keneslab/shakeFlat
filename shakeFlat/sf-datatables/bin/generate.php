#!/usr/bin/env php
<?php
/**
 * ShakeFlat DataTables Code Generator
 *
 * DataTables를 사용하는 PHP + HTML + JavaScript 코드를 자동 생성합니다.
 *
 * Usage:
 *   php generate.php
 *
 * @author ShakeFlat
 * @version 1.0.0
 */

// 오류 표시 설정
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 스크립트 디렉토리 기준 경로 설정
define('GENERATOR_DIR', __DIR__);
define('DATATABLES_DIR', dirname(GENERATOR_DIR));
define('SHAKEFLAT_PATH', dirname(DATATABLES_DIR));

// 클래스 자동 로드
spl_autoload_register(function ($class) {
    $prefix = 'ShakeFlat\\Generator\\';
    $base_dir = GENERATOR_DIR . '/classes/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use ShakeFlat\Generator\ConfigCollector;
use ShakeFlat\Generator\CodeGenerator;
use ShakeFlat\Generator\FileWriter;

// CLI 전용 확인
if (php_sapi_name() !== 'cli') {
    die("This script must be run from the command line.\n");
}

// 옵션 파싱
$options = getopt('y', ['yes']);
$autoYes = isset($options['y']) || isset($options['yes']);

// Config 파일 경로 확인
$configFile = null;
foreach ($argv as $arg) {
    if ($arg !== basename(__FILE__) && !in_array($arg, ['-y', '--yes'])) {
        $configFile = $arg;
        break;
    }
}

if (!$configFile) {
    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║         ShakeFlat DataTables Code Generator v1.0.0         ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    echo "Usage: php generate.php [options] <config-file>\n";
    echo "\n";
    echo "Options:\n";
    echo "  -y, --yes    파일 덮어쓰기 확인을 자동으로 y로 응답\n";
    echo "\n";
    echo "Example:\n";
    echo "  php generate.php members_list.config.php\n";
    echo "  php generate.php -y members_list.config.php\n";
    echo "\n";
    echo "Config 파일 작성 방법:\n";
    echo "  1. config.sample.php 파일을 복사하세요\n";
    echo "  2. 프로젝트에 맞게 설정을 수정하세요\n";
    echo "  3. 이 스크립트로 생성하세요\n";
    echo "\n";
    exit(0);
}

// 메인 실행
try {
    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║         ShakeFlat DataTables Code Generator v1.0.0         ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";

    // 1. Config 파일 로드
    if (!file_exists($configFile)) {
        throw new Exception("Config 파일을 찾을 수 없습니다: {$configFile}");
    }

    $config = require $configFile;

    if (!is_array($config)) {
        throw new Exception("Config 파일이 올바른 형식이 아닙니다. 배열을 반환해야 합니다.");
    }

    echo "✓ Config 파일 로드: {$configFile}\n";

    // 2. Config 검증 및 경로 생성
    $collector = new ConfigCollector();
    $config = $collector->validate($config);

    echo "✓ Config 검증 완료\n";

    // 3. 코드 생성
    $generator = new CodeGenerator($config);
    $code = $generator->generate();

    echo "✓ 코드 생성 완료\n";

    // 4. 파일 저장
    $writer = new FileWriter($config);
    $writer->write($code, $autoYes);

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║                         생성 완료!                         ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    echo "생성된 파일:\n";
    echo "  - Module 파일: " . $config['paths']['module_file'] . "\n";
    echo "  - Template 파일: " . $config['paths']['template_file'] . "\n";
    echo "\n";
    echo "다음 단계:\n";
    echo "  1. 브라우저에서 접속: " . $config['url'] . "\n";
    echo "  2. 필요에 따라 코드 커스터마이징\n";
    echo "\n";

} catch (Exception $e) {
    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║                          오류 발생                         ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "\n";
    exit(1);
}
