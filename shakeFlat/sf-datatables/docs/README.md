# ShakeFlat DataTables Generator

ShakeFlat DataTables Generator는 DataTables를 사용하는 CRUD 기능을 자동으로 생성하는 코드 생성기입니다. 설정 파일만 작성하면 목록 조회, 검색, 추가, 상세보기, 수정, 삭제 기능이 포함된 완전한 코드를 자동으로 생성합니다.

## 목차

- [개념](#개념)
- [디렉토리 구조](#디렉토리-구조)
- [시작하기](#시작하기)
- [Config 파일 작성](#config-파일-작성)
- [코드 생성](#코드-생성)
- [생성되는 파일](#생성되는-파일)
- [주요 기능](#주요-기능)
- [고급 설정](#고급-설정)

## 개념

### 기본 개념

ShakeFlat DataTables Generator는 **템플릿 기반 코드 생성 방식**을 사용합니다:

1. **설정 파일(Config)**: 데이터베이스 테이블, 컬럼, CRUD 설정 등을 정의
2. **코드 생성기(Generator)**: 설정을 읽어 템플릿을 통해 실제 코드 생성
3. **생성 파일**: Module(PHP)과 Template(HTML/JS) 파일이 자동 생성

### 장점

- ✅ **빠른 개발**: 반복적인 CRUD 코드 작성 불필요
- ✅ **일관성**: 모든 기능이 동일한 패턴으로 생성
- ✅ **유지보수**: 설정 파일만 수정하고 재생성하면 코드 업데이트
- ✅ **커스터마이징**: 생성된 코드를 자유롭게 수정 가능

### 생성 흐름

```
config 파일 작성
    ↓
generate.php 실행
    ↓
ConfigCollector (검증)
    ↓
CodeGenerator (생성)
    ↓
Module 파일 (list.php)
Template 파일 (list.html)
```

## 디렉토리 구조

```
sf-datatables/
├── bin/
│   ├── generate.php              # 코드 생성 스크립트
│   ├── config.sample.php         # 설정 파일 샘플
│   ├── classes/
│   │   ├── CodeGenerator.php    # 코드 생성기
│   │   ├── ConfigCollector.php  # 설정 검증기
│   │   └── FileWriter.php       # 파일 작성기
│   └── templates/               # 코드 생성 템플릿
│       ├── ModuleFile.php.tpl
│       └── TemplateFile.html.tpl
├── docs/
│   ├── README.md                # 이 문서
│   ├── sample_departments_table.sql
│   └── sample_members_table.sql
└── [생성된 파일들]
    ├── sample/modules/members/list.php
    └── sample/templates/admin/members/list.html
```

## 시작하기

### 1. 데이터베이스 테이블 준비

먼저 CRUD를 구현할 데이터베이스 테이블이 필요합니다.

예시: `docs/sample_members_table.sql` 참고

### 2. Config 파일 복사

```bash
cd sf-datatables/bin
cp config.sample.php my_project.config.php
```

### 3. Config 파일 수정

`my_project.config.php` 파일을 열어 프로젝트에 맞게 수정합니다.

### 4. 코드 생성

```bash
php generate.php my_project.config.php
```

### 5. 생성된 파일 확인

- Module 파일: `{project_root}/{module_dir}/{module_name}/list.php`
- Template 파일: `{project_root}/{template_dir}/{module_name}/list.html`

## Config 파일 작성

### 기본 구조

```php
<?php
return [
    'paths' => [...],              // 경로 설정
    'basic' => [...],              // 기본 정보
    'left_joins' => [...],         // LEFT JOIN 정의
    'column_defaults' => [...],    // 컬럼 기본값
    'columns' => [...],            // 컬럼 정의
    'global_search' => [...],      // 통합 검색
    'custom_search' => [...],      // 상세 검색
    'crud' => [...],               // CRUD 설정
    'form_fields_add' => [...],    // 추가 폼 필드
    'form_layout_add' => [...],    // 추가 폼 레이아웃
    'form_fields_modify' => [...], // 수정 폼 필드
    'form_layout_modify' => [...], // 수정 폼 레이아웃
    'view_fields' => [...],        // 상세보기 필드
    'view_layout' => [...],        // 상세보기 레이아웃
    'libraries' => [...],          // 라이브러리 로딩
    'datatables_options' => [...], // DataTables 옵션
];
```

### 필수 설정

#### 1. 경로 설정 (paths)

```php
'paths' => [
    'project_root'  => null,                    // null이면 SHAKEFLAT_PATH 사용
    'module_dir'    => 'sample/modules',        // 모듈 디렉토리
    'template_dir'  => 'sample/templates/admin', // 템플릿 디렉토리
],
```

#### 2. 기본 정보 (basic)

```php
'basic' => [
    'module_name'    => 'members',           // 모듈 이름
    'function_name'  => 'list',              // 함수 이름
    'table_id'       => 'membersListTable',  // HTML 테이블 ID
    'db_table'       => 'sf_sample_members', // DB 테이블명
    'page_title'     => '회원 목록',         // 페이지 제목
    'show_page_title'=> false,               // 제목 표시 여부
    'pk_column'      => 'member_id',         // Primary Key 컬럼명
],
```

#### 3. 컬럼 정의 (columns)

```php
'columns' => [
    ['alias' => 'member_id', 'title' => '회원 ID', 'align' => 'center'],
    ['alias' => 'name', 'title' => '이름', 'searchable' => true],
    ['alias' => 'email', 'title' => '이메일', 'searchable' => true],
    [
        'alias' => 'status',
        'title' => '상태',
        'align' => 'center',
        'options' => [
            'active' => '활성',
            'inactive' => '비활성',
            'banned' => '차단',
        ]
    ],
    [
        'alias' => 'buttons',
        'title' => '관리',
        'align' => 'center',
        'orderable' => false,
        'is_button' => true,
        'buttons' => ['view', 'modify', 'delete'],
    ],
],
```

#### 4. CRUD 설정 (crud)

```php
'crud' => [
    'enable_add'            => true,                        // 추가 기능
    'enable_view'           => true,                        // 상세보기 기능
    'enable_modify'         => true,                        // 수정 기능
    'enable_delete'         => true,                        // 삭제 기능
    'view_button_class'     => 'btn sfdt-btn-xs sfdt-btn-color-view',
    'modify_button_class'   => 'btn sfdt-btn-xs sfdt-btn-color-modify',
    'delete_button_class'   => 'btn sfdt-btn-xs sfdt-btn-color-delete',
    'add_modal_width'       => '900px',                     // 추가 모달 너비
    'view_modal_width'      => '900px',                     // 상세보기 모달 너비
    'modify_modal_width'    => '900px',                     // 수정 모달 너비
],
```

#### 5. 폼 필드 정의

**추가 폼 (form_fields_add)**

```php
'form_fields_add' => [
    [
        'alias'       => 'name',
        'title'       => '이름',
        'type'        => 'text',        // text, email, number, date, select, textarea
        'required'    => true,
        'default'     => null,
        'description' => '회원의 실명을 입력하세요.',
    ],
    [
        'alias'    => 'status',
        'title'    => '상태',
        'type'     => 'select',
        'required' => true,
        'default'  => 'active',
        'options'  => [
            'active'   => '활성',
            'inactive' => '비활성',
            'banned'   => '차단',
        ],
    ],
],
```

**수정 폼 (form_fields_modify)**

추가 폼과 동일한 구조입니다.

### 선택적 설정

#### 1. LEFT JOIN (left_joins)

```php
'left_joins' => [
    [
        'table' => 'sf_sample_departments',
        'alias' => 'd',
        'on'    => 'd.department_id = sf_sample_members.department_id',
    ],
],
```

#### 2. 통합 검색 (global_search)

```php
'global_search' => [
    'enable' => true,
    'columns' => ['name', 'email', 'phone'],
],
```

#### 3. 상세 검색 (custom_search)

```php
'custom_search' => [
    [
        'alias'     => 'search_name',
        'title'     => '이름',
        'type'      => 'string',
        'db_column' => 'name',
        'width'     => null,
    ],
    [
        'alias'     => 'search_status',
        'title'     => '상태',
        'type'      => 'select',
        'db_column' => 'status',
        'options'   => [
            ''        => '전체',
            'active'  => '활성',
            'inactive'=> '비활성',
        ],
    ],
],
```

#### 4. 폼 레이아웃 (form_layout_add, form_layout_modify)

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
    ['type' => 'heading', 'title' => '추가 정보'],

    // 구분선
    ['type' => 'divider'],

    // HTML 컨텐츠
    [
        'type' => 'html',
        'content' => '<div class="alert alert-info">알림 메시지</div>',
    ],
],
```

#### 5. 상세보기 설정 (view_fields, view_layout)

```php
// 상세보기 전용 필드 (null이면 form_fields_modify 사용)
'view_fields' => [
    ['alias' => 'name', 'title' => '이름'],
    ['alias' => 'email', 'title' => '이메일'],
    ['alias' => 'status', 'title' => '상태', 'type' => 'select', 'options' => [...]],
],

// 상세보기 전용 레이아웃 (null이면 form_layout_modify 사용)
'view_layout' => [
    'name',
    'email',
    ['type' => 'row', 'col_class' => 'col-md-6', 'fields' => ['phone', 'status']],
],
```

## 코드 생성

### 기본 실행

```bash
php generate.php config.sample.php
```

### 파일 덮어쓰기

생성 중 기존 파일이 있으면 확인 메시지가 표시됩니다:

```
⚠ 파일이 이미 존재합니다: /path/to/file.php
덮어쓰시겠습니까? [y/N]:
```

- `y` 입력: 파일 덮어쓰기
- `N` 또는 Enter: 건너뛰기

### 자동 덮어쓰기

```bash
echo -e "y\ny" | php generate.php config.sample.php
```

## 생성되는 파일

### Module 파일 (list.php)

PHP 백엔드 로직을 포함:

- `fnc_list()`: 메인 라우팅 함수
- `handleListAction()`: 목록 조회 (Ajax)
- `handleAddAction()`: 신규 추가 (Ajax)
- `handleGetAction()`: 상세 조회 (Ajax)
- `handleModifyAction()`: 수정 (Ajax)
- `handleDeleteAction()`: 삭제 (Ajax)

### Template 파일 (list.html)

HTML + JavaScript + CSS 프론트엔드:

- DataTables 테이블
- 검색 필터 (통합 검색, 상세 검색)
- CRUD 모달 (추가, 상세보기, 수정)
- 이벤트 핸들러 (버튼 클릭, 폼 제출 등)

## 주요 기능

### 1. 목록 조회

- DataTables 기반 목록 표시
- 서버사이드 처리 (페이징, 정렬, 검색)
- 컬럼 정렬, 순서 변경(ColReorder)
- 키보드 네비게이션(KeyTable)

### 2. 검색 기능

**통합 검색**
- 상단 검색창에서 여러 컬럼 동시 검색
- DataTables 기본 검색 기능

**상세 검색**
- 컬럼별 개별 검색
- 다양한 검색 타입 지원:
  - `string`: 텍스트 LIKE 검색
  - `select`: 드롭다운 선택
  - `radio`: 라디오 버튼
  - `dateRange`: 날짜 범위
  - `datetimeRange`: 날짜+시간 범위
  - `numberRange`: 숫자 범위

### 3. CRUD 기능

**추가 (Add)**
- 모달 폼으로 데이터 입력
- 필드 유효성 검사
- Ajax 전송 및 테이블 자동 갱신

**상세보기 (View)**
- 읽기 전용 모달
- 깔끔한 컨텐츠 표시 형식
- select 필드는 label 표시

**수정 (Modify)**
- 모달 폼으로 데이터 수정
- Ajax로 기존 데이터 로드
- 수정 후 테이블 자동 갱신

**삭제 (Delete)**
- 확인 메시지 표시
- Ajax 삭제 처리
- 테이블 자동 갱신

### 4. 폼 레이아웃

- **단일 필드**: 세로로 나열
- **Row 그룹**: 여러 필드를 한 줄에 배치
- **소제목**: 섹션 구분
- **구분선**: 시각적 구분
- **HTML 컨텐츠**: 설명, 알림 등 자유 삽입

### 5. 데이터 포맷팅

- **날짜**: `Y-m-d`, `Y-m-d H:i:s` 등
- **숫자**: 천단위 콤마
- **옵션**: select 값을 label로 표시
- **정렬**: 좌/중앙/우 정렬

## 고급 설정

### 컬럼 옵션

```php
[
    'alias'         => 'member_id',        // 컬럼 alias (필수)
    'title'         => '회원 ID',          // 테이블 헤더 타이틀 (필수)
    'column'        => 'm.member_id',      // DB 컬럼명 (alias와 다를 때)
    'align'         => 'center',           // 정렬: left, center, right
    'orderable'     => true,               // 정렬 가능 여부
    'searchable'    => false,              // 통합검색 대상 여부
    'no_export'     => false,              // 엑스포트 제외 여부
    'date_format'   => 'Y-m-d',            // 날짜 포맷
    'number_format' => true,               // 숫자 천단위 콤마
    'is_button'     => false,              // 버튼 컬럼 여부
    'buttons'       => ['view', 'modify', 'delete'], // 버튼 종류
    'options'       => ['key' => 'value'], // select 옵션
],
```

### 필드 타입

**폼 필드 타입**
- `text`: 일반 텍스트
- `email`: 이메일
- `number`: 숫자
- `date`: 날짜
- `password`: 비밀번호
- `select`: 드롭다운
- `textarea`: 여러 줄 텍스트

**검색 필드 타입**
- `string`: 텍스트 검색
- `select`: 드롭다운
- `radio`: 라디오 버튼
- `dateRange`: 날짜 범위
- `datetimeRange`: 날짜+시간 범위
- `numberRange`: 숫자 범위

### DataTables 옵션

```php
'datatables_options' => [
    'stateSave'     => false,              // 상태 저장
    'pageLength'    => 20,                 // 페이지당 행 수
    'lengthChange'  => true,               // 행 수 변경 가능
    'lengthMenu'    => [10, 20, 50, 100],  // 행 수 옵션
    'ordering'      => true,               // 정렬 가능
    'colReorder'    => true,               // 컬럼 순서 변경
    'responsive'    => false,              // 반응형
    'scrollX'       => false,              // 가로 스크롤
    'retrieve'      => true,               // 인스턴스 재사용
    'keys'          => [                   // 키보드 네비게이션
        'enable'    => true,
        'blurable'  => true,
        'columns'   => ':not(:last-child)',
    ],
],
```

### 라이브러리 로딩

```php
'libraries' => [
    'jquery'    => true,   // jQuery
    'bootstrap' => false,  // Bootstrap (layout에서 로딩 시 false)
    'sfui'      => false,  // sfUI (numberRange 검색 시 필요)
    'choices'   => true,   // Choices.js (select 스타일링)
    'flatpickr' => true,   // Flatpickr (날짜 선택)
],
```

## 팁과 권장사항

### 1. Config 파일 관리

- 프로젝트별로 별도의 config 파일 생성
- 버전 관리: `config.sample.php`는 샘플로 유지
- 네이밍: `{프로젝트명}.config.php`

### 2. 생성 후 커스터마이징

생성된 파일은 자유롭게 수정 가능:
- Module 파일: 비즈니스 로직 추가
- Template 파일: UI/UX 개선
- 단, 재생성 시 덮어쓰기 주의

### 3. 점진적 개발

1. 최소 설정으로 먼저 생성
2. 동작 확인
3. 설정 추가 후 재생성
4. 반복

### 4. 디버깅

- Module 파일의 TODO 주석 확인
- 브라우저 개발자 도구로 Ajax 요청 확인
- PHP 에러 로그 확인

## 문제 해결

### 파일이 생성되지 않음

- 디렉토리 권한 확인
- `paths` 설정의 경로가 올바른지 확인
- PHP 에러 메시지 확인

### 모달이 표시되지 않음

- Bootstrap이 정상 로드되었는지 확인
- JavaScript 콘솔 에러 확인
- `libraries` 설정 확인

### 데이터가 표시되지 않음

- Module 파일의 SQL 쿼리 확인
- Ajax 응답 데이터 확인 (개발자 도구)
- DB 테이블과 컬럼명이 일치하는지 확인

### 검색이 작동하지 않음

- `custom_search`의 `db_column` 확인
- Module 파일의 WHERE 절 생성 코드 확인
- Ajax 요청에 `custom_search` 데이터가 포함되는지 확인

## 참고 자료

- **샘플 파일**: `config.sample.php`
- **샘플 SQL**: `docs/sample_members_table.sql`
- **템플릿**: `bin/templates/`
- **DataTables 공식 문서**: https://datatables.net/

## 버전

- **Version**: 2.0.0
- **Last Updated**: 2025-11-24

## 라이선스

ShakeFlat Framework의 라이선스를 따릅니다.
