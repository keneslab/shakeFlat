<?php
/**
 * {{MODULE_NAME}}/{{FUNCTION_NAME}} - Module 파일
 *
 * 자동 생성됨 - ShakeFlat DataTables Generator
 */

use shakeFlat\Response;
use shakeFlat\Param;
use shakeFlat\DB;

function fnc_{{FUNCTION_NAME}}($app)
{
    $res = Response::getInstance();
    $param = Param::getInstance();

    $param->check('sfdtAction', Param::TYPE_STRING, [ 'add', 'modify', 'delete', 'list', 'get' ]);

    switch ($param->sfdtAction) {
        case 'add':     sfModeAjax();               handleAddAction();      return;
        case 'modify':  sfModeAjax();               handleModifyAction();   return;
        case 'delete':  sfModeAjax();               handleDeleteAction();   return;
        case 'list':    sfModeAjaxForDatatable();   handleListAction();     return;
        case 'get':     sfModeAjax();               handleGetAction();      return;
    }

    // 페이지 렌더링
    sfModeWEB();
    $res->pageTitle = '{{PAGE_TITLE}}';
}

/**
 * 목록 조회
 */
function handleListAction()
{
    $res = Response::getInstance();
    $db = DB::getInstance();
    $param = Param::getInstance();

    $param->checkKeyValue('draw', Param::TYPE_INT);
    $param->checkKeyValue('start', Param::TYPE_INT);
    $param->checkKeyValue('length', Param::TYPE_INT);
    $param->check('order', Param::TYPE_ARRAY);

    $where = [];
    $bind = [];

{{SEARCH_HANDLING}}

    // 정렬 처리
    $orderClause = '';
    if ($param->order) {
        $columns = {{COLUMNS_ARRAY}};
        $orderParts = [];
        foreach ($param->order as $order) {
            $columnIndex = (int)$order['column'];
            $direction = strtoupper($order['dir']) === 'ASC' ? 'ASC' : 'DESC';
            if (isset($columns[$columnIndex])) {
                $orderParts[] = $columns[$columnIndex] . ' ' . $direction;
            }
        }
        if (!empty($orderParts)) {
            $orderClause = 'ORDER BY ' . implode(', ', $orderParts);
        }
    }
    if (empty($orderClause)) {
        $orderClause = 'ORDER BY {{PRIMARY_KEY_WITH_TABLE}} DESC';
    }

    // 전체 레코드 수
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $totalQuery = "
        SELECT COUNT(*) as cnt
        FROM {{DB_TABLE}}{{LEFT_JOIN_CLAUSE}}
        {$whereClause}
    ";
    $totalRs = $db->query($totalQuery, $bind);
    $totalRecords = $db->fetch($totalRs)['cnt'];

    // 데이터 조회
    $dataQuery = "
        SELECT
{{SELECT_COLUMNS_INDENTED}}
        FROM {{DB_TABLE}}{{LEFT_JOIN_CLAUSE}}
        {$whereClause}
        {$orderClause}
        LIMIT :start, :length
    ";
    $bind['start'] = $param->start;
    $bind['length'] = $param->length;

    $dataRs = $db->query($dataQuery, $bind);
    $data = [];
    while ($row = $db->fetch($dataRs)) {
        $data[] = $row;
    }

    // 응답
    $res->draw = $param->draw;
    $res->recordsTotal = $totalRecords;
    $res->recordsFiltered = $totalRecords;
    $res->data = $data;
}

/**
 * 신규추가
 */
function handleAddAction()
{
    $res = Response::getInstance();
    $db = DB::getInstance();
    $param = Param::getInstance();

    // 폼 데이터 수집 및 검증
{{ADD_VALIDATION}}

{{ADD_INSERT_EXAMPLE}}

    $res->success = false;
    $res->message = 'TODO: INSERT 쿼리를 작성하세요';
}

/**
 * 수정하기
 */
function handleModifyAction()
{
    $res = Response::getInstance();
    $db = DB::getInstance();
    $param = Param::getInstance();

    $param->checkKeyValue('{{PRIMARY_KEY}}', Param::TYPE_INT);
    $id = $param->{{PRIMARY_KEY}};

    // 폼 데이터 수집 및 검증
{{MODIFY_VALIDATION}}

{{MODIFY_UPDATE_EXAMPLE}}

    $res->success = false;
    $res->message = 'TODO: UPDATE 쿼리를 작성하세요';
}

/**
 * 삭제하기
 */
function handleDeleteAction()
{
    $res = Response::getInstance();
    $db = DB::getInstance();
    $param = Param::getInstance();

    $param->checkKeyValue('{{PRIMARY_KEY}}', Param::TYPE_INT);
    $id = $param->{{PRIMARY_KEY}};

    /*
    // DELETE 쿼리 실행
    $sql = "DELETE FROM {{DB_TABLE}} WHERE {{PRIMARY_KEY}} = :id";
    $bind = ['id' => $id];
    $result = $db->query($sql, $bind);

    $res->success = ($result !== false);
    $res->message = ($result !== false) ? '삭제되었습니다.' : '삭제 실패';
    */

    $res->success = false;
    $res->message = 'TODO: DELETE 쿼리를 작성하세요';
}

/**
 * 상세 조회 (수정용)
 */
function handleGetAction()
{
    $res = Response::getInstance();
    $db = DB::getInstance();
    $param = Param::getInstance();

    $param->checkKeyValue('{{PRIMARY_KEY}}', Param::TYPE_INT);
    $id = $param->{{PRIMARY_KEY}};

    // 데이터 조회
{{GET_SELECT_QUERY}}

    if ($row) {
        $res->success = true;
        $res->data = $row;
    } else {
        $res->success = false;
        $res->message = '데이터를 찾을 수 없습니다.';
    }
}
