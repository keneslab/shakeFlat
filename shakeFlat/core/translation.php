<?php
/**
 * core/translation.php
 *
 * A class that supports language translation when composing a website consisting of two or more languages.
 * Developers can select the language they want to output through the App class.
 * One entire translation file defined in config.ini is required,
 * and translation files for individual web pages and individual languages are created and managed separately internally.
 * These individual translation files are managed using a file system.
 *
 */

namespace shakeFlat;

class Translation
{
    private $status;
    private $cacheTable;
    private $needUpdate;
    private $allTable;
    private $translationLang;
    private $systemTranslationFilePath;
    private $systemTranslationEnabled;
    private $systemTranslationLang;

    public static function getInstance()
    {
        static $instance = null;
        if ($instance) return $instance;
        $instance = new Translation();
        return $instance;
    }

    private function __construct()
    {
        $this->status = false;              // enable/disable status
        $this->needUpdate = false;
        $this->cacheTable = [];
        $this->allTable = [];
        $this->translationLang = null;
        $this->systemTranslationFilePath = __DIR__ . "/system_translation.json";
        $this->systemTranslationEnabled = false;
        $this->systemTranslationLang = null;

        $this->setFilePathTranslation($this->systemTranslationFilePath);
        if (SHAKEFLAT_ENV["path"]["translation_file"] ?? false) $this->setFilePathTranslation(SHAKEFLAT_PATH . trim(SHAKEFLAT_ENV["path"]["translation_file"]));
        if (SHAKEFLAT_ENV["config"]["default_language"] ?? false) $this->setTranslationLang(SHAKEFLAT_ENV["config"]["default_language"]);
    }

    public function enable()
    {
        $this->status = true;
        return $this;
    }

    public function disable()
    {
        $this->status = false;
        return $this;
    }

    private function setFilePathTranslation($filePath)
    {
        try {
            $json = file_get_contents($filePath);
            if ($json !== false) {
                $arr = json_decode($json, true);
                if ($arr) $this->allTable = array_merge($this->allTable, $arr);
            }
        } catch (\Exception $e) {
            sfLogSystem($e->getMessage());
        }
    }

    // If a tag for translation ([:...:]) is applied to the text written in the template, but translation is not desired, this function is called without parameters.
    // If it is called without parameters (when it is called as null ), the passing method of the Translation class is called.
    public function setTranslationLang($lang = null)
    {
        $this->translationLang = $lang;
        return $this;
    }

    public function getTranslationLang()
    {
        return $this->translationLang;
    }

    // --- System Translation (independent from user translation) ---

    public function enableSystemTranslation()
    {
        $this->systemTranslationEnabled = true;
        return $this;
    }

    public function disableSystemTranslation()
    {
        $this->systemTranslationEnabled = false;
        return $this;
    }

    public function isSystemTranslationEnabled()
    {
        return $this->systemTranslationEnabled;
    }

    public function setSystemTranslationLang($lang = null)
    {
        $this->systemTranslationLang = $lang;
        return $this;
    }

    public function getSystemTranslationLang()
    {
        return $this->systemTranslationLang;
    }

    public function convert($output, $lang)
    {
        if (!$this->status) return $this->passing($output); // If translation is disabled, return the original output.
        if (!$output) return "";

        // In the case of debug mode, the cache file is updated every time.
        // If the translation file is modified in the live environment, be sure to delete the cache files.
        if (!IS_DEBUG) {
            $filepath = $this->cacheFilepath($lang);
            if ($filepath) {
                if (file_exists($filepath)) {
                    $json = file_get_contents($filepath);
                    if ($json !== false) {
                        $arr = json_decode($json, true);
                        if ($arr) $this->cacheTable = $arr;
                    }
                }
            }
        }

        // $output은 [:message:] 또는 [:code:message:] 형식이다. 전자라면 code는 "0"으로 간주한다.
        $pattern = '/\[:([a-z0-9]+:)?(.*?)\:\]/';
        preg_match_all($pattern, $output, $matches, PREG_SET_ORDER);
        if ($matches) {
            foreach ($matches as $match) {
                $code = "0";
                if (isset($match[1]) && $match[1]) $code = rtrim($match[1], ":");
                $output = str_replace($match[0], $this->_L($match[2], $code, $lang), $output);
            }
        }
        return $output;
    }

    public function convertSystemError($output, $lang = null)
    {
        if (!$this->systemTranslationEnabled) return $this->passing($output);
        $lang = $lang ?: $this->systemTranslationLang;
        if (!$lang) return $this->passing($output);
        if (!$output) return "";

        $systemTable = $this->loadTranslationTable($this->systemTranslationFilePath);

        $pattern = '/\[:([a-z0-9]+:)?(.*?)\:\]/';
        preg_match_all($pattern, $output, $matches, PREG_SET_ORDER);
        if ($matches) {
            foreach ($matches as $match) {
                $code = "0";
                if (isset($match[1]) && $match[1]) $code = rtrim($match[1], ":");
                $translated = $this->translateFromTable($match[2], $code, $lang, $systemTable, false);
                $output = str_replace($match[0], $translated, $output);
            }
        }

        return $output;
    }

    // Import the original data without translating the content.
    public function passing($output)
    {
        $pattern = '/\[:([a-z0-9]+:)?(.*?)\:\]/';
        preg_match_all($pattern, $output, $matches, PREG_SET_ORDER);
        if ($matches) {
            foreach($matches as $match) {
                // $match[2] contains the message part
                $output = str_replace($match[0], $match[2], $output);
            }
        }
        return $output;
    }

    public function updateCache($lang)
    {
        if (!$this->status) return; // If translation is disabled, do not update the cache.
        if (!$this->needUpdate && !IS_DEBUG) return;

        $filepath = $this->cacheFilepath($lang);
        if ($filepath) {
            $text = json_encode($this->cacheTable, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
            if ($text) {
                $re = file_put_contents($filepath, $text);
                //if ($re === false) $this->error = true;
            }
        }
    }

    private function _L($k, $code, $lang)
    {
        return $this->translateFromTable($k, $code, $lang, $this->allTable, true);
    }

    private function translateFromTable($k, $code, $lang, $table, $useCache)
    {
        if ($useCache && !IS_DEBUG && isset($this->cacheTable[$k][$code][$lang])) {
            return $this->cacheTable[$k][$code][$lang];
        }

        $re = $k;
        if (!IS_DEBUG && isset($table[$k][$code][$lang])) {
            $re = $table[$k][$code][$lang];
        } else {
            foreach($table as $str => $arr) {
                $str = str_replace(array("/", ")", "(", ","), array("\/", "\)", "\(", "\,"), $str);
                $str = str_replace(array("$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9"), "([a-zA-Z0-9,\/ \(\)-_]*)", $str);
                $reg = preg_match_all("/^{$str}$/", $k, $match);
                if (isset($match[0]) && $match[0] && isset($arr[$code][$lang])) {
                    $re = $arr[$code][$lang];
                    for($i=1;$i<=9;$i++) {
                        if (isset($match[$i][0])) {
                            $re = str_replace("$".$i, $match[$i][0], $re);
                        }
                    }
                    break;
                }
            }
        }

        if ($useCache) {
            $this->cacheTable[$k][$code][$lang] = $re;
            $this->needUpdate = true;
        }

        return $re;
    }

    private function loadTranslationTable($filePath)
    {
        $json = @file_get_contents($filePath);
        if ($json === false) return [];

        $arr = json_decode($json, true);
        if (!is_array($arr)) return [];

        return $arr;
    }

    private function cacheFilepath($lang)
    {
        __sfConfig__checkStorage();

        $gpath = GPath::getInstance();
        if (!isset(SHAKEFLAT_ENV["storage"]["translation_cache"])) return false;

        $cachePath = rtrim($gpath->STORAGE . SHAKEFLAT_ENV["storage"]["translation_cache"], " /") . "/";

        if (!is_dir($cachePath)) if (!mkdir($cachePath, 0775, true)) return false;
        if (!is_writable($cachePath)) return false;

        $router = Router::getInstance();
        return $cachePath . str_replace("/", ".", "{$router->module()}/{$router->fnc()}") . ".{$lang}.json";
    }
}
