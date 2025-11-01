<?php
/**
 * core/log.php
 *
 * by shakeFlat design intent,
 * In most cases where an error occurs in the process of processing one web page, it is based on the fact that the process ends after outputting an appropriate error screen.
 * Conversely, most of the logs written without terminating the process will be for debugging purposes.
 * The log class of shakeFlat provides three methods. debug, error, exit.
 * Debug and error end their role by writing logs to their respective log levels. However, exit terminates the process after writing a log.
 *
 * Refactored to be independent from Template and Translation classes.
 * Logs are now accumulated in internal variables and can be retrieved for processing.
 */

namespace shakeFlat;
use \DateTime;
use \DateTimeZone;

// Log class in shakeFlat framework
// It can be used alone or as a parent class.
// Here, only two log levels of error and debug are used. In case of exit and system, the error level is used.
class L
{
    private static $pendingLogs = array();  // Accumulated logs waiting to be processed

    private static function logInstance()
    {
        static $log = null;
        if ($log) return $log;
        $log = new Log();
        return $log;
    }

    public static function defaultErrorMessage($message = null)
    {
        static $msg = "Oops!! An error has occurred. Engineers comparable to advanced AI are working hard to fix it. We won't let you down!!";
        if ($message !== null) $msg = $message;
        return $msg;
    }

    // Get all pending logs for processing
    public static function getPendingLogs()
    {
        return self::$pendingLogs;
    }

    // Clear pending logs after processing
    public static function clearPendingLogs()
    {
        self::$pendingLogs = array();
    }

    // Add a log entry to the pending logs
    public static function addPendingLog($type, $message, $context = array(), $code = -1, $errUrl = null)
    {
        self::$pendingLogs[] = array(
            'type' => $type,
            'message' => $message,
            'context' => $context,
            'code' => $code,
            'errUrl' => $errUrl,
            'timestamp' => microtime(true)
        );
    }

    // PSR-3 LogLevel methods - using common logging method
    private static function _logWithLevel($level, $message, $context = array(), $exception = null)
    {
        if ($level === 'debug' && is_array($message)) {
            $message = print_r($message, true);
        }
        list($message, $context) = self::_shakeMsgContext($message, $context, $exception);
        return self::logInstance()->$level($message, $context);
    }

    public static function emergency($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('emergency', $message, $context, $exception);
    }

    public static function alert($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('alert', $message, $context, $exception);
    }

    public static function critical($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('critical', $message, $context, $exception);
    }

    public static function error($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('error', $message, $context, $exception);
    }

    public static function warning($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('warning', $message, $context, $exception);
    }

    public static function notice($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('notice', $message, $context, $exception);
    }

    public static function info($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('info', $message, $context, $exception);
    }

    public static function debug($message, $context = array(), $exception = null)
    {
        return self::_logWithLevel('debug', $message, $context, $exception);
    }

    // Remove _terminate method as it's moved to short_fnc.php
    // Translation handling is also removed from this class

    // Writes a trace and, if there is an exception error, adds it to the context.
    private static function _shakeMsgContext($message, $context = array(), $exception = null)
    {
        if (SHAKEFLAT_ENV["log"]["include_parameter"] ?? false) {
            $params = array();
            $parseUrl = parse_url($_SERVER["REQUEST_URI"] ?? 0);
            if (isset($parseUrl["query"])) parse_str($parseUrl["query"], $params);
            if ($_POST) $params = array_merge($params, $_POST);
            $context["parameters"] = $params;

            if ($_FILES) $context["file_upload"] = array_keys($_FILES);
        }

        if (SHAKEFLAT_ENV["log"]["include_trace"] ?? false) {
            $backtrace = debug_backtrace();
            $traceLog = array();
            foreach($backtrace as $bt) {
                if (($bt["class"] ?? "") == "shakeFlat\L") continue;
                if (($bt["file"] ?? "") == "") continue;

                if (SHAKEFLAT_ENV["log"]["trace_short"] ?? false) {
                    $traceLog[] = $bt["file"] . ":" . ($bt["line"] ?? -1);
                } else {
                    $traceLog[] = array (
                        "file"      => $bt["file"],
                        "line"      => $bt["line"] ?? -1,
                        "function"  => str_replace(array("sfErrorHandlerShutdown", "sfErrorHandler"), "", $bt["function"]) ?? "",
                        "class"     => $bt["class"] ?? "",
                    );
                }
            }
            if ($traceLog) $context["trace"] = $traceLog;
        }

        if (SHAKEFLAT_ENV["log"]["include_query"] ?? false) {
            $queries = LogQuery::list();
            if ($queries) $context["query"] = $queries;
        }

        if ($exception !== null) $context["exception"] = $exception;
        return array($message, $context);
    }
}

// A simple class based on PSR3 (https://www.php-fig.org/psr/psr-3/)
class Log
{
    public function emergency($message, $context = array()) { return $this->_log(LogLevel::EMERGENCY, $message, $context); }
    public function alert($message, $context = array())     { return $this->_log(LogLevel::ALERT, $message, $context); }
    public function critical($message, $context = array())  { return $this->_log(LogLevel::CRITICAL, $message, $context); }
    public function error($message, $context = array())     { return $this->_log(LogLevel::ERROR, $message, $context); }
    public function warning($message, $context = array())   { return $this->_log(LogLevel::WARNING, $message, $context); }
    public function notice($message, $context = array())    { return $this->_log(LogLevel::NOTICE, $message, $context); }
    public function info($message, $context = array())      { return $this->_log(LogLevel::INFO, $message, $context); }
    public function debug($message, $context = array())     { return $this->_log(LogLevel::DEBUG, $message, $context); }

    public function query($message, $context = array())     { return $this->_log(LogLevel::DEBUG, $message, $context, true); }

    // Format log message
    private function formatLogMessage($time, $level, $message, $context)
    {
        if ((SHAKEFLAT_ENV["log"]["json_format"] ?? false)) {
            return json_encode(array(
                "datetime"  => $time,
                "level"     => $level,
                "message"   => $message,
                "context"   => $context,
            ), JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
        } else {
            $delimiter = SHAKEFLAT_ENV["log"]["delimiter"] ?? "\t";
            if ($delimiter == "\\t") $delimiter = "\t";
            $context_str = json_encode($context, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
            return "{$time}{$delimiter}{$level}{$delimiter}{$message}{$delimiter}{$context_str}";
        }
    }

    // Get formatted timestamp
    private function getTimestamp()
    {
        $date = new DateTime('now', new DateTimeZone(SHAKEFLAT_ENV["log"]["timezone"] ?? SHAKEFLAT_ENV["config"]["php_timezone"] ?? date_default_timezone_get()));
        return $date->format('Y-m-d\TH:i:sP');     // W3C style
    }

    // Get log file path and name
    private function getLogPath($filePrefix = 'log')
    {
        __sfConfig__checkStorage();
        $gpath = GPath::getInstance();
        $logPath = $gpath->STORAGE . trim(SHAKEFLAT_ENV["storage"]["log_path"], " /") . "/";
        if (IS_CLI) {
            $logFile = "{$filePrefix}-cli-".date("Ymd").".log";
        } else {
            $logFile = "{$filePrefix}-".date("Ymd").".log";
        }
        return array($logPath, $logFile);
    }

    // If an Exception object is passed to the context data, it must be in the 'exception' key
    private function _log($logLevel, $message, $context = array())
    {
        list($logPath, $logFile) = $this->getLogPath('log');
        $message = $this->interpolate($message, $context);
        $time = $this->getTimestamp();
        $level = strtoupper($logLevel);
        $logMsg = $this->formatLogMessage($time, $level, $message, $context);

        error_log($logMsg . "\n", 3, $logPath . $logFile);
        __Log_Delete();

        return array("message" => $message, "context" => $context);
    }

    private function interpolate($message, $context = array())
    {
        // build a replacement array with braces around the context keys
        $replace = array();
        foreach ($context as $key => $val) {
            // check that the value can be casted to string
            if (!is_array($val) && (!is_object($val) || method_exists($val, '__toString'))) {
                $replace["{" . $key . '}'] = $val;
            }
        }

        // interpolate replacement values into the message and return
        return strtr($message, $replace);
    }
}

// log level list (PSR3 recommendation)
class LogLevel
{
    const EMERGENCY = 'emergency';
    const ALERT     = 'alert';
    const CRITICAL  = 'critical';
    const ERROR     = 'error';
    const WARNING   = 'warning';
    const NOTICE    = 'notice';
    const INFO      = 'info';
    const DEBUG     = 'debug';
}

// Saves all executed SQL query statements. It is recorded in the log according to the config settings.
class LogQuery
{
    private static $queryStack = array();

    /**
     * Format SQL query by replacing bind parameters with their values
     * For logging and debugging purposes only
     * @param string $sql SQL query string
     * @param array|null $bind Bind parameters (supports both named and positional binding)
     * @return string Formatted SQL query
     */
    private static function formatQuery($sql, $bind)
    {
        // Normalize whitespace - remove extra spaces and newlines
        $lines = explode("\n", $sql);
        $normalized = array();
        foreach($lines as $line) {
            $normalized[] = trim($line, " \r\t");
        }
        $sql = trim(implode(" ", $normalized));

        // Replace bind parameters with values
        if ($bind && is_array($bind)) {
            // Check if it's positional binding (indexed array) or named binding (associative array)
            $isPositional = array_keys($bind) === range(0, count($bind) - 1);

            if ($isPositional) {
                // Positional binding: replace ? placeholders sequentially
                foreach($bind as $value) {
                    $displayValue = self::formatBindValue($value);
                    // Replace first occurrence of ?
                    $pos = strpos($sql, '?');
                    if ($pos !== false) {
                        $sql = substr_replace($sql, $displayValue, $pos, 1);
                    }
                }
            } else {
                // Named binding: replace :placeholder with values
                foreach($bind as $key => $value) {
                    $placeholder = (substr($key, 0, 1) !== ":") ? ":" . $key : $key;
                    $displayValue = self::formatBindValue($value);
                    $sql = str_replace($placeholder, $displayValue, $sql);
                }
            }
        }

        return $sql;
    }

    /**
     * Format bind value for display in SQL query
     * @param mixed $value Bind parameter value
     * @return string Formatted value
     */
    private static function formatBindValue($value)
    {
        if (is_null($value)) {
            return "NULL";
        } elseif (is_bool($value)) {
            return $value ? "TRUE" : "FALSE";
        } elseif (is_string($value)) {
            return "'" . addslashes($value) . "'";
        } else {
            return $value;
        }
    }

    /**
     * Write query to dedicated query log file
     * @param string $sql Formatted SQL query
     */
    private static function writeToFile($sql, $level = LogLevel::INFO)
    {
        __sfConfig__checkStorage();

        $gpath = GPath::getInstance();
        $logPath = $gpath->STORAGE . trim(SHAKEFLAT_ENV["storage"]["log_path"], " /") . "/";
        $logFile = IS_CLI ? "query-cli-" . date("Ymd") . ".log" : "query-" . date("Ymd") . ".log";

        $date = new DateTime('now', new DateTimeZone(
            SHAKEFLAT_ENV["log"]["timezone"] ??
            SHAKEFLAT_ENV["config"]["php_timezone"] ??
            date_default_timezone_get()
        ));
        $timestamp = $date->format('Y-m-d\TH:i:sP');

        $level = strtoupper($level);

        if (SHAKEFLAT_ENV["log"]["json_format"] ?? false) {
            $logMsg = json_encode(array(
                "datetime"  => $timestamp,
                "level"     => $level,
                "message"   => $sql,
            ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } else {
            $delimiter = SHAKEFLAT_ENV["log"]["delimiter"] ?? "\t";
            $delimiter = ($delimiter === "\\t") ? "\t" : $delimiter;
            $logMsg = "{$timestamp}{$delimiter}{$level}{$delimiter}{$sql}";
        }

        error_log($logMsg . "\n", 3, $logPath . $logFile);
        __Log_Delete();
    }

    /**
     * Add query to stack and optionally log to file
     * @param string $sql SQL query string
     * @param array|null $bind Bind parameters
     * @return string Formatted SQL query
     */
    public static function stack($sql, $bind = null, $level = LogLevel::INFO)
    {
        $formattedSql = self::formatQuery($sql, $bind);

        // Add to stack for context logging (used in error messages)
        self::$queryStack[] = $formattedSql;

        // Write to dedicated query log file if query logging is enabled
        if (SHAKEFLAT_ENV["log"]["query_logging"] ?? false) {
            self::writeToFile($formattedSql, $level);
        }

        return $formattedSql;
    }

    /**
     * Get all stacked queries for context (e.g., error logging)
     * @return array List of executed queries
     */
    public static function list()
    {
        return self::$queryStack;
    }

    /**
     * Clear query stack (useful for testing or long-running processes)
     */
    public static function clear()
    {
        self::$queryStack = array();
    }
}

function __Log_Delete()
{
    if ((SHAKEFLAT_ENV["log"]["log_retention_days"] ?? 0) <= 0) return;

    $gpath = GPath::getInstance();
    $logPath = $gpath->STORAGE . trim(SHAKEFLAT_ENV["storage"]["log_path"], " /") . "/";

    // Delete old log files
    $logTypes = array('log', 'query');
    foreach ($logTypes as $type) {
        $files = glob($logPath . "{$type}-*.log");
        foreach ($files as $file) {
            if (filemtime($file) < strtotime("-" . SHAKEFLAT_ENV["log"]["log_retention_days"] . " days")) {
                unlink($file);
                //echo "Deleted: $file\n";
            }
        }
    }
}

