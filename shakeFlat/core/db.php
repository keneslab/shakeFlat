<?php
/**
 * core/db.php
 *
 * database handling class
 */

namespace shakeFlat;
use shakeFlat\L;
use \PDO;
use \Exception;

class TransactionDBList
{
    private $transactionDBList = array();

    public static function getInstance()
    {
        static $oInstance = null;
        if ($oInstance === null) $oInstance = new TransactionDBList();
        return $oInstance;
    }

    private function __construct()
    {
        $this->transactionDBList = array();
    }

    public function add($connectionName)
    {
        $this->transactionDBList[] = $connectionName;
    }

    public function list()
    {
        return $this->transactionDBList;
    }
}

class DB
{
    private $dbh = null;
    private $errInfo = array();
    private $dbsys = "mysql";       // Database product types for DSN

    public static function getInstance($connectionName = "default")
    {
        static $oInstance = array();
        if (isset($oInstance[$connectionName])) return $oInstance[$connectionName];
        $oInstance[$connectionName] = new DB($connectionName);
        return $oInstance[$connectionName];
    }

    private function __construct($connectionName)
    {
        if (!isset(SHAKEFLAT_ENV["database"]["connection"][$connectionName])) sfLogSystem("[:DB connection information is not defined in config.ini.:]", array( "connection" => $connectionName ));
        $connInfo = SHAKEFLAT_ENV["database"]["connection"][$connectionName][rand(0, count(SHAKEFLAT_ENV["database"]["connection"][$connectionName])-1)];

        if(isset(SHAKEFLAT_ENV["database"]["common"])) {
            foreach(SHAKEFLAT_ENV["database"]["common"] as $k => $v) {
                if (!isset($connInfo[$k])) $connInfo[$k] = $v;
            }
        }

        $this->dbh = $this->pdoConnection($connInfo);
    }

    public function dbSystem() { return $this->dbsys; }

    private function pdoConnection($connInfo)
    {
        try {
            $dsn    = trim($connInfo["dsn"], " ;");
            $user   = $connInfo["user"];
            $passwd = $connInfo["passwd"];

            $options = array(
                PDO::ATTR_ERRMODE           => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES  => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            );

            if (stripos($dsn, "sqlsrv") !== false) {
                $this->dbsys = "sqlsrv";
                $dsn .= ";LoginTimeout=" . ($connInfo["connect_timeout"] ?? 5);

            } elseif (stripos($dsn, "mysql") !== false) {
                $this->dbsys = "mysql";

                $options[PDO::ATTR_TIMEOUT] = $connInfo["connect_timeout"] ?? 5;
                $options[PDO::MYSQL_ATTR_LOCAL_INFILE] = false;

                $initCommand = array();
                if (isset($connInfo["timezone"])) $initCommand[] = "SET time_zone = '".$connInfo["timezone"]."'";
                if (isset($connInfo["mysql_charset"])) {
                    if (version_compare(PHP_VERSION, '5.3.6', '<')) {
                        $initCommand[] = "SET NAMES ".$connInfo["mysql_charset"];
                    } elseif (stripos($dsn, "charset") === false) {
                        $dsn .= ";charset=".$connInfo["mysql_charset"];
                    }
                }
                if ($initCommand) $options[PDO::MYSQL_ATTR_INIT_COMMAND] = implode(";", $initCommand);
            }

            return new PDO($dsn, $user, $passwd, $options);
        } catch (Exception $e) {
            if (SHAKEFLAT_ENV["config"]["debug_mode"] ?? false) {
                sfLogExit($e->getMessage() . " ({code})", array("code"=>$e->getCode()));
            } else {
                sfLogExit("DB connection failed. ({$e->getCode()})");
            }
        }
    }

    public function quote($v)
    {
        return $this->dbh->quote($v);
    }

    // $bind : [ $key => $value, $key => $value, ... ]
    public function query($sql, $bindList = null)
    {
        $re = $this->_query($sql, $bindList);
        return $re;
    }

    // When a query error occurs, false is returned without error handling.
    public function simpleQuery($sql, $bindList = null)
    {
        return $this->_query($sql, $bindList, true);
    }

    public function errorInfo()
    {
        return $this->errInfo;
    }

    /**
     * Execute SQL query with optional bind parameters
     * @param string $sql SQL query string
     * @param array|null $bindList Bind parameters (supports both named and positional binding)
     * @param bool $noExit If true, return false on error instead of terminating
     * @return mixed PDOStatement on success, false on error (when $noExit is true)
     */
    private function _query($sql, $bindList = null, $noExit = false)
    {
        if (!is_string($sql)) sfLogExit("The query sql statement must be in string format.");

        $this->errInfo = array();
        $statement = null;

        try {
            // Execute query
            if ($bindList === null) {
                // Direct query without bind parameters
                // Note: This is not safe from SQL injection if variables are embedded
                $statement = $this->dbh->query($sql);
            } elseif (is_array($bindList)) {
                // Prepared statement with bind parameters
                $statement = $this->dbh->prepare($sql);

                // Check if it's positional binding (indexed array) or named binding (associative array)
                $isPositional = array_keys($bindList) === range(0, count($bindList) - 1);

                if ($isPositional) {
                    // Positional binding: use 1-based index for PDO
                    foreach($bindList as $index => $value) {
                        $type = $this->getBindType($value);
                        $statement->bindValue($index + 1, $value, $type);
                    }
                } else {
                    // Named binding: use parameter names
                    foreach($bindList as $param => $value) {
                        $type = $this->getBindType($value);
                        $statement->bindValue($param, $value, $type);
                    }
                }

                $statement->execute();
            }
        } catch(Exception $e) {
            // Store error information
            $this->errInfo = array($e->getCode(), $e->getMessage());

            // Return false if noExit mode
            if ($noExit) return false;

            // Logging query if enabled
            if (SHAKEFLAT_ENV["log"]["include_query"] ?? false) LogQuery::stack($sql, $bindList, LogLevel::ERROR);

            // Handle error and exit
            $this->handleQueryError($e, $sql, $bindList);
        }

        // Logging query if enabled
        if (SHAKEFLAT_ENV["log"]["include_query"] ?? false) LogQuery::stack($sql, $bindList, LogLevel::INFO);

        return $statement;
    }

    /**
     * Determine PDO bind type based on value type
     * @param mixed $value Value to bind
     * @return int PDO::PARAM_* constant
     */
    private function getBindType($value)
    {
        switch(gettype($value)) {
            case 'boolean': return PDO::PARAM_BOOL;
            case 'integer': return PDO::PARAM_INT;
            case 'NULL':    return PDO::PARAM_NULL;
            default:        return PDO::PARAM_STR;
        }
    }

    /**
     * Handle query error and terminate process
     * @param Exception $e The exception thrown
     * @param string $sql SQL query string
     * @param array|null $bindList Bind parameters
     */
    private function handleQueryError($e, $sql, $bindList)
    {
        $errCode = $this->dbh->errorCode();
        $errInfo = $this->dbh->errorInfo();

        $msg = $errInfo[2] ?? "query error";
        $context = array(
            "code1" => $errCode,
            "code2" => $errInfo[1] ?? "",
        );

        // Add detailed error information if display_error is enabled
        if ((SHAKEFLAT_ENV["config"]["display_error"] ?? false) &&
            (SHAKEFLAT_ENV["display_error"]["database"] ?? false)) {

            $msg .= ":{code2}({code1}) {code3}";
            $context["code3"] = $e->getMessage();
        }

        sfLogExit($msg, $context);
    }

    public function fetch($statement, $mode = PDO::FETCH_ASSOC)
    {
        try {
            return $statement->fetch($mode);
        } catch(Exception $e) {
            sfLogExit($e->getMessage() . " ({code})", array("code"=>$e->getCode()));
        }
    }

    public function fetchAll($statement, $mode = PDO::FETCH_ASSOC)
    {
        return $statement->fetchAll($mode);
    }

    public function lastId()
    {
        return $this->lastInsertId();
    }

    public function lastInsertId()
    {
        return $this->dbh->lastInsertId();
    }

    public function beginTransaction()
    {
        if ($this->dbh->inTransaction()) return true;
        return $this->dbh->beginTransaction();
    }

    public function rollBack()
    {
        if (!$this->dbh->inTransaction()) return false;
        return $this->dbh->rollBack();
    }

    public function commit()
    {
        return $this->dbh->commit();
    }
}
