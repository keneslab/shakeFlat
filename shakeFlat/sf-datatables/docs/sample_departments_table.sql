-- =============================================
-- ShakeFlat DataTables Sample Departments Table
-- LEFT JOIN 테스트용 부서 테이블
-- =============================================

-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS `sf_sample_departments`;

-- 샘플 부서 테이블 생성
CREATE TABLE `sf_sample_departments` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '부서 ID',
  `department_name` varchar(100) NOT NULL COMMENT '부서명',
  `department_code` varchar(20) NOT NULL COMMENT '부서 코드',
  `manager_name` varchar(100) DEFAULT NULL COMMENT '부서장 이름',
  `location` varchar(100) DEFAULT NULL COMMENT '위치',
  `budget` decimal(15,2) DEFAULT 0.00 COMMENT '예산',
  `employee_count` int(11) DEFAULT 0 COMMENT '직원 수',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `uk_department_code` (`department_code`),
  KEY `idx_department_name` (`department_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='샘플 부서 테이블';

-- 샘플 부서 데이터 삽입
INSERT INTO `sf_sample_departments`
(`department_name`, `department_code`, `manager_name`, `location`, `budget`, `employee_count`)
VALUES
('개발팀', 'DEV', '김철수', '서울 본사 3층', 500000000.00, 25),
('디자인팀', 'DESIGN', '이영희', '서울 본사 4층', 200000000.00, 12),
('기획팀', 'PLAN', '박민수', '서울 본사 5층', 150000000.00, 10),
('마케팅팀', 'MKT', '최지혜', '서울 본사 6층', 300000000.00, 15),
('영업팀', 'SALES', '정태영', '서울 본사 2층', 400000000.00, 20),
('인사팀', 'HR', '홍길동', '서울 본사 7층', 100000000.00, 8),
('재무팀', 'FIN', '강수진', '서울 본사 8층', 120000000.00, 7),
('총무팀', 'GA', '윤미래', '서울 본사 9층', 80000000.00, 6),
('IT지원팀', 'IT', '서준호', '서울 본사 3층', 180000000.00, 10),
('고객지원팀', 'CS', '한지민', '서울 본사 1층', 220000000.00, 18);

-- sf_sample_members 테이블에 department_id 컬럼 추가
ALTER TABLE `sf_sample_members`
ADD COLUMN `department_id` int(11) DEFAULT NULL COMMENT '부서 ID' AFTER `member_id`,
ADD KEY `idx_department_id` (`department_id`),
ADD CONSTRAINT `fk_members_department`
  FOREIGN KEY (`department_id`) REFERENCES `sf_sample_departments` (`department_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- sf_sample_members에 부서 배정 (랜덤하게)
UPDATE `sf_sample_members` SET `department_id` = 1 WHERE `member_id` IN (1, 9, 14, 18);   -- 개발팀
UPDATE `sf_sample_members` SET `department_id` = 2 WHERE `member_id` IN (2, 11);          -- 디자인팀
UPDATE `sf_sample_members` SET `department_id` = 3 WHERE `member_id` IN (3, 8);           -- 기획팀
UPDATE `sf_sample_members` SET `department_id` = 4 WHERE `member_id` IN (4, 12, 19);      -- 마케팅팀
UPDATE `sf_sample_members` SET `department_id` = 5 WHERE `member_id` IN (6, 7, 17);       -- 영업팀
UPDATE `sf_sample_members` SET `department_id` = 6 WHERE `member_id` IN (5);              -- 인사팀
UPDATE `sf_sample_members` SET `department_id` = 7 WHERE `member_id` IN (15);             -- 재무팀
UPDATE `sf_sample_members` SET `department_id` = 8 WHERE `member_id` IN (13);             -- 총무팀
UPDATE `sf_sample_members` SET `department_id` = 9 WHERE `member_id` IN (10);             -- IT지원팀
UPDATE `sf_sample_members` SET `department_id` = 10 WHERE `member_id` IN (16, 20);        -- 고객지원팀

-- 테이블 정보 확인
DESCRIBE `sf_sample_departments`;

-- 데이터 개수 확인
SELECT COUNT(*) as total_departments FROM `sf_sample_departments`;

-- JOIN 테스트 쿼리
SELECT
    m.member_id,
    m.name,
    m.email,
    m.status,
    d.department_name,
    d.department_code,
    d.manager_name
FROM sf_sample_members m
LEFT JOIN sf_sample_departments d ON m.department_id = d.department_id
ORDER BY m.member_id
LIMIT 10;

-- 부서별 회원 수 확인
SELECT
    d.department_name,
    COUNT(m.member_id) as member_count
FROM sf_sample_departments d
LEFT JOIN sf_sample_members m ON d.department_id = m.department_id
GROUP BY d.department_id, d.department_name
ORDER BY member_count DESC;
