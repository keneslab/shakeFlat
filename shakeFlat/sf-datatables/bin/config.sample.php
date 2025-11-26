<?php
/**
 * DataTables Generator Config File
 *
 * 이 파일을 복사하여 프로젝트별 설정 파일을 만드세요.
 * 예: members_list.config.php
 */

return [
    // ============================================================
    // 경로 설정
    // ============================================================
    'paths' => [
        'project_root'      => null,                // 프로젝트 루트 경로 (null이면 SHAKEFLAT_PATH 사용)
        'module_dir'        => 'sample/modules',    // 모듈 파일 디렉토리 (project_root 기준 상대 경로)
        'template_dir'      => 'sample/templates/admin', // 템플릿 파일 디렉토리 (project_root 기준 상대 경로)
    ],

    // ============================================================
    // 기본 정보
    // ============================================================
    'basic' => [
        'module_name'       => 'members',           // 모듈 이름 (URL, 폴더명에 사용)
        'function_name'     => 'list',              // 함수 이름 (URL, 파일명에 사용)
        'table_id'          => 'membersListTable',  // HTML 테이블 ID
        'db_table'          => 'sf_sample_members', // DB 테이블명
        'page_title'        => '샘플 회원 목록',    // 페이지 제목
        'show_page_title'   => false,               // 페이지 제목 표시 여부 (true: $res->pageTitle 사용, false: 제목 미표시)
        'pk_column'         => 'member_id',         // Primary Key 컬럼명 (상세보기/수정에 사용)
    ],

    // ============================================================
    // LEFT JOIN 정의
    // ============================================================
    'left_joins' => [
        // 부서 테이블 조인
        [
            'table' => 'sf_sample_departments',                             // 조인할 테이블명 (필수)
            'alias' => 'd',                                                 // 테이블 별칭 (선택, 생략 가능)
            'on' => 'd.department_id = sf_sample_members.department_id',    // JOIN 조건 (필수)
        ],
    ],

    // ============================================================
    // 컬럼 기본값 정의
    // ============================================================
    // 모든 컬럼에 공통으로 적용될 기본값
    // 개별 컬럼에서 재정의하면 개별 값이 우선 적용됨
    'column_defaults' => [
        'align' => 'left',          // 기본 정렬: left, center, right
        'orderable' => true,        // 기본 정렬 가능 여부
        'searchable' => false,      // 기본 검색 가능 여부
        'search_type' => 'like',    // 기본 검색 타입: like, equal
    ],

    // ============================================================
    // 컬럼 정의
    // ============================================================
    'columns' => [
        ['alias' => 'member_id', 'title' => '회원 ID', 'align' => 'center'],
        ['alias' => 'name', 'title' => '이름', 'searchable' => true],
        ['alias' => 'email', 'title' => '이메일', 'searchable' => true],
        ['alias' => 'phone', 'title' => '전화번호', 'align' => 'center', 'orderable' => false],
        ['alias' => 'department_name', 'column' => 'd.department_name', 'title' => '부서명', 'align' => 'center', 'searchable' => true],
        ['alias' => 'department_code', 'column' => 'd.department_code', 'title' => '부서코드', 'align' => 'center', 'searchable' => true],
        ['alias' => 'status', 'title' => '상태', 'align' => 'center', 'searchable' => true, 'search_type' => 'equal', 'options' => [
            'active'    => '활성',
            'inactive'  => '비활성',
            'banned'    => '차단',
        ]],
        ['alias' => 'join_date', 'title' => '가입일', 'align' => 'center', 'date_format' => 'Y-m-d'],
        ['alias' => 'salary', 'title' => '연봉', 'align' => 'right', 'number_format' => true],
        ['alias' => 'last_login', 'title' => '최근 로그인', 'align' => 'center', 'date_format' => 'Y-m-d H:i:s'],
        [
            'alias' => 'buttons',
            'title' => '관리',
            'align' => 'center',
            'orderable' => false,
            'is_button' => true,
            'no_export' => true,
            'buttons' => [                      // 버튼 정의 (생략시 기본값: view, modify, delete)
                'view',                         // 상세보기 버튼
                'modify',                       // 수정 버튼
                'delete',                       // 삭제 버튼
                // 커스텀 버튼 추가 예시:
                // [
                //     'type' => 'custom',
                //     'class' => 'btn sfdt-btn-xs btn-info sfdt-btn-detail-{tableId}',
                //     'icon' => 'bi-info-circle',
                //     'label' => '상세',
                // ],
            ],
        ],
        // column 옵션 사용 예시:
        // ['alias' => 'full_name', 'column' => "CONCAT(first_name, ' ', last_name)", 'title' => '전체이름'],  // 표현식
    ],

    // ============================================================
    // 통합 검색 설정
    // ============================================================
    'global_search' => [
        'enabled' => true,                      // 통합 검색 활성화 여부
        'columns' => [                          // 추가 검색 대상 컬럼 (searchable=true인 컬럼에 추가됨)
            // 배열 형식: 'column_name' 또는 ['column' => 'column_name', 'type' => 'like|equal', 'search_column' => 'db_column_name']
            ['column' => 'phone', 'type' => 'like' ],
            //['column' => 'address', 'type' => 'like'],    // 명시적 like 검색
            //['column' => 'city', 'type' => 'equal'],      // equal 검색
        ],
    ],

    // ============================================================
    // 상세 검색 필드 (Custom Search)
    // ============================================================
    'custom_search' => [
        // 이름 검색 (텍스트)
        [
            'alias'         => 'search_name',
            'title'         => '이름',
            'type'          => 'string',        // Param 타입: int, integer, float, string, bool, boolean, datetime, date, timestamp, array, json, email, url, domain, ip
                                                // 범위 타입: dateRange, datetimeRange, numberRange
            'db_column'     => 'name',          // DB 컬럼명 (WHERE 조건에 사용)
            'width'         => null,            // 입력 필드 너비 (CSS 값: '200px', '15rem' 등, null이면 auto)
            'mask'          => null,            // Inputmask 형식 (선택, libraries['inputmask']=true 필요)
        ],

        // 이메일 검색 (텍스트)
        [
            'alias'         => 'search_email',
            'title'         => '이메일',
            'type'          => 'string',
            'db_column'     => 'email',
            'width'         => '20rem',
            'mask'          => null,            // Inputmask 형식 (예: 'email')
        ],

        // 상태 검색 (셀렉트)
        [
            'alias'         => 'search_status',
            'title'         => '상태',
            'type'          => 'radio',
            'db_column'     => 'status',
            'options'       => [                // select, radio 타입일 때 필수
                ''          => '전체',
                'active'    => '활성',
                'inactive'  => '비활성',
                'banned'    => '차단',
            ],
        ],

        // 가입일 검색 (날짜 범위)
        [
            'alias'         => 'search_join_date',
            'title'         => '가입일',
            'type'          => 'dateRange',
            'db_column'     => 'join_date',
        ],

        // 최근 로그인 검색 (날짜시간 범위)
        [
            'alias'         => 'search_last_login',
            'title'         => '최근 로그인',
            'type'          => 'datetimeRange',
            'db_column'     => 'last_login',
        ],

        // 연봉 검색 (숫자 범위)
        [
            'alias'         => 'search_salary',
            'title'         => '연봉',
            'type'          => 'numberRange',
            'db_column'     => 'salary',
            'min'           => 0,               // numberRange 타입일 때 필수
            'max'           => 100000000,       // 1억
        ],
    ],

    // ============================================================
    // CRUD 기능 활성화
    // ============================================================
    'crud' => [
        'enable_add'    => true,                // 신규추가 기능
        'enable_view'   => true,                // 상세보기 기능
        'enable_modify' => true,                // 수정하기 기능
        'enable_delete' => true,                // 삭제하기 기능
        'view_button_class'   => 'btn sfdt-btn-xs sfdt-btn-color-view',    // 상세보기 버튼 CSS 클래스
        'modify_button_class' => 'btn sfdt-btn-xs sfdt-btn-color-modify',  // 수정 버튼 CSS 클래스
        'delete_button_class' => 'btn sfdt-btn-xs sfdt-btn-color-delete',  // 삭제 버튼 CSS 클래스
        'add_modal_width'    => '900px',        // 추가 모달 너비 (예: '800px', '60%', '50rem', null=기본값)
        'view_modal_width'   => '900px',        // 상세보기 모달 너비 (예: '800px', '60%', '50rem', null=기본값)
        'modify_modal_width' => '900px',        // 수정 모달 너비 (예: '800px', '60%', '50rem', null=기본값)
    ],

    // ============================================================
    // 폼 필드 - 신규추가
    // ============================================================
    'form_fields_add' => [
        // 이름
        [
            'alias'         => 'name',
            'title'         => '이름',
            'type'          => 'text',          // text, email, number, date, select, textarea, hidden
            'required'      => false,
            'default'       => null,
            'description'   => '회원의 실명을 입력하세요.',  // 필드 아래에 표시될 설명 (선택)
            'mask'          => null,            // Inputmask 형식 (선택, libraries['inputmask']=true 필요)
        ],

        // 이메일
        [
            'alias'         => 'email',
            'title'         => '이메일',
            'type'          => 'email',
            'required'      => false,
            'default'       => null,
            'description'   => '유효한 이메일 주소를 입력하세요.',
            'mask'          => null,            // Inputmask 형식 (예: 'email')
        ],

        // 전화번호
        [
            'alias'         => 'phone',
            'title'         => '전화번호',
            'type'          => 'text',
            'required'      => false,
            'default'       => null,
            'mask'          => '999-9999-9999',     // Inputmask 형식 (선택, libraries['inputmask']=true 필요)
        ],

        // 비밀번호
        [
            'alias'         => 'password',
            'title'         => '비밀번호',
            'type'          => 'password',
            'required'      => false,
            'default'       => null,
            'description'   => '8자 이상의 영문, 숫자, 특수문자를 포함해야 합니다.',
        ],

        // 비밀번호 확인
        [
            'alias'         => 'password_confirm',
            'title'         => '비밀번호 확인',
            'type'          => 'password',
            'required'      => false,
            'default'       => null,
            'match_with'    => 'password',          // 일치해야 하는 필드의 alias (선택)
        ],

        // 상태
        [
            'alias'         => 'status',
            'title'         => '상태',
            'type'          => 'select',
            'required'      => true,
            'default'       => 'active',
            'options'       => [                // select 타입일 때 필수
                'active'    => '활성',
                'inactive'  => '비활성',
                'banned'    => '차단',
            ],
        ],

        // 성별 (Radio - 일반 스타일)
        [
            'alias'         => 'gender',
            'title'         => '성별',
            'type'          => 'radio',
            'required'      => false,
            'default'       => 'M',
            'radio_type'    => 'default',       // 'default' 또는 'group'
            'layout'        => 'horizontal',    // 'vertical'(기본값), 'horizontal', 'inline'
            'gap'           => '1.5rem',        // CSS gap 값 (예: '10px', '1rem', '0.5rem')
            'options'       => [                // radio 타입일 때 필수
                'M'         => '남성',
                'F'         => '여성',
            ],
        ],

        // 알림 수신 동의 (Radio - 버튼 그룹 스타일)
        [
            'alias'         => 'notification',
            'title'         => '알림 수신',
            'type'          => 'radio',
            'required'      => false,
            'default'       => 'Y',
            'radio_type'    => 'group',         // 버튼 그룹 스타일
            'options'       => [
                'Y'         => '수신',
                'N'         => '거부',
            ],
        ],

        // 관심사 (Checkbox - 다중 선택)
        [
            'alias'         => 'interests',
            'title'         => '관심사',
            'type'          => 'checkbox',
            'required'      => false,
            'layout'        => 'horizontal',    // 'vertical'(기본값), 'horizontal', 'inline'
            'gap'           => '1rem',          // CSS gap 값
            'options'       => [                // checkbox 다중 선택
                'sports'    => '스포츠',
                'music'     => '음악',
                'movie'     => '영화',
                'book'      => '독서',
            ],
        ],

        // 개인정보 동의 (Checkbox - 단일)
        [
            'alias'         => 'agree_privacy',
            'title'         => '개인정보 수집 및 이용 동의',
            'type'          => 'checkbox',
            'required'      => true,
            'validate_required' => true,        // required일 때 체크 검증 여부 (기본값: true)
            'checkbox_label' => '개인정보 수집 및 이용에 동의합니다',  // 단일 checkbox 레이블
        ],

        // 도시
        [
            'alias'         => 'city',
            'title'         => '도시',
            'type'          => 'text',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // Inputmask 형식 (선택)
        ],

        // 우편번호
        [
            'alias'         => 'postal_code',
            'title'         => '우편번호',
            'type'          => 'text',
            'required'      => false,
            'default'       => null,
            'mask'          => '99999',             // Inputmask 형식 (선택)
        ],

        // 국가 코드
        [
            'alias'         => 'country',
            'title'         => '국가',
            'type'          => 'text',
            'required'      => false,
            'default'       => 'KR',
            'mask'          => 'AA',                // Inputmask 형식 (대문자 2자리)
        ],

        // 주소
        [
            'alias'         => 'address',
            'title'         => '주소',
            'type'          => 'textarea',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // textarea는 mask 미지원
        ],

        // 생년월일
        [
            'alias'         => 'birth_date',
            'title'         => '생년월일',
            'type'          => 'date',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // date 타입은 flatpickr 사용
        ],

        // 가입일
        [
            'alias'         => 'join_date',
            'title'         => '가입일',
            'type'          => 'date',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // date 타입은 flatpickr 사용
        ],

        // 연봉
        [
            'alias'         => 'salary',
            'title'         => '연봉',
            'type'          => 'text',
            'required'      => false,
            'default'       => 0,
            'mask'          => 'currency',      // Inputmask 통화 형식 (예: 1,234,567원)
        ],

        // 메모
        [
            'alias'         => 'notes',
            'title'         => '메모',
            'type'          => 'textarea',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // textarea는 mask 미지원
        ],
    ],

    // ============================================================
    // 폼 레이아웃 - 신규추가 (선택사항)
    // ============================================================
    // form_fields_add의 레이아웃을 정의합니다. 생략시 필드가 순서대로 세로로 나열됩니다.
    'form_layout_add' => [
        // 단일 필드 (alias만 지정)
        'name',
        'email',
        'phone',

        // Row 그룹 (여러 필드를 한 줄에 배치)
        [
            'type' => 'row',
            'col_class' => 'col-md-6',  // Bootstrap 컬럼 클래스 (기본: col-md-6)
            'fields' => ['password', 'password_confirm'],
        ],

        // 소제목
        [
            'type' => 'heading',
            'title' => '추가 정보',
        ],

        // Row 그룹 (3개 필드)
        [
            'type' => 'row',
            'col_class' => 'col-md-auto',
            'fields' => ['gender', 'status', 'city', ],
        ],

        // Row 그룹 (gender, notification)
        [
            'type' => 'row',
            'col_class' => 'col-md-auto',
            'fields' => ['interests', 'notification','postal_code'],
        ],


        'agree_privacy',

        // 구분선
        ['type' => 'divider'],

        // Static HTML (설명 등)
        [
            'type' => 'html',
            'content' => '<div class="alert alert-info"><i class="bi bi-info-circle"></i> 아래 정보는 선택사항입니다.</div>',
        ],

        'country',
        'address',

        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['birth_date', 'join_date'],
        ],

        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['salary', 'notes'],
        ],
    ],

    // ============================================================
    // 폼 필드 - 수정하기
    // ============================================================
    'form_fields_modify' => [
        // 이름
        [
            'alias'         => 'name',
            'title'         => '이름',
            'type'          => 'text',
            'required'      => true,
            'default'       => null,
            'mask'          => null,            // Inputmask 형식 (선택, libraries['inputmask']=true 필요)
        ],

        // 이메일
        [
            'alias'         => 'email',
            'title'         => '이메일',
            'type'          => 'email',
            'required'      => true,
            'default'       => null,
            'mask'          => null,            // Inputmask 형식 (예: 'email')
        ],

        // 전화번호
        [
            'alias'         => 'phone',
            'title'         => '전화번호',
            'type'          => 'text',
            'required'      => false,
            'default'       => null,
            'mask'          => '999-9999-9999',     // Inputmask 형식 (선택, libraries['inputmask']=true 필요)
        ],

        // 상태
        [
            'alias'         => 'status',
            'title'         => '상태',
            'type'          => 'select',
            'required'      => true,
            'default'       => 'active',
            'options'       => [
                'active'    => '활성',
                'inactive'  => '비활성',
                'banned'    => '차단',
            ],
        ],

        // 성별 (Radio - 일반 스타일)
        [
            'alias'         => 'gender',
            'title'         => '성별',
            'type'          => 'radio',
            'required'      => false,
            'default'       => 'M',
            'radio_type'    => 'default',       // 'default' 또는 'group'
            'layout'        => 'inline',        // 'vertical'(기본값), 'horizontal', 'inline'
            'gap'           => '1rem',          // CSS gap 값
            'options'       => [                // radio 타입일 때 필수
                'M'         => '남성',
                'F'         => '여성',
            ],
        ],

        // 알림 수신 동의 (Radio - 버튼 그룹 스타일)
        [
            'alias'         => 'notification',
            'title'         => '알림 수신',
            'type'          => 'radio',
            'required'      => false,
            'default'       => 'Y',
            'radio_type'    => 'group',         // 버튼 그룹 스타일
            'options'       => [
                'Y'         => '수신',
                'N'         => '거부',
            ],
        ],

        // 관심사 (Checkbox - 다중 선택)
        [
            'alias'         => 'interests',
            'title'         => '관심사',
            'type'          => 'checkbox',
            'required'      => false,
            'layout'        => 'inline',        // 'vertical'(기본값), 'horizontal', 'inline'
            'gap'           => '0.75rem',       // CSS gap 값
            'options'       => [                // checkbox 다중 선택
                'sports'    => '스포츠',
                'music'     => '음악',
                'movie'     => '영화',
                'book'      => '독서',
            ],
        ],

        // 개인정보 동의 (Checkbox - 단일)
        [
            'alias'         => 'agree_privacy',
            'title'         => '개인정보 수집 및 이용 동의',
            'type'          => 'checkbox',
            'required'      => false,
            'validate_required' => false,       // required일 때 체크 검증 여부 (기본값: true)
            'checkbox_label' => '개인정보 수집 및 이용에 동의합니다',  // 단일 checkbox 레이블
        ],

        // 도시
        [
            'alias'         => 'city',
            'title'         => '도시',
            'type'          => 'text',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // Inputmask 형식 (선택)
        ],

        // 우편번호
        [
            'alias'         => 'postal_code',
            'title'         => '우편번호',
            'type'          => 'text',
            'required'      => false,
            'default'       => null,
            'mask'          => '99999',             // Inputmask 형식 (선택)
        ],

        // 국가 코드
        [
            'alias'         => 'country',
            'title'         => '국가',
            'type'          => 'text',
            'required'      => false,
            'default'       => 'KR',
            'mask'          => 'AA',                // Inputmask 형식 (대문자 2자리)
        ],

        // 주소
        [
            'alias'         => 'address',
            'title'         => '주소',
            'type'          => 'textarea',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // textarea는 mask 미지원
        ],

        // 생년월일
        [
            'alias'         => 'birth_date',
            'title'         => '생년월일',
            'type'          => 'date',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // date 타입은 flatpickr 사용
        ],

        // 가입일
        [
            'alias'         => 'join_date',
            'title'         => '가입일',
            'type'          => 'date',
            'required'      => true,
            'default'       => null,
            'mask'          => null,            // date 타입은 flatpickr 사용
        ],

        // 연봉
        [
            'alias'         => 'salary',
            'title'         => '연봉',
            'type'          => 'text',
            'required'      => false,
            'default'       => 0,
            'mask'          => 'currency',      // Inputmask 통화 형식 (예: 1,234,567원)
        ],

        // 메모
        [
            'alias'         => 'notes',
            'title'         => '메모',
            'type'          => 'textarea',
            'required'      => false,
            'default'       => null,
            'mask'          => null,            // textarea는 mask 미지원
        ],
    ],

    // ============================================================
    // 폼 레이아웃 - 수정하기 (선택사항)
    // ============================================================
    // form_fields_modify의 레이아웃을 정의합니다. 생략시 필드가 순서대로 세로로 나열됩니다.
    'form_layout_modify' => [
        // 단일 필드 (alias만 지정)
        'name',
        'email',
        'phone',

        // Row 그룹 (여러 필드를 한 줄에 배치)
        [
            'type' => 'row',
            'col_class' => 'col-md-6',  // Bootstrap 컬럼 클래스 (기본: col-md-6)
            'fields' => ['password', 'password_confirm'],
        ],

        // 소제목
        [
            'type' => 'heading',
            'title' => '추가 정보',
        ],

        // Row 그룹 (3개 필드)
        [
            'type' => 'row',
            'col_class' => 'col-md-4',
            'fields' => ['status', 'city', 'postal_code'],
        ],

        // Row 그룹 (Radio 예제)
        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['gender', 'notification'],
        ],

        'interests',
        'agree_privacy',

        // 구분선
        ['type' => 'divider'],

        // Static HTML (설명 등)
        [
            'type' => 'html',
            'content' => '<div class="alert alert-info"><i class="bi bi-info-circle"></i> 아래 정보는 선택사항입니다.</div>',
        ],

        'country',
        'address',

        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['birth_date', 'join_date'],
        ],

        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['salary', 'notes'],
        ],
    ],

    // ============================================================
    // 상세보기 필드 (선택사항)
    // ============================================================
    // 상세보기 모달에 표시할 필드를 정의합니다.
    // 생략하면 form_fields_modify를 사용합니다.
    'view_fields' => null,  // null이면 form_fields_modify 사용
    /*
    'view_fields' => [
        // 기본 정보만 표시하는 예시
        ['alias' => 'name', 'title' => '이름'],
        ['alias' => 'email', 'title' => '이메일'],
        ['alias' => 'phone', 'title' => '전화번호'],
        ['alias' => 'status', 'title' => '상태', 'type' => 'select', 'options' => [
            'active' => '활성',
            'inactive' => '비활성',
            'banned' => '차단',
        ]],
        ['alias' => 'join_date', 'title' => '가입일'],
    ],
    */

    // ============================================================
    // 상세보기 레이아웃 (선택사항)
    // ============================================================
    // view_fields의 레이아웃을 정의합니다. 생략시 필드가 순서대로 세로로 나열됩니다.
    'view_layout' => null,  // null이면 form_layout_modify 사용
    /*
    'view_layout' => [
        // 단일 필드
        'name',
        'email',

        // Row 그룹
        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['phone', 'status'],
        ],

        // 소제목
        [
            'type' => 'heading',
            'title' => '가입 정보',
        ],

        // Row 그룹
        [
            'type' => 'row',
            'col_class' => 'col-md-6',
            'fields' => ['join_date', 'last_login'],
        ],

        // 구분선
        ['type' => 'divider'],

        'address',
        'notes',
    ],
    */

    // ============================================================
    // 라이브러리 로딩
    // ============================================================
    'libraries' => [
        'jquery'    => true,                    // jQuery (layout.html에서 이미 로딩하면 false)
        'bootstrap' => false,                   // Bootstrap (layout.html에서 이미 로딩하면 false)
        'sfui'      => false,                   // sfUI (layout.html에서 이미 로딩하면 false) - numberRange 타입 검색시 필요
        'choices'   => true,                    // Choices.js (select 검색/폼에 필요)
        'flatpickr' => true,                    // Flatpickr (날짜 선택에 필요)
        'inputmask' => true,                    // Inputmask (mask 옵션 사용시 필요)
    ],

    // ============================================================
    // DataTables 옵션
    // ============================================================
    'datatables_options' => [
        'stateSave'     => false,               // 테이블 상태 저장 (정렬, 페이징, 검색 등)
        'pageLength'    => 20,                  // 페이지당 표시할 행 수
        'lengthChange'  => true,                // 페이지 길이 변경 드롭다운 표시
        'lengthMenu'    => [10, 20, 50, 100],   // 페이지 길이 선택 옵션
        'ordering'      => true,                // 정렬 기능 활성화
        'colReorder'    => true,                // 컬럼 순서 변경 기능 (ColReorder 확장 필요)
        'responsive'    => false,               // 반응형 테이블 (Responsive 확장)
        'scrollX'       => false,               // 가로 스크롤
        'retrieve'      => true,                // 기존 DataTable 인스턴스 재사용
        'keys'          => [                    // 키보드 네비게이션 (KeyTable 확장 필요)
            'enable'    => true,               // 키보드 네비게이션 활성화
            'blurable'  => true,                // 포커스 해제 가능
            'columns'   => ':not(:last-child)',                // 키 네비게이션 가능한 컬럼 (null=전체, ':not(:last-child)'=마지막 제외)
        ],
        'drawCallback'  => null,                // 테이블 그려진 후 실행될 JS 코드 (예: 'function(settings) { console.log("drawn"); }')
        //'drawCallback'  => [ 'alert("테이블이 다시 그려졌습니다.");', 'console.log("테이블이 다시 그려졌습니다.");', ],
        'layout'        => null,                // DataTables 레이아웃 설정 (null이면 기본 레이아웃 적용)
    ],
];
