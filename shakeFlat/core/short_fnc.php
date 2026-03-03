<?php
/**
 * libs\short_fnc.php
 *
 * Define frequently used method (in class) as a global function.
 * It will mainly be used in templates.
 */

function sfCSSJSVer()
{
    if (IS_DEBUG) return time();
    return SHAKEFLAT_ENV["config"]["jscss_version"] ?? 100;
}

function sfUnitFormatNumber($n, $isskip1000 = false)
{
    return shakeFlat\Util::unitFormatNumber($n, $isskip1000);
}

function sfKoreanJosa($ex)
{
    return shakeFlat\Util::koreanJosa($ex);
}

function sfNumberKorean($num)
{
    return shakeFlat\Util::numberKorean($num);
}

function sfTimeDiffMinSec($t1, $t2, $isKorean = true)
{
    return shakeFlat\Util::timeDiffMinSec($t1, $t2, $isKorean);
}

function sfTimeDiffPretty($time, $postTime = null, $isKorean = true)
{
    return shakeFlat\Util::timeDiffPretty($time, $postTime, $isKorean);
}

function sfValidateDate($date, $format = null)
{
    return shakeFlat\Util::validateDate($date, $format);
}

function sfValidateDateTime($date, $format = null)
{
    return shakeFlat\Util::validateDateTime($date, $format);
}

function sfYmdHis($date, $format = null)
{
    return shakeFlat\Util::YmdHis($date, $format);
}

function sfNumberFormatX($p, $c = "")
{
    return shakeFlat\Util::number_formatX($p, $c);
}

function sfCutString($p, $l, $with3Dot = true)
{
    return shakeFlat\Util::cutString($p, $l, $with3Dot);
}

function sfWebDump($p, $fontSize = 10)
{
    shakeFlat\Util::webDump($p, $fontSize);
}

function sfDebug($p, $c = array())
{
    shakeFlat\L::debug($p, $c);
}

// The mode defined in shakeFlat\Response is provided as a simple function.
function sfModeWEB()
{
    $template = shakeFlat\Template::getInstance();
    $template->setMode(shakeFlat\Template::MODE_WEB);
}

function sfModeAjax()
{
    $template = shakeFlat\Template::getInstance();
    $template->setMode(shakeFlat\Template::MODE_AJAX);
}

function sfIsAjax()
{
    $template = shakeFlat\Template::getInstance();
    return $template->isAjax();
}

function sfModeAjaxForDatatable()
{
    $template = shakeFlat\Template::getInstance();
    $template->setMode(shakeFlat\Template::MODE_AJAX_FOR_DATATABLE);
}

function sfModeAPI()
{
    $template = shakeFlat\Template::getInstance();
    $template->setMode(shakeFlat\Template::MODE_API);
}

function sfModeAPIEncrypt()
{
    $template = shakeFlat\Template::getInstance();
    $template->setMode(shakeFlat\Template::MODE_API_ENCRYPT);
}

function sfModeAPIEncryptZip()
{
    $template = shakeFlat\Template::getInstance();
    $template->setMode(shakeFlat\Template::MODE_API_ENCRYPT_ZIP);
}

function sfRedirect($url, $msg = null)
{
    $template = shakeFlat\Template::getInstance();
    $template->setRedirect($url, $msg);
}

// If there is a message delivered when redirecting from the previous page, it is returned.
function sfRedirectMsg()
{
    $cookie = shakeFlat\Cookie::getInstance("_rm_");
    $msg = $cookie->msg;
    if ($msg) return $msg;
    return false;
}

// This command returns the currently set translation language. If no language is set, it will return $default.
function sfLang($default = null)
{
    $lang = shakeFlat\Translation::getInstance()->getTranslationLang();
    if (!$lang) return $default;
    return $lang;
}

// Process accumulated logs with translation and display error, then terminate
// Moved from L::_terminate() to make log.php independent from Template and Translation
function sfLogTerminate($logMsg, $errCode = -1, $errUrl = null)
{
    // Apply translation to the message
    $message = sfLogTranslate($logMsg["message"]);
    $context = $logMsg["context"] ?? array();

    if (SHAKEFLAT_ENV["config"]["display_error"] ?? false) {
        if (SHAKEFLAT_ENV["display_error"]["tracing"] ?? false) {
            $inPos = "";
            if (isset($context["trace"][0]["file"]) && isset($context["trace"][0]["line"])) {
                $inPos = ", passed in {$context["trace"][0]["file"]} on line {$context["trace"][0]["line"]}";
            }
            foreach(($context["trace"] ?? array()) as $errInfo) {
                if (strpos($errInfo["file"], SHAKEFLAT_PATH . "core") === false) {
                    $inPos = ", passed in {$errInfo["file"]} on line {$errInfo["line"]}";
                    break;
                }
            }
            if ($inPos) $message .= $inPos;
        } else {
            $context = null;
        }
    } else {
        $message = sfLogTranslate(shakeFlat\L::defaultErrorMessage());
        $context = null;
    }

    if (shakeFlat\Template::isCreated()) {
        $template = shakeFlat\Template::getInstance();
        $template->displayError($message, $context, $errCode, $errUrl);
    } else {
        if ($errUrl) echo "errorUrl : {$errUrl}<br>\n";
        echo "errorCode : {$errCode}<br>\n";
        echo "errorMessage : {$message}<br>\n";
        sfWebDump($context);
    }

    exit;
}

// Translate log messages using Translation class
// Returns array or string with translations applied
function sfLogTranslate($output)
{
    $translation = shakeFlat\Translation::getInstance();

    // System translation is an independent axis — always apply first (no cache).
    // This handles framework error messages (Param, DB, etc.) regardless of log type.
    if (is_array($output)) {
        $output = json_decode($translation->convertSystemError(json_encode($output, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)), true);
    } else {
        $output = $translation->convertSystemError($output);
    }

    // User-defined translation: use existing translation settings with cache
    $lang = $translation->getTranslationLang();

    if ($lang) {
        if (is_array($output)) {
            $output = json_decode($translation->convert(json_encode($output, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE), $lang), true);
        } else {
            $output = $translation->convert($output, $lang);
        }
        $translation->updateCache($lang);
        return $output;
    }

    if (is_array($output)) {
        return json_decode($translation->passing(json_encode($output, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)), true);
    } else {
        return $translation->passing($output);
    }
}

// Process all pending logs from L class
// Call this function to handle exit/system logs that need termination
function sfProcessPendingLogs()
{
    $pendingLogs = shakeFlat\L::getPendingLogs();

    if (empty($pendingLogs)) return;

    // Process the first termination log found
    foreach ($pendingLogs as $log) {
        if (in_array($log['type'], ['exit', 'exitUrl', 'exitCode', 'system'])) {
            $logMsg = array(
                'message' => $log['message'],
                'context' => $log['context']
            );

            sfLogTerminate($logMsg, $log['code'], $log['errUrl']);      // This function will exit the process
        }
    }

    shakeFlat\L::clearPendingLogs();
}

// Exit functions to replace L class exit methods
// These functions accumulate logs and trigger termination

// shakeFlat framework structure error. App developers will seldom use it.
// Accumulate the log for later processing.
function sfLogSystem($message, $context = array(), $exception = null)
{
    if ($exception !== null) {
        if (!isset($context['exception'])) $context['exception'] = $exception;
    }
    $logMsg = shakeFlat\L::error($message, $context, $exception);
    shakeFlat\L::addPendingLog('system', $logMsg["message"], $logMsg["context"], -1, null);
    sfProcessPendingLogs();
}

// Terminates the process after logging. (exit)
// In general, if a web process (each web page or API) encounters a (severe) error during its operation, all operations are stopped and the process is terminated.
// For reference, when the process is terminated, the open db transaction is automatically rolled back.
function sfLogExit($message, $context = array(), $exception = null)
{
    $logMsg = shakeFlat\L::error($message, $context, $exception);
    shakeFlat\L::addPendingLog('exit', $logMsg["message"], $logMsg["context"], -1, null);
    sfProcessPendingLogs();
}

// After displaying the error message, navigate to $errUrl.
// Used in ajax mode, and the redirection is handled by the caller of the ajax.
function sfLogExitUrl($message, $errUrl, $context = array(), $exception = null)
{
    $logMsg = shakeFlat\L::error($message, $context, $exception);
    shakeFlat\L::addPendingLog('exitUrl', $logMsg["message"], $logMsg["context"], -1, $errUrl);
    sfProcessPendingLogs();
}

// Terminates the process after logging with specific error code.
// In general, if a web process (each web page or API) encounters a (severe) error during its operation, all operations are stopped and the process is terminated.
// For reference, when the process is terminated, the open db transaction is automatically rolled back.
// In addition to $message, displays files and lines where execution is suspended according to config settings.
function sfLogExitCode($message, $code)
{
    $logMsg = shakeFlat\L::error($message, array(), null);
    shakeFlat\L::addPendingLog('exitCode', $logMsg["message"], $logMsg["context"], $code, null);
    sfProcessPendingLogs();
}
