<?php
/**
 * FileWriter - 파일 생성 및 저장
 */

namespace ShakeFlat\Generator;

class FileWriter
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    /**
     * 생성된 코드를 파일로 저장
     */
    public function write(array $code, bool $autoYes = false): void
    {
        foreach ($this->config['paths'] as $key => $path) {
            if (!isset($code[$key])) {
                continue;
            }

            // 디렉토리 생성
            $dir = dirname($path);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            // 파일 존재 확인
            if (file_exists($path)) {
                if ($autoYes) {
                    echo "⚠ 파일이 이미 존재합니다: {$path} (자동 덮어쓰기)\n";
                } else {
                    echo "\n⚠ 파일이 이미 존재합니다: {$path}\n";
                    echo "덮어쓰시겠습니까? [y/N]: ";
                    $input = strtolower(trim(fgets(STDIN)));

                    if (!in_array($input, ['y', 'yes', 'ㅛ', '예'])) {
                        echo "→ 건너뜁니다.\n";
                        continue;
                    }
                }
            }

            // 파일 저장
            file_put_contents($path, $code[$key]);
            echo "✓ 생성됨: {$path}\n";
        }
    }
}
