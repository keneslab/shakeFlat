# shakeFlat Framework

shakeFlat은 PHP 기반의 경량 웹 애플리케이션 프레임워크입니다. 빠른 개발과 유지보수를 목표로 설계되었으며, 직관적인 구조와 강력한 기능을 제공합니다.

## 주요 특징

- **경량 프레임워크**: 최소한의 의존성으로 빠른 성능 제공
- **모듈화된 구조**: 필요한 기능만 선택적으로 사용 가능
- **라우팅 시스템**: 유연한 URL 라우팅 및 요청 처리
- **템플릿 엔진**: 효율적인 뷰 렌더링 시스템
- **다국어 지원**: 번역 시스템을 통한 국제화 지원
- **보안**: AES-256 암호화, 토큰 인증, CSRF 방어
- **데이터베이스**: PDO 기반 안전한 데이터베이스 연결

## 디렉토리 구조

```
shakeFlat/
├── core/           # 프레임워크 핵심 파일
├── assets/         # CSS, JS, 이미지, 라이브러리
├── config/         # 설정 파일
├── sample/         # 샘플 애플리케이션
│   ├── modules/    # 모듈 (컨트롤러)
│   ├── templates/  # 템플릿 (뷰)
│   └── storage/    # 로그, 업로드, 캐시
└── sf-datatables/  # DataTables 생성기 (v2.0)
```

## 시작하기

### 요구사항

- PHP 7.4 이상
- MySQL 5.7 이상 또는 MariaDB 10.2 이상
- Apache 또는 Nginx 웹서버

### 설치

1. 저장소 클론
```bash
git clone https://github.com/keneslab/shakeFlat.git
cd shakeFlat
```

2. 설정 파일 구성
```bash
cd shakeFlat/config
cp config.production.sample.ini config.ini
# config.ini 파일을 환경에 맞게 수정
```

3. 웹서버 설정 후 접속

## shakeFlat 2.0의 주요 변화

### sf-datatables: 강력한 DataTables 생성기

shakeFlat 2.0의 가장 큰 변화는 **sf-datatables** 도구의 도입입니다. 이는 데이터베이스 테이블을 기반으로 완전한 CRUD 기능을 갖춘 DataTables 페이지를 자동으로 생성하는 코드 제너레이터입니다.

#### sf-datatables 주요 특징

- **자동 코드 생성**: 데이터베이스 스키마를 분석하여 모듈과 템플릿 자동 생성
- **완전한 CRUD**: Create, Read, Update, Delete 기능 즉시 사용 가능
- **DataTables 통합**: 정렬, 검색, 페이징 등 고급 테이블 기능 내장
- **커스터마이징 가능**: 생성된 코드를 프로젝트에 맞게 수정 가능
- **시간 절약**: 반복적인 CRUD 개발 시간 대폭 단축

#### 사용 방법

```bash
cd shakeFlat/sf-datatables/bin
php generate.php config.sample.php
```

설정 파일에서 데이터베이스 연결 정보와 생성할 테이블을 지정하면, 완전한 관리 페이지가 자동으로 생성됩니다.

자세한 내용은 [sf-datatables 문서](shakeFlat/sf-datatables/docs/README.md)를 참조하세요.

## 라이브러리

shakeFlat은 다음과 같은 강력한 라이브러리를 포함하고 있습니다:

- **Bootstrap 5.3.3**: 반응형 UI 프레임워크
- **jQuery 3.7.1**: JavaScript 라이브러리
- **DataTables 2.3.4**: 고급 테이블 기능
- **sfUI 1.0.0**: 커스텀 UI 컴포넌트 (Alert, Modal, Sidebar, LightBox 등)
- **Choices.js**: 향상된 Select 박스
- **Flatpickr**: 날짜/시간 선택기
- **Font Awesome**: 아이콘 라이브러리

## 개발 환경

### 디버그 모드

`config.ini` 파일에서 디버그 모드를 활성화할 수 있습니다:

```ini
[debug]
enabled = true
display_errors = true
log_errors = true
```

### 로그

로그 파일은 `sample/storage/logs/` 디렉토리에 날짜별로 저장됩니다.

## 라이선스

이 프로젝트는 오픈소스이며, 자유롭게 사용 및 수정할 수 있습니다.

## 기여

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다.

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해 주세요.
