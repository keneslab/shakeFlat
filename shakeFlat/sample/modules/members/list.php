<?php
/**
 * members/list - Module 파일
 *
 * 자동 생성됨 - ShakeFlat DataTables Generator
 */

use shakeFlat\Response;
use shakeFlat\Param;
use shakeFlat\DB;

function fnc_list($app)
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
    $res->pageTitle = '샘플 회원 목록';
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

    // 통합 검색 처리
    $param->check('search', Param::TYPE_ARRAY);
    if ($param->search['value']) {
        $searchValue = trim($param->search['value']);
        if ($searchValue !== '') {
            $searchWhere = [];
            $searchWhere[] = 'name LIKE :global_search_0';
            $bind['global_search_0'] = '%' . $searchValue . '%';
            $searchWhere[] = 'email LIKE :global_search_1';
            $bind['global_search_1'] = '%' . $searchValue . '%';
            $searchWhere[] = 'department_name LIKE :global_search_2';
            $bind['global_search_2'] = '%' . $searchValue . '%';
            $searchWhere[] = 'department_code LIKE :global_search_3';
            $bind['global_search_3'] = '%' . $searchValue . '%';
            $searchWhere[] = 'status = :global_search_4';
            $bind['global_search_4'] = $searchValue;
            $searchWhere[] = 'phone LIKE :global_search_5';
            $bind['global_search_5'] = '%' . $searchValue . '%';
            $where[] = '(' . implode(' OR ', $searchWhere) . ')';
        }
    }

    // 상세 검색 조건 처리 (custom_search 배열)
    $param->check('custom_search', Param::TYPE_ARRAY);
    if ($param->custom_search) {
        // 이름 검색
        if (!empty($param->custom_search['search_name'])) {
            $where[] = "name LIKE :search_name";
            $bind['search_name'] = "%{$param->custom_search['search_name']}%";
        }

        // 이메일 검색
        if (!empty($param->custom_search['search_email'])) {
            $where[] = "email LIKE :search_email";
            $bind['search_email'] = "%{$param->custom_search['search_email']}%";
        }

        // 상태 검색
        if (isset($param->custom_search['search_status']) && $param->custom_search['search_status'] !== '' && $param->custom_search['search_status'] !== null) {
            $where[] = "status = :search_status";
            $bind['search_status'] = $param->custom_search['search_status'];
        }

        // 가입일 검색
        if (!empty($param->custom_search['search_join_date'])) {
            if (strpos($param->custom_search['search_join_date'], ' to ') !== false) {
                $dates = explode(' to ', $param->custom_search['search_join_date']);
                if (count($dates) === 2 && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dates[0]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dates[1])) {
                    $where[] = "join_date BETWEEN :search_join_date_start AND :search_join_date_end";
                    $bind['search_join_date_start'] = $dates[0];
                    $bind['search_join_date_end'] = $dates[1];
                }
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $param->custom_search['search_join_date'])) {
                $where[] = "join_date >= :search_join_date_start";
                $bind['search_join_date_start'] = $param->custom_search['search_join_date'];
            }
        }

        // 최근 로그인 검색
        if (!empty($param->custom_search['search_last_login'])) {
            if (strpos($param->custom_search['search_last_login'], ' to ') !== false) {
                $dates = explode(' to ', $param->custom_search['search_last_login']);
                if (count($dates) === 2 && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', $dates[0]) && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', $dates[1])) {
                    $where[] = "last_login BETWEEN :search_last_login_start AND :search_last_login_end";
                    $bind['search_last_login_start'] = $dates[0];
                    $bind['search_last_login_end'] = $dates[1];
                }
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', $param->custom_search['search_last_login'])) {
                $where[] = "last_login >= :search_last_login_start";
                $bind['search_last_login_start'] = $param->custom_search['search_last_login'];
            }
        }

        // 연봉 검색
        if (!empty($param->custom_search['search_salary']) && strpos($param->custom_search['search_salary'], ' - ') !== false) {
            list($search_salary_min, $search_salary_max) = explode(' - ', $param->custom_search['search_salary']);
            $search_salary_min = str_replace(',', '', $search_salary_min);
            $search_salary_max = str_replace(',', '', $search_salary_max);
            if (is_numeric($search_salary_min) && is_numeric($search_salary_max)) {
                $where[] = "salary BETWEEN :search_salary_min AND :search_salary_max";
                $bind['search_salary_min'] = $search_salary_min;
                $bind['search_salary_max'] = $search_salary_max;
            }
        }

    }

    // 정렬 처리
    $orderClause = '';
    if ($param->order) {
        $columns = ['member_id', 'name', 'email', 'phone', 'department_name', 'department_code', 'status', 'join_date', 'salary', 'last_login', null];
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
        $orderClause = 'ORDER BY member_id DESC';
    }

    // 전체 레코드 수
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $totalQuery = "
        SELECT COUNT(*) as cnt
        FROM sf_sample_members
        LEFT JOIN sf_sample_departments d ON d.department_id = sf_sample_members.department_id
        {$whereClause}
    ";
    $totalRs = $db->query($totalQuery, $bind);
    $totalRecords = $db->fetch($totalRs)['cnt'];

    // 데이터 조회
    $dataQuery = "
        SELECT
            member_id,
            name,
            email,
            phone,
            d.department_name AS department_name,
            d.department_code AS department_code,
            status,
            join_date,
            salary,
            last_login
        FROM sf_sample_members
        LEFT JOIN sf_sample_departments d ON d.department_id = sf_sample_members.department_id
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
    $param->checkKey('name', Param::TYPE_STRING);
    $param->checkKey('email', Param::TYPE_EMAIL);
    $param->checkKey('phone', Param::TYPE_STRING);
    $param->checkKey('password', Param::TYPE_STRING);
    $param->checkKeyValue('status', Param::TYPE_STRING, [ 'active', 'inactive', 'banned' ]);
    $param->checkKey('gender', Param::TYPE_STRING, [ 'M', 'F' ]);
    $param->checkKey('notification', Param::TYPE_STRING, [ 'Y', 'N' ]);
    $param->check('interests', Param::TYPE_ARRAY);
    if (!empty($param->interests)) {
        foreach ($param->interests as $val) {
            if (!in_array($val, ['sports', 'music', 'movie', 'book'])) sfLogExit("[:The value of parameter interests is invalid:]");
        }
    }
    $param->checkKeyValue('agree_privacy', Param::TYPE_STRING);
    $param->checkKey('city', Param::TYPE_STRING);
    $param->checkKey('postal_code', Param::TYPE_STRING);
    $param->checkKey('country', Param::TYPE_STRING);
    $param->checkKey('address', Param::TYPE_STRING);
    $param->checkKey('birth_date', Param::TYPE_DATE);
    $param->checkKey('join_date', Param::TYPE_DATE);
    $param->checkKey('salary', Param::TYPE_STRING);
    $param->checkKey('notes', Param::TYPE_STRING);

    /*
    // interests 배열을 JSON 문자열로 변환
    $interests_value = !empty($param->interests) && is_array($param->interests) ? json_encode($param->interests) : null;

    $sql = "
        INSERT INTO sf_sample_members (
            name,
            email,
            phone,
            password,
            status,
            gender,
            notification,
            interests,
            agree_privacy,
            city,
            postal_code,
            country,
            address,
            birth_date,
            join_date,
            salary,
            notes
        ) VALUES (
            :name,
            :email,
            :phone,
            :password,
            :status,
            :gender,
            :notification,
            :interests,
            :agree_privacy,
            :city,
            :postal_code,
            :country,
            :address,
            :birth_date,
            :join_date,
            :salary,
            :notes
        )
    ";
    $bind = [
        'name' => $param->name ?? null,
        'email' => $param->email ?? null,
        'phone' => $param->phone ?? null,
        'password' => $param->password ?? null,
        'status' => $param->status ?? 'active',
        'gender' => $param->gender ?? 'M',
        'notification' => $param->notification ?? 'Y',
        'interests' => $interests_value,
        'agree_privacy' => $param->agree_privacy ?? null,
        'city' => $param->city ?? null,
        'postal_code' => $param->postal_code ?? null,
        'country' => $param->country ?? 'KR',
        'address' => $param->address ?? null,
        'birth_date' => $param->birth_date ?? null,
        'join_date' => $param->join_date ?? null,
        'salary' => $param->salary ?? 0,
        'notes' => $param->notes ?? null
    ];
    $db->query($sql, $bind);
    $res->success = true;
    $res->message = '추가되었습니다.';
    */

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

    $param->checkKeyValue('member_id', Param::TYPE_INT);
    $id = $param->member_id;

    // 폼 데이터 수집 및 검증
    $param->checkKeyValue('name', Param::TYPE_STRING);
    $param->checkKeyValue('email', Param::TYPE_EMAIL);
    $param->checkKey('phone', Param::TYPE_STRING);
    $param->checkKeyValue('status', Param::TYPE_STRING, [ 'active', 'inactive', 'banned' ]);
    $param->checkKey('gender', Param::TYPE_STRING, [ 'M', 'F' ]);
    $param->checkKey('notification', Param::TYPE_STRING, [ 'Y', 'N' ]);
    $param->check('interests', Param::TYPE_ARRAY);
    if (!empty($param->interests)) {
        foreach ($param->interests as $val) {
            if (!in_array($val, ['sports', 'music', 'movie', 'book'])) sfLogExit("[:The value of parameter interests is invalid:]");
        }
    }
    $param->checkKey('agree_privacy', Param::TYPE_STRING);
    $param->checkKey('city', Param::TYPE_STRING);
    $param->checkKey('postal_code', Param::TYPE_STRING);
    $param->checkKey('country', Param::TYPE_STRING);
    $param->checkKey('address', Param::TYPE_STRING);
    $param->checkKey('birth_date', Param::TYPE_DATE);
    $param->checkKeyValue('join_date', Param::TYPE_DATE);
    $param->checkKey('salary', Param::TYPE_STRING);
    $param->checkKey('notes', Param::TYPE_STRING);

    /*
    // interests 배열을 JSON 문자열로 변환
    $interests_value = !empty($param->interests) && is_array($param->interests) ? json_encode($param->interests) : null;

    $sql = "
        UPDATE sf_sample_members
        SET
            name = :name,
            email = :email,
            phone = :phone,
            status = :status,
            gender = :gender,
            notification = :notification,
            interests = :interests,
            agree_privacy = :agree_privacy,
            city = :city,
            postal_code = :postal_code,
            country = :country,
            address = :address,
            birth_date = :birth_date,
            join_date = :join_date,
            salary = :salary,
            notes = :notes
        WHERE member_id = :id
    ";
    $bind = [
        'id' => $id,
        'name' => $param->name,
        'email' => $param->email,
        'phone' => $param->phone,
        'status' => $param->status,
        'gender' => $param->gender,
        'notification' => $param->notification,
        'interests' => $interests_value,
        'agree_privacy' => $param->agree_privacy,
        'city' => $param->city,
        'postal_code' => $param->postal_code,
        'country' => $param->country,
        'address' => $param->address,
        'birth_date' => $param->birth_date,
        'join_date' => $param->join_date,
        'salary' => $param->salary,
        'notes' => $param->notes
    ];
    $db->query($sql, $bind);
    $res->success = true;
    $res->message = '수정되었습니다.';
    */

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

    $param->checkKeyValue('member_id', Param::TYPE_INT);
    $id = $param->member_id;

    // DELETE 쿼리 실행
    $sql = "DELETE FROM sf_sample_members WHERE member_id = :id";
    $bind = ['id' => $id];
    $result = $db->query($sql, $bind);

    $res->success = ($result !== false);
    $res->message = ($result !== false) ? '삭제되었습니다.' : '삭제 실패';
}

/**
 * 상세 조회 (수정용)
 */
function handleGetAction()
{
    $res = Response::getInstance();
    $db = DB::getInstance();
    $param = Param::getInstance();

    $param->checkKeyValue('member_id', Param::TYPE_INT);
    $id = $param->member_id;

    // 데이터 조회
    $sql = "
        SELECT
            member_id,
            name,
            email,
            phone,
            d.department_name AS department_name,
            d.department_code AS department_code,
            status,
            join_date,
            salary,
            last_login
        FROM sf_sample_members

        LEFT JOIN sf_sample_departments d ON d.department_id = sf_sample_members.department_id
        WHERE member_id = :id
    ";
    $bind = ['id' => $id];
    $rs = $db->query($sql, $bind);
    $row = $db->fetch($rs);

    if ($row) {
        $res->success = true;
        $res->data = $row;
    } else {
        $res->success = false;
        $res->message = '데이터를 찾을 수 없습니다.';
    }
}
