-- =============================================
-- ShakeFlat DataTables Sample Table
-- 새로운 DataTables 시스템 테스트용 샘플 테이블
-- =============================================

-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS `sf_sample_members`;

-- 샘플 회원 테이블 생성
CREATE TABLE `sf_sample_members` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '회원 ID',
  `name` varchar(100) NOT NULL COMMENT '이름',
  `email` varchar(255) NOT NULL COMMENT '이메일',
  `phone` varchar(20) DEFAULT NULL COMMENT '전화번호',
  `password` varchar(255) NOT NULL COMMENT '비밀번호',
  `status` enum('active','inactive','banned') NOT NULL DEFAULT 'active' COMMENT '상태',
  `city` varchar(100) DEFAULT NULL COMMENT '도시',
  `postal_code` varchar(10) DEFAULT NULL COMMENT '우편번호',
  `country` varchar(2) DEFAULT 'KR' COMMENT '국가 코드',
  `address` text DEFAULT NULL COMMENT '주소',
  `birth_date` date DEFAULT NULL COMMENT '생년월일',
  `join_date` date NOT NULL COMMENT '가입일',
  `salary` decimal(12,2) DEFAULT 0.00 COMMENT '연봉',
  `last_login` datetime DEFAULT NULL COMMENT '마지막 로그인',
  `notes` text DEFAULT NULL COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_join_date` (`join_date`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='샘플 회원 테이블';

-- 샘플 데이터 삽입
INSERT INTO `sf_sample_members`
(`name`, `email`, `phone`, `password`, `status`, `city`, `postal_code`, `country`, `address`, `birth_date`, `join_date`, `salary`, `last_login`, `notes`)
VALUES
('김철수', 'kim@example.com', '010-1234-5678', '$2y$10$dummy.hash.value.1', 'active', '서울', '12345', 'KR', '서울시 강남구 테헤란로 123', '1990-01-15', '2020-01-10', 50000000.00, '2024-11-01 10:30:00', '우수 회원'),
('이영희', 'lee@example.com', '010-2345-6789', '$2y$10$dummy.hash.value.2', 'active', '부산', '23456', 'KR', '부산시 해운대구 해운대로 456', '1985-05-20', '2019-06-15', 45000000.00, '2024-11-02 09:15:00', '일반 회원'),
('박민수', 'park@example.com', '010-3456-7890', '$2y$10$dummy.hash.value.3', 'inactive', '대구', '34567', 'KR', '대구시 중구 중앙대로 789', '1992-08-30', '2021-03-20', 42000000.00, '2024-10-25 14:20:00', '휴면 회원'),
('최지혜', 'choi@example.com', '010-4567-8901', '$2y$10$dummy.hash.value.4', 'active', '인천', '45678', 'KR', '인천시 남동구 논현로 101', '1988-12-10', '2018-09-05', 55000000.00, '2024-11-02 11:45:00', 'VIP 회원'),
('정태영', 'jung@example.com', '010-5678-9012', '$2y$10$dummy.hash.value.5', 'banned', '광주', '56789', 'KR', '광주시 서구 상무대로 202', '1995-03-25', '2022-07-18', 38000000.00, '2024-09-30 16:30:00', '정지 회원'),
('홍길동', 'hong@example.com', '010-6789-0123', '$2y$10$dummy.hash.value.6', 'active', '대전', '67890', 'KR', '대전시 유성구 대학로 303', '1987-11-05', '2020-11-22', 48000000.00, '2024-11-01 08:00:00', '일반 회원'),
('강수진', 'kang@example.com', '010-7890-1234', '$2y$10$dummy.hash.value.7', 'active', '울산', '78901', 'KR', '울산시 남구 삼산로 404', '1993-06-18', '2021-02-14', 43000000.00, '2024-11-02 13:20:00', '일반 회원'),
('윤미래', 'yoon@example.com', '010-8901-2345', '$2y$10$dummy.hash.value.8', 'inactive', '세종', '89012', 'KR', '세종시 한누리대로 505', '1991-09-22', '2019-12-01', 46000000.00, '2024-10-20 15:50:00', '휴면 회원'),
('서준호', 'seo@example.com', '010-9012-3456', '$2y$10$dummy.hash.value.9', 'active', '수원', '90123', 'KR', '경기도 수원시 팔달구 효원로 606', '1989-04-08', '2020-05-30', 52000000.00, '2024-11-02 10:10:00', '우수 회원'),
('한지민', 'han@example.com', '010-0123-4567', '$2y$10$dummy.hash.value.10', 'active', '고양', '01234', 'KR', '경기도 고양시 일산동구 중앙로 707', '1994-07-14', '2022-01-08', 40000000.00, '2024-11-01 17:30:00', '일반 회원'),
('송혜교', 'song@example.com', '010-1111-2222', '$2y$10$dummy.hash.value.11', 'active', '서울', '11111', 'KR', '서울시 송파구 올림픽로 808', '1986-02-26', '2018-04-12', 65000000.00, '2024-11-02 12:00:00', 'VIP 회원'),
('유재석', 'yoo@example.com', '010-2222-3333', '$2y$10$dummy.hash.value.12', 'active', '부산', '22222', 'KR', '부산시 진구 센텀로 909', '1990-08-14', '2019-08-25', 58000000.00, '2024-11-02 09:45:00', 'VIP 회원'),
('김태희', 'kim.t@example.com', '010-3333-4444', '$2y$10$dummy.hash.value.13', 'inactive', '대전', '33333', 'KR', '대전시 서구 둔산로 1010', '1992-11-30', '2021-06-19', 41000000.00, '2024-10-15 14:25:00', '휴면 회원'),
('이민호', 'lee.m@example.com', '010-4444-5555', '$2y$10$dummy.hash.value.14', 'active', '서울', '44444', 'KR', '서울시 마포구 월드컵로 1111', '1988-05-17', '2020-09-03', 54000000.00, '2024-11-01 16:15:00', '우수 회원'),
('전지현', 'jun@example.com', '010-5555-6666', '$2y$10$dummy.hash.value.15', 'active', '서울', '55555', 'KR', '서울시 용산구 이태원로 1212', '1985-10-11', '2018-11-28', 62000000.00, '2024-11-02 11:30:00', 'VIP 회원'),
('조인성', 'jo@example.com', '010-6666-7777', '$2y$10$dummy.hash.value.16', 'banned', '인천', '66666', 'KR', '인천시 연수구 송도대로 1313', '1993-03-05', '2022-04-22', 37000000.00, '2024-08-12 13:40:00', '정지 회원'),
('박보영', 'park.b@example.com', '010-7777-8888', '$2y$10$dummy.hash.value.17', 'active', '광주', '77777', 'KR', '광주시 북구 첨단과기로 1414', '1991-01-28', '2021-10-07', 44000000.00, '2024-11-02 10:50:00', '일반 회원'),
('이종석', 'lee.j@example.com', '010-8888-9999', '$2y$10$dummy.hash.value.18', 'active', '울산', '88888', 'KR', '울산시 동구 방어진순환도로 1515', '1987-12-19', '2019-02-16', 49000000.00, '2024-11-01 09:20:00', '일반 회원'),
('수지', 'suzy@example.com', '010-9999-0000', '$2y$10$dummy.hash.value.19', 'active', '서울', '99999', 'KR', '서울시 강남구 압구정로 1616', '1994-10-10', '2022-08-31', 51000000.00, '2024-11-02 15:10:00', '우수 회원'),
('김우빈', 'kim.w@example.com', '010-0000-1111', '$2y$10$dummy.hash.value.20', 'inactive', '부산', '00011', 'KR', '부산시 수영구 광안해변로 1717', '1989-07-16', '2020-03-14', 47000000.00, '2024-09-28 12:35:00', '휴면 회원');

-- 인덱스 확인
SHOW INDEX FROM `sf_sample_members`;

-- 테이블 정보 확인
DESCRIBE `sf_sample_members`;

-- 데이터 개수 확인
SELECT COUNT(*) as total_members FROM `sf_sample_members`;

-- 상태별 회원 수
SELECT status, COUNT(*) as count FROM `sf_sample_members` GROUP BY status;
