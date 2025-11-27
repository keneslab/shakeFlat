# ShakeFlat DataTables Generator - 설정 옵션 가이드

## 목차
- [1. 경로 설정 (paths)](#1-경로-설정-paths)
- [2. 기본 정보 (basic)](#2-기본-정보-basic)
- [3. LEFT JOIN 정의 (left_joins)](#3-left-join-정의-left_joins)
- [4. 컬럼 기본값 (column_defaults)](#4-컬럼-기본값-column_defaults)
- [5. 컬럼 정의 (columns)](#5-컬럼-정의-columns)
- [6. 통합 검색 (global_search)](#6-통합-검색-global_search)
- [7. 상세 검색 (custom_search)](#7-상세-검색-custom_search)
- [8. CRUD 기능 (crud)](#8-crud-기능-crud)
- [9. 폼 필드 - 신규추가 (form_fields_add)](#9-폼-필드---신규추가-form_fields_add)
- [10. 폼 레이아웃 - 신규추가 (form_layout_add)](#10-폼-레이아웃---신규추가-form_layout_add)
- [11. 폼 필드 - 수정 (form_fields_modify)](#11-폼-필드---수정-form_fields_modify)
- [12. 폼 레이아웃 - 수정 (form_layout_modify)](#12-폼-레이아웃---수정-form_layout_modify)
- [13. 상세보기 필드 (view_fields)](#13-상세보기-필드-view_fields)
- [14. 상세보기 레이아웃 (view_layout)](#14-상세보기-레이아웃-view_layout)
- [15. 라이브러리 로딩 (libraries)](#15-라이브러리-로딩-libraries)
- [16. DataTables 옵션 (datatables_options)](#16-datatables-옵션-datatables_options)

---

## 1. 경로 설정 (paths)

프로젝트 구조에 맞는 경로를 지정합니다.

```php
'paths' => [
    'project_root'      => null,                // 프로젝트 루트 경로
    'module_dir'        => 'sample/modules',    // 모듈 파일 디렉토리
    'template_dir'      => 'sample/templates/admin', // 템플릿 파일 디렉토리
],
```

### 옵션 설명

| 옵션 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `project_root` | string\|null | 선택 | 프로젝트 루트 경로. `null`이면 `SHAKEFLAT_PATH` 상수 사용 |
| `module_dir` | string | 필수 | 모듈 PHP 파일이 생성될 디렉토리 (project_root 기준 상대 경로) |
| `template_dir` | string | 필수 | 템플릿 HTML 파일이 생성될 디렉토리 (project_root 기준 상대 경로) |

---

## 2. 기본 정보 (basic)

생성될 모듈과 테이블의 기본 정보를 정의합니다.

```php
'basic' => [
    'module_name'       => 'members',           // 모듈 이름
    'function_name'     => 'list',              // 함수 이름
    'table_id'          => 'membersListTable',  // HTML 테이블 ID
    'db_table'          => 'sf_sample_members', // DB 테이블명
    'page_title'        => '샘플 회원 목록',    // 페이지 제목
    'show_page_title'   => false,               // 페이지 제목 표시 여부
    'pk_column'         => 'member_id',         // Primary Key 컬럼명
],
```

### 옵션 설명

| 옵션 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `module_name` | string | 필수 | 모듈명 (URL, 폴더명에 사용). 예: `members` |
| `function_name` | string | 필수 | 함수명 (URL, 파일명에 사용). 예: `list` |
| `table_id` | string | 필수 | HTML 테이블의 고유 ID. JavaScript에서 참조됨 |
| `db_table` | string | 필수 | 데이터베이스 테이블명 |
| `page_title` | string | 필수 | 페이지 제목 (브라우저 탭, 페이지 헤더에 표시) |
| `show_page_title` | boolean | 선택 | `true`: `$res->pageTitle` 사용, `false`: 제목 미표시 (기본값: `false`) |
| `pk_column` | string | 필수 | Primary Key 컬럼명. 상세보기/수정/삭제에 사용 |

---

## 3. LEFT JOIN 정의 (left_joins)

다른 테이블과의 조인을 정의합니다.

```php
'left_joins' => [
    [
        'table' => 'sf_sample_departments',                             // 조인할 테이블명
        'alias' => 'd',                                                 // 테이블 별칭
        'on' => 'd.department_id = sf_sample_members.department_id',    // JOIN 조건
    ],
],
```

### 옵션 설명

| 옵션 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `table` | string | 필수 | 조인할 테이블명 |
| `alias` | string | 선택 | 테이블 별칭. 생략 가능하며 쿼리에서 별칭으로 사용 |
| `on` | string | 필수 | JOIN 조건 (SQL ON 절) |

---

## 4. 컬럼 기본값 (column_defaults)

모든 컬럼에 공통으로 적용될 기본값을 정의합니다. 개별 컬럼 설정이 우선합니다.

```php
'column_defaults' => [
    'align' => 'left',          // 기본 정렬
    'orderable' => true,        // 기본 정렬 가능 여부
    'searchable' => false,      // 기본 검색 가능 여부
    'search_type' => 'like',    // 기본 검색 타입
],
```

### 옵션 설명

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `align` | string | `left` | 텍스트 정렬: `left`, `center`, `right` |
| `orderable` | boolean | `true` | 컬럼 정렬 가능 여부 |
| `searchable` | boolean | `false` | 통합 검색(global search) 대상 여부 |
| `search_type` | string | `like` | 검색 타입: `like` (부분 일치), `equal` (완전 일치) |

---

## 5. 컬럼 정의 (columns)

DataTables에 표시될 컬럼을 정의합니다.

```php
'columns' => [
    ['alias' => 'member_id', 'title' => '회원 ID', 'align' => 'center'],
    ['alias' => 'name', 'title' => '이름', 'searchable' => true],
    [
        'alias' => 'status',
        'title' => '상태',
        'align' => 'center',
        'searchable' => true,
        'search_type' => 'equal',
        'options' => [
            'active'    => '활성',
            'inactive'  => '비활성',
            'banned'    => '차단',
        ]
    ],
    ['alias' => 'join_date', 'title' => '가입일', 'date_format' => 'Y-m-d'],
    ['alias' => 'salary', 'title' => '연봉', 'align' => 'right', 'number_format' => true],
    [
        'alias' => 'buttons',
        'title' => '관리',
        'is_button' => true,
        'no_export' => true,
        'buttons' => ['view', 'modify', 'delete'],
    ],
],
```

### 필수 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `alias` | string | 컬럼 별칭 (고유 식별자) |
| `title` | string | 컬럼 헤더에 표시될 제목 |

### 선택 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `column` | string | `alias`와 동일 | 실제 DB 컬럼명 또는 SQL 표현식. 예: `d.department_name`, `CONCAT(first_name, ' ', last_name)` |
| `width` | string | `null` | 컬럼 너비 (CSS 값: `'200px'`, `'15rem'` 등) |
| `align` | string | `column_defaults` 참조 | 텍스트 정렬: `left`, `center`, `right` |
| `orderable` | boolean | `column_defaults` 참조 | 정렬 가능 여부 |
| `searchable` | boolean | `column_defaults` 참조 | 통합 검색(global search) 대상 여부 |
| `search_type` | string | `column_defaults` 참조 | 검색 타입: `like`, `equal` |
| `search_column` | string | `alias`와 동일 | 실제 검색할 DB 컬럼명. `searchable: true`일 때 통합 검색에 사용할 컬럼 지정 |
| `visible` | boolean | `true` | 컬럼 표시 여부 |
| `defaultContent` | string | `null` | 데이터가 없을 때 기본 표시 내용 |
| `render` | string | - | DataTables render 함수 (JavaScript 코드 문자열). 커스텀 렌더링이 필요할 때 사용. 다른 포맷 옵션보다 우선 적용됨 |
| `options` | array | - | 값 → 레이블 매핑. DB 코드 값을 사용자 친화적인 텍스트로 변환하여 테이블에 표시 |
| `date_format` | string | - | 날짜 형식. 예: `Y-m-d`, `Y-m-d H:i:s` |
| `number_format` | boolean | `false` | 숫자 천단위 구분 표시 여부 |
| `is_button` | boolean | `false` | 버튼 컬럼 여부 |
| `buttons` | array | `['view', 'modify', 'delete']` | 버튼 종류. `is_button: true`일 때만 유효 |
| `no_export` | boolean | `false` | 엑셀/CSV 내보내기 제외 여부 |

### `render` 옵션 상세

`render` 옵션은 DataTables의 render 함수를 직접 정의할 수 있습니다. JavaScript 함수 코드를 문자열로 작성합니다.

**우선순위:**
1. `render` (최우선)
2. `options`
3. `date_format`
4. `number_format`

`render`가 정의되면 다른 포맷 옵션(`options`, `date_format`, `number_format`)은 무시됩니다.

**함수 시그니처:**
```javascript
function(data, type, row, meta) {
    // data: 현재 셀의 데이터
    // type: 'display', 'sort', 'filter', 'type' 등
    // row: 전체 행 데이터 객체
    // meta: 메타 정보 (행/컬럼 인덱스 등)
    return '렌더링된 HTML 또는 값';
}
```

**예시:**

1. **배지 표시**
```php
[
    'alias' => 'status',
    'title' => '상태',
    'render' => 'function(data, type, row) {
        if (data === "active") return "<span class=\"badge bg-success\">활성</span>";
        if (data === "inactive") return "<span class=\"badge bg-secondary\">비활성</span>";
        return "<span class=\"badge bg-danger\">차단</span>";
    }'
],
```

2. **이미지 표시**
```php
[
    'alias' => 'profile_image',
    'title' => '프로필',
    'render' => 'function(data, type, row) {
        if (!data) return "";
        return "<img src=\"" + data + "\" style=\"width:50px;height:50px;border-radius:50%;object-fit:cover\">";
    }'
],
```

3. **링크 생성**
```php
[
    'alias' => 'email',
    'title' => '이메일',
    'render' => 'function(data, type, row) {
        return "<a href=\"mailto:" + data + "\">" + data + "</a>";
    }'
],
```

4. **조건부 스타일링**
```php
[
    'alias' => 'amount',
    'title' => '금액',
    'render' => 'function(data, type, row) {
        const amount = parseInt(data);
        const color = amount >= 0 ? "text-success" : "text-danger";
        return "<span class=\"" + color + "\">" + amount.toLocaleString() + "원</span>";
    }'
],
```

5. **복합 데이터 표시**
```php
[
    'alias' => 'user_info',
    'title' => '사용자 정보',
    'render' => 'function(data, type, row) {
        return row.name + " (" + row.email + ")";
    }'
],
```

### `buttons` 옵션 상세

기본 버튼: `'view'`, `'modify'`, `'delete'`

커스텀 버튼 예시:
```php
'buttons' => [
    'view',
    'modify',
    [
        'type' => 'custom',
        'class' => 'btn sfdt-btn-xs btn-info sfdt-btn-custom-{tableId}',
        'icon' => 'bi-info-circle',
        'label' => '상세',
    ],
],
```

---

## 6. 통합 검색 (global_search)

DataTables 상단의 통합 검색 기능을 설정합니다.

```php
'global_search' => [
    'enabled' => true,                      // 통합 검색 활성화 여부
    'columns' => [                          // 추가 검색 대상 컬럼
        ['column' => 'phone', 'type' => 'like'],
        ['column' => 'address', 'type' => 'like'],
        ['column' => 'city', 'type' => 'equal'],
    ],
],
```

### 옵션 설명

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | boolean | `true` | 통합 검색 활성화 여부 |
| `columns` | array | `[]` | 추가 검색 대상 컬럼. `searchable: true`인 컬럼에 자동 추가됨 |

### `columns` 배열 형식

각 요소는 다음 형식:
- 간단한 형식: `'column_name'` (기본 타입: `like`)
- 상세 형식:
  ```php
  [
      'column' => 'column_name',       // 필수: 컬럼명
      'type' => 'like',                // 선택: 'like' 또는 'equal'
      'search_column' => 'db_column'   // 선택: 실제 검색할 DB 컬럼명
  ]
  ```

---

## 7. 상세 검색 (custom_search)

상세 검색 영역에 표시될 검색 필드를 정의합니다.

```php
'custom_search' => [
    // 텍스트 검색
    [
        'alias'         => 'search_name',
        'title'         => '이름',
        'type'          => 'string',
        'db_column'     => 'name',
        'width'         => null,
        'mask'          => null,
    ],

    // 셀렉트/라디오 검색
    [
        'alias'         => 'search_status',
        'title'         => '상태',
        'type'          => 'radio',
        'db_column'     => 'status',
        'options'       => [
            ''          => '전체',
            'active'    => '활성',
            'inactive'  => '비활성',
        ],
    ],

    // 날짜 범위 검색
    [
        'alias'         => 'search_join_date',
        'title'         => '가입일',
        'type'          => 'dateRange',
        'db_column'     => 'join_date',
    ],

    // 숫자 범위 검색
    [
        'alias'         => 'search_salary',
        'title'         => '연봉',
        'type'          => 'numberRange',
        'db_column'     => 'salary',
        'min'           => 0,
        'max'           => 100000000,
    ],
],
```

### 필수 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `alias` | string | 검색 필드 별칭 (파라미터명으로 사용) |
| `title` | string | 검색 필드 라벨 |
| `type` | string | 검색 필드 타입 (아래 참조) |
| `db_column` | string | 검색 대상 DB 컬럼명 |

### 선택 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `width` | string | `null` | 입력 필드 너비. CSS 값: `'200px'`, `'15rem'` 등 |
| `mask` | string | `null` | Inputmask 형식 (예: `'999-9999-9999'`, `'email'`). `libraries['inputmask']: true` 필요 |
| `options` | array | - | select/radio 타입일 때 선택 옵션 |
| `min` | int/float | - | `numberRange` 타입일 때 최소값 |
| `max` | int/float | - | `numberRange` 타입일 때 최대값 |

### `type` 옵션 값

**기본 타입:**
- `string`: 문자열
- `int`, `integer`: 정수
- `float`: 실수
- `bool`, `boolean`: 불리언
- `email`: 이메일
- `url`: URL
- `date`: 날짜 (YYYY-MM-DD)
- `datetime`: 날짜시간
- `timestamp`: 타임스탬프
- `array`: 배열
- `json`: JSON

**범위 타입:**
- `dateRange`: 날짜 범위 (시작일 ~ 종료일)
- `datetimeRange`: 날짜시간 범위
- `numberRange`: 숫자 범위 (최소값 ~ 최대값, `min`/`max` 필수)

---

## 8. CRUD 기능 (crud)

추가/조회/수정/삭제 기능 활성화 및 설정을 정의합니다.

```php
'crud' => [
    'enable_add'    => false,           // 기본값: false
    'enable_view'   => false,           // 기본값: false
    'enable_modify' => false,           // 기본값: false
    'enable_delete' => false,           // 기본값: false
    'view_button_class'   => 'btn sfdt-btn-xs sfdt-btn-color-view',
    'modify_button_class' => 'btn sfdt-btn-xs sfdt-btn-color-modify',
    'delete_button_class' => 'btn sfdt-btn-xs sfdt-btn-color-delete',
    'add_modal_width'    => null,       // 기본값: null (자동)
    'view_modal_width'   => null,
    'modify_modal_width' => null,
],
```

### 옵션 설명

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enable_add` | boolean | `false` | 신규추가 기능 활성화 |
| `enable_view` | boolean | `false` | 상세보기 기능 활성화 |
| `enable_modify` | boolean | `false` | 수정 기능 활성화 |
| `enable_delete` | boolean | `false` | 삭제 기능 활성화 |
| `view_button_class` | string | `'btn sfdt-btn-xs sfdt-btn-color-view'` | 상세보기 버튼 CSS 클래스 |
| `modify_button_class` | string | `'btn sfdt-btn-xs sfdt-btn-color-modify'` | 수정 버튼 CSS 클래스 |
| `delete_button_class` | string | `'btn sfdt-btn-xs sfdt-btn-color-delete'` | 삭제 버튼 CSS 클래스 |
| `add_modal_width` | string | `null` | 추가 모달 너비 (예: `'800px'`, `'60%'`, `'50rem'`). `null`이면 자동 |
| `view_modal_width` | string | `null` | 상세보기 모달 너비 |
| `modify_modal_width` | string | `null` | 수정 모달 너비 |

---

## 9. 폼 필드 - 신규추가 (form_fields_add)

신규추가 폼의 입력 필드를 정의합니다.

```php
'form_fields_add' => [
    // 텍스트
    [
        'alias'         => 'name',
        'title'         => '이름',
        'type'          => 'text',
    ],

    // 이메일
    [
        'alias'         => 'email',
        'title'         => '이메일',
        'type'          => 'email',
        'required'      => false,
        'default'       => null,
        'width'         => '400px',
        'description'   => '유효한 이메일 주소를 입력하세요.',
        'mask'          => null,
    ],

    // 비밀번호
    [
        'alias'         => 'password',
        'title'         => '비밀번호',
        'type'          => 'password',
        'required'      => false,
        'default'       => null,
    ],

    // 비밀번호 확인
    [
        'alias'         => 'password_confirm',
        'title'         => '비밀번호 확인',
        'type'          => 'password',
        'required'      => false,
        'match_with'    => 'password',
    ],

    // 셀렉트
    [
        'alias'         => 'status',
        'title'         => '상태',
        'type'          => 'select',
        'required'      => true,
        'default'       => 'active',
        'options'       => [
            'active'    => '활성',
            'inactive'  => '비활성',
        ],
    ],

    // 라디오 (일반)
    [
        'alias'         => 'gender',
        'title'         => '성별',
        'type'          => 'radio',
        'radio_type'    => 'default',
        'layout'        => 'horizontal',
        'gap'           => '1.5rem',
        'options'       => [
            'M'         => '남성',
            'F'         => '여성',
        ],
    ],

    // 라디오 (버튼 그룹)
    [
        'alias'         => 'notification',
        'title'         => '알림 수신',
        'type'          => 'radio',
        'radio_type'    => 'group',
        'options'       => [
            'Y'         => '수신',
            'N'         => '거부',
        ],
    ],

    // 체크박스 (다중)
    [
        'alias'         => 'interests',
        'title'         => '관심사',
        'type'          => 'checkbox',
        'layout'        => 'horizontal',
        'gap'           => '1rem',
        'options'       => [
            'sports'    => '스포츠',
            'music'     => '음악',
            'movie'     => '영화',
        ],
    ],

    // 체크박스 (단일)
    [
        'alias'         => 'agree_privacy',
        'title'         => '개인정보 수집 및 이용 동의',
        'type'          => 'checkbox',
        'required'      => true,
        'validate_required' => true,
        'checkbox_label' => '개인정보 수집 및 이용에 동의합니다',
    ],

    // Textarea
    [
        'alias'         => 'notes',
        'title'         => '메모',
        'type'          => 'textarea',
        'required'      => false,
        'default'       => null,
    ],

    // 날짜
    [
        'alias'         => 'join_date',
        'title'         => '가입일',
        'type'          => 'date',
        'required'      => false,
        'default'       => null,
    ],
],
```

### 필수 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `alias` | string | 필드 별칭 (DB 컬럼명과 동일하게 사용 권장) |
| `title` | string | 필드 라벨 |
| `type` | string | 필드 타입 (아래 참조) |

### 선택 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `required` | boolean | `false` | 필수 입력 여부. 생략하면 선택 입력으로 처리 |
| `default` | mixed | `null` | 기본값 |
| `width` | string | `null` | 입력 필드 너비 (CSS 값: `'200px'`, `'15rem'` 등) |
| `description` | string | - | 필드 설명 (입력창 하단에 표시) |
| `mask` | string | `null` | Inputmask 형식. 예: `'999-9999-9999'`, `'email'`, `'currency'` |
| `match_with` | string | - | 일치해야 하는 필드의 alias (비밀번호 확인 등). 해당 필드는 DB에 저장되지 않음 |
| `options` | array | - | select, radio, checkbox 타입의 선택 옵션 |
| `radio_type` | string | `'default'` | radio 스타일: `'default'` (기본), `'group'` (버튼 그룹) |
| `layout` | string | `'vertical'` | radio/checkbox 배치: `'vertical'`, `'horizontal'`, `'inline'` |
| `gap` | string | `'0.5rem'` | radio/checkbox 간격 (CSS gap 값) |
| `checkbox_label` | string | - | 단일 checkbox의 레이블 텍스트 |
| `validate_required` | boolean | `true` | `required: true`일 때 체크 검증 여부 (checkbox 전용) |

### `type` 옵션 값

- `text`: 텍스트 입력
- `email`: 이메일 입력
- `number`: 숫자 입력
- `date`: 날짜 선택 (Flatpickr 사용)
- `password`: 비밀번호 입력
- `select`: 드롭다운 선택 (`options` 필수)
- `radio`: 라디오 버튼 (`options` 필수)
- `checkbox`: 체크박스 (`options` 있으면 다중 선택, 없으면 단일)
- `textarea`: 여러 줄 텍스트 입력
- `hidden`: 숨겨진 필드

---

## 10. 폼 레이아웃 - 신규추가 (form_layout_add)

`form_fields_add`의 레이아웃을 정의합니다. 생략 시 필드가 순서대로 세로 배치됩니다.

```php
'form_layout_add' => [
    // 단일 필드
    'name',
    'email',

    // Row 그룹 (한 줄에 여러 필드)
    [
        'type' => 'row',
        'col_class' => 'col-md-6',
        'fields' => ['password', 'password_confirm'],
    ],

    // 소제목
    [
        'type' => 'heading',
        'title' => '추가 정보',
    ],

    // 구분선
    ['type' => 'divider'],

    // 정적 HTML
    [
        'type' => 'html',
        'content' => '<div class="alert alert-info">안내 메시지</div>',
    ],
],
```

### 레이아웃 요소 타입

**1. 단일 필드**
```php
'field_alias'
```

**2. Row 그룹**
```php
[
    'type' => 'row',
    'col_class' => 'col-md-6',      // Bootstrap 컬럼 클래스
    'fields' => ['field1', 'field2'],
]
```

**3. 소제목 (Heading)**
```php
[
    'type' => 'heading',
    'title' => '섹션 제목',
]
```

**4. 구분선 (Divider)**
```php
['type' => 'divider']
```

**5. 정적 HTML**
```php
[
    'type' => 'html',
    'content' => '<div>HTML 내용</div>',
]
```

---

## 11. 폼 필드 - 수정 (form_fields_modify)

수정 폼의 입력 필드를 정의합니다. 옵션은 `form_fields_add`와 동일합니다.

```php
'form_fields_modify' => [
    // form_fields_add와 동일한 형식
],
```

---

## 12. 폼 레이아웃 - 수정 (form_layout_modify)

`form_fields_modify`의 레이아웃을 정의합니다. 옵션은 `form_layout_add`와 동일합니다.

```php
'form_layout_modify' => [
    // form_layout_add와 동일한 형식
],
```

---

## 13. 상세보기 필드 (view_fields)

상세보기 모달에 표시할 필드를 정의합니다. `null`이면 `form_fields_modify`를 사용합니다.

```php
'view_fields' => null,  // form_fields_modify 사용

// 또는
'view_fields' => [
    ['alias' => 'name', 'title' => '이름'],
    ['alias' => 'email', 'title' => '이메일'],
    [
        'alias' => 'status',
        'title' => '상태',
        'type' => 'select',
        'options' => [
            'active' => '활성',
            'inactive' => '비활성',
        ]
    ],
],
```

### 옵션 설명

`form_fields_add`와 동일한 형식이지만, 입력 검증 관련 옵션(`required`, `mask` 등)은 무시됩니다.

---

## 14. 상세보기 레이아웃 (view_layout)

`view_fields`의 레이아웃을 정의합니다. `null`이면 `form_layout_modify`를 사용합니다.

```php
'view_layout' => null,  // form_layout_modify 사용

// 또는
'view_layout' => [
    // form_layout_add와 동일한 형식
],
```

---

## 15. 라이브러리 로딩 (libraries)

필요한 JavaScript 라이브러리 로딩 여부를 설정합니다.

```php
'libraries' => [
    'jquery'    => true,    // jQuery (기본값: true)
    'bootstrap' => false,   // Bootstrap (기본값: false)
    'sfui'      => false,   // sfUI (기본값: false)
    'choices'   => true,    // Choices.js (기본값: true)
    'flatpickr' => true,    // Flatpickr (기본값: true)
    'inputmask' => false,   // Inputmask (기본값: false)
],
```

### 옵션 설명

| 라이브러리 | 필요한 경우 | 설명 |
|-----------|------------|------|
| `jquery` | 항상 | jQuery 라이브러리. layout.html에서 이미 로딩하면 `false` |
| `bootstrap` | 항상 | Bootstrap CSS/JS. layout.html에서 이미 로딩하면 `false` |
| `sfui` | `numberRange` 검색 사용 시 | ShakeFlat UI 라이브러리 |
| `choices` | select 검색/폼 사용 시 | Choices.js (향상된 select) |
| `flatpickr` | date 타입 사용 시 | Flatpickr 날짜 선택기 |
| `inputmask` | `mask` 옵션 사용 시 | Inputmask 입력 마스크 |

---

## 16. DataTables 옵션 (datatables_options)

DataTables 라이브러리의 초기화 옵션을 설정합니다.

```php
'datatables_options' => [
    'stateSave'     => false,
    'pageLength'    => 20,
    'lengthChange'  => true,
    'lengthMenu'    => [10, 20, 50, 100],
    'ordering'      => true,
    'colReorder'    => true,
    'responsive'    => false,
    'scrollX'       => false,
    'retrieve'      => true,
    'keys'          => [
        'enable'    => false,               // 기본값: false
        'blurable'  => true,
        'columns'   => null,                // 기본값: null
    ],
    'drawCallback'  => null,
    'layout'        => null,
],
```

### 옵션 설명

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `stateSave` | boolean | `false` | 테이블 상태 저장 (정렬, 페이징, 검색 등을 브라우저에 저장) |
| `pageLength` | int | `20` | 페이지당 표시할 행 수 |
| `lengthChange` | boolean | `true` | 페이지 길이 변경 드롭다운 표시 |
| `lengthMenu` | array | `[10, 20, 50, 100]` | 페이지 길이 선택 옵션 |
| `ordering` | boolean | `true` | 정렬 기능 활성화 |
| `colReorder` | boolean | `true` | 컬럼 순서 변경 기능 (ColReorder 확장 필요) |
| `responsive` | boolean | `false` | 반응형 테이블 (Responsive 확장 필요) |
| `scrollX` | boolean | `false` | 가로 스크롤 활성화 |
| `retrieve` | boolean | `true` | 기존 DataTable 인스턴스 재사용 |
| `keys` | array | - | 키보드 네비게이션 설정 (KeyTable 확장 필요) |
| `drawCallback` | string\|array | `null` | 테이블 그린 후 실행될 JavaScript 코드 |
| `layout` | array | `null` | DataTables 레이아웃 설정 (null이면 기본 레이아웃) |

### `keys` 옵션 상세

```php
'keys' => [
    'enable'    => false,               // 키보드 네비게이션 활성화 (기본값: false)
    'blurable'  => true,                // 포커스 해제 가능
    'columns'   => null,                // 네비게이션 가능 컬럼 (CSS 선택자, null=전체)
],
```

**`columns` 선택자 예시:**
- `null`: 모든 컬럼
- `':not(:last-child)'`: 마지막 컬럼 제외
- `'.selectable'`: selectable 클래스가 있는 컬럼만

### `drawCallback` 사용 예시

**단일 코드:**
```php
'drawCallback' => 'console.log("테이블이 그려졌습니다.");'
```

**다중 코드:**
```php
'drawCallback' => [
    'console.log("테이블 그리기 완료");',
    'updateCustomUI();',
]
```

---

## 부록: Param 타입 매핑

폼 필드 타입이 Param 검증 타입으로 자동 변환됩니다.

| 폼 필드 타입 | Param 타입 | 설명 |
|-------------|-----------|------|
| `text` | `TYPE_STRING` | 문자열 |
| `email` | `TYPE_EMAIL` | 이메일 형식 검증 |
| `number` | `TYPE_INT` | 정수 |
| `date` | `TYPE_DATE` | 날짜 (YYYY-MM-DD) |
| `password` | `TYPE_STRING` | 문자열 |
| `select` | `TYPE_STRING` | 문자열 (단일 선택) |
| `radio` | `TYPE_STRING` | 문자열 (단일 선택) |
| `checkbox` (단일) | `TYPE_STRING` | 문자열 |
| `checkbox` (다중) | `TYPE_ARRAY` | 배열 (여러 값 선택) |
| `textarea` | `TYPE_STRING` | 문자열 |
| `hidden` | `TYPE_STRING` | 문자열 |

---

## 예제: 완전한 설정 파일

전체 예제는 `config.sample.php`를 참조하세요.

---

## 문의 및 지원

- 문서 버전: 1.0
- 마지막 업데이트: 2025-11-27
