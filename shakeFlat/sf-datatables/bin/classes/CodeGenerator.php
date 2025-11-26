<?php
/**
 * CodeGenerator - 템플릿 기반 코드 생성
 */

namespace ShakeFlat\Generator;

class CodeGenerator
{
    private array $config;
    private string $templateDir;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->templateDir = GENERATOR_DIR . '/templates';

        // 컬럼 기본값 병합
        $this->applyColumnDefaults();
    }

    /**
     * 컬럼에 기본값 적용
     * column_defaults에 정의된 값을 각 컬럼에 병합 (개별 컬럼 값이 우선)
     */
    private function applyColumnDefaults(): void
    {
        if (empty($this->config['column_defaults']) || empty($this->config['columns'])) {
            return;
        }

        $defaults = $this->config['column_defaults'];

        foreach ($this->config['columns'] as $idx => $column) {
            // 기본값과 개별 컬럼 값을 병합 (개별 값이 우선)
            $this->config['columns'][$idx] = array_merge($defaults, $column);
        }
    }

    /**
     * 모든 코드 생성
     */
    public function generate(): array
    {
        return [
            'module_file' => $this->generateModuleFile(),
            'template_file' => $this->generateTemplateFile(),
        ];
    }

    /**
     * Module 파일 생성
     */
    private function generateModuleFile(): string
    {
        $template = file_get_contents($this->templateDir . '/ModuleFile.php.tpl');

        $basic = $this->config['basic'];

        $replacements = [
            '{{MODULE_NAME}}' => $basic['module_name'],
            '{{FUNCTION_NAME}}' => $basic['function_name'],
            '{{PAGE_TITLE}}' => $basic['page_title'],
            '{{DB_TABLE}}' => $basic['db_table'],
            '{{SEARCH_HANDLING}}' => $this->generateSearchHandlingCode(),
            '{{PRIMARY_KEY}}' => $this->getPrimaryKeyField(),
            '{{COLUMNS_ARRAY}}' => $this->generateColumnsArray(),
            '{{SELECT_COLUMNS}}' => $this->generateSelectColumns(),
            '{{SELECT_COLUMNS_INDENTED}}' => $this->generateSelectColumnsIndented(),
            '{{LEFT_JOIN_CLAUSE}}' => $this->generateLeftJoinClause(),
            '{{ADD_VALIDATION}}' => $this->generateAddValidation(),
            '{{MODIFY_VALIDATION}}' => $this->generateModifyValidation(),
            '{{ADD_INSERT_EXAMPLE}}' => $this->generateAddInsertExample(),
            '{{MODIFY_UPDATE_EXAMPLE}}' => $this->generateModifyUpdateExample(),
            '{{GET_SELECT_QUERY}}' => $this->generateGetSelectQuery(),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * 컬럼 배열 생성 (정렬용)
     */
    private function generateColumnsArray(): string
    {
        $columns = [];
        foreach ($this->config['columns'] as $col) {
            if (!empty($col['is_button'])) {
                $columns[] = 'null';
            } else {
                $columns[] = "'{$col['alias']}'";
            }
        }
        return '[' . implode(', ', $columns) . ']';
    }

    /**
     * SELECT 컬럼 목록 생성
     */
    private function generateSelectColumns(): string
    {
        $selectColumns = [];

        foreach ($this->config['columns'] as $col) {
            // 버튼 컬럼은 제외
            if (!empty($col['is_button'])) {
                continue;
            }

            $alias = $col['alias'];

            // column 옵션이 있으면 "column as alias" 형태로, 없으면 alias만 사용
            if (isset($col['column']) && $col['column'] !== '') {
                $column = $col['column'];
                // 이미 AS가 포함되어 있는지 확인 (대소문자 구분 없이)
                if (stripos($column, ' as ') !== false) {
                    $selectColumns[] = $column;
                } else {
                    $selectColumns[] = "{$column} AS {$alias}";
                }
            } else {
                $selectColumns[] = $alias;
            }
        }

        return implode(', ', $selectColumns);
    }

    /**
     * SELECT 컬럼 목록 생성 (Pretty SQL용 - 들여쓰기 포함)
     */
    private function generateSelectColumnsIndented(): string
    {
        $selectColumns = [];

        foreach ($this->config['columns'] as $col) {
            // 버튼 컬럼은 제외
            if (!empty($col['is_button'])) {
                continue;
            }

            $alias = $col['alias'];

            // column 옵션이 있으면 "column as alias" 형태로, 없으면 alias만 사용
            if (isset($col['column']) && $col['column'] !== '') {
                $column = $col['column'];
                // 이미 AS가 포함되어 있는지 확인 (대소문자 구분 없이)
                if (stripos($column, ' as ') !== false) {
                    $selectColumns[] = $column;
                } else {
                    $selectColumns[] = "{$column} AS {$alias}";
                }
            } else {
                $selectColumns[] = $alias;
            }
        }

        // 각 컬럼을 줄바꿈과 들여쓰기로 연결
        return '            ' . implode(",\n            ", $selectColumns);
    }

    /**
     * LEFT JOIN 절 생성
     */
    private function generateLeftJoinClause(): string
    {
        if (empty($this->config['left_joins'])) {
            return '';
        }

        $joins = [];
        foreach ($this->config['left_joins'] as $join) {
            if (empty($join['table']) || empty($join['on'])) {
                continue;
            }

            $table = $join['table'];
            $alias = !empty($join['alias']) ? " {$join['alias']}" : '';
            $on = $join['on'];

            $joins[] = "LEFT JOIN {$table}{$alias} ON {$on}";
        }

        return $joins ? "\n        " . implode("\n        ", $joins) : '';
    }

    /**
     * Add Action 의 Param Validation 코드 생성
     */
    private function generateAddValidation(): string
    {
        $validations = [];

        foreach ($this->config['form_fields_add'] ?? [] as $field) {
            // match_with 필드는 제외 (password_confirm 등은 DB에 저장하지 않음)
            if (!empty($field['match_with'])) {
                continue;
            }

            $alias = $field['alias'];
            $paramType = $this->getParamType($field['type'], $field);

            // checkbox 배열 타입 처리 (하나도 체크 안 되면 파라미터가 전달되지 않음)
            $isCheckboxArray = ($field['type'] === 'checkbox' && !empty($field['options']));

            if ($isCheckboxArray) {
                // checkbox 배열: 파라미터가 없어도 통과 (아무것도 체크 안 한 경우)
                $validations[] = "    \$param->check('{$alias}', Param::TYPE_ARRAY);";

                // 배열 요소가 허용된 값인지 검증
                $enumValues = array_map(function($val) {
                    return "'{$val}'";
                }, array_keys($field['options']));
                $enumList = implode(', ', $enumValues);
                $validations[] = "    if (!empty(\$param->{$alias})) {";
                $validations[] = "        foreach (\$param->{$alias} as \$val) {";
                $validations[] = "            if (!in_array(\$val, [{$enumList}])) sfLogExit(\"[:The value of parameter {$alias} is invalid:]\");";
                $validations[] = "        }";
                $validations[] = "    }";
            } else {
                // 일반 필드: options가 있으면 enum으로 전달
                $enumPart = '';
                if (!empty($field['options']) && is_array($field['options'])) {
                    $enumValues = array_map(function($val) {
                        return "'{$val}'";
                    }, array_keys($field['options']));
                    $enumPart = ', [ ' . implode(', ', $enumValues) . ' ]';
                }

                if ($field['required']) {
                    $validations[] = "    \$param->checkKeyValue('{$alias}', Param::{$paramType}{$enumPart});";
                } else {
                    $validations[] = "    \$param->checkKey('{$alias}', Param::{$paramType}{$enumPart});";
                }
            }
        }

        return implode("\n", $validations);
    }    /**
     * Modify Action 의 Param Validation 코드 생성
     */
    private function generateModifyValidation(): string
    {
        $validations = [];

        foreach ($this->config['form_fields_modify'] ?? [] as $field) {
            $alias = $field['alias'];
            $paramType = $this->getParamType($field['type'], $field);

            // checkbox 배열 타입 처리 (하나도 체크 안 되면 파라미터가 전달되지 않음)
            $isCheckboxArray = ($field['type'] === 'checkbox' && !empty($field['options']));

            if ($isCheckboxArray) {
                // checkbox 배열: 파라미터가 없어도 통과 (아무것도 체크 안 한 경우)
                $validations[] = "    \$param->check('{$alias}', Param::TYPE_ARRAY);";

                // 배열 요소가 허용된 값인지 검증
                $enumValues = array_map(function($val) {
                    return "'{$val}'";
                }, array_keys($field['options']));
                $enumList = implode(', ', $enumValues);
                $validations[] = "    if (!empty(\$param->{$alias})) {";
                $validations[] = "        foreach (\$param->{$alias} as \$val) {";
                $validations[] = "            if (!in_array(\$val, [{$enumList}])) sfLogExit(\"[:The value of parameter {$alias} is invalid:]\");";
                $validations[] = "        }";
                $validations[] = "    }";
            } else {
                // 일반 필드: options가 있으면 enum으로 전달
                $enumPart = '';
                if (!empty($field['options']) && is_array($field['options'])) {
                    $enumValues = array_map(function($val) {
                        return "'{$val}'";
                    }, array_keys($field['options']));
                    $enumPart = ', [ ' . implode(', ', $enumValues) . ' ]';
                }

                if ($field['required']) {
                    $validations[] = "    \$param->checkKeyValue('{$alias}', Param::{$paramType}{$enumPart});";
                } else {
                    $validations[] = "    \$param->checkKey('{$alias}', Param::{$paramType}{$enumPart});";
                }
            }
        }        return implode("\n", $validations);
    }

    /**
     * 필드 타입을 Param 타입으로 변환
     */
    private function getParamType(string $fieldType, array $field = []): string
    {
        // checkbox가 options 배열을 가지면 다중 선택 = TYPE_ARRAY
        if ($fieldType === 'checkbox' && !empty($field['options'])) {
            return 'TYPE_ARRAY';
        }
        // radio도 options를 가지지만 단일 선택이므로 TYPE_STRING
        if ($fieldType === 'radio' && !empty($field['options'])) {
            return 'TYPE_STRING';
        }

        $typeMap = [
            'text' => 'TYPE_STRING',
            'email' => 'TYPE_EMAIL',
            'number' => 'TYPE_INT',
            'date' => 'TYPE_DATE',
            'password' => 'TYPE_STRING',
            'select' => 'TYPE_STRING',
            'textarea' => 'TYPE_STRING',
            'hidden' => 'TYPE_STRING',
            'checkbox' => 'TYPE_STRING',  // 단일 checkbox
            'radio' => 'TYPE_STRING',
        ];

        return $typeMap[$fieldType] ?? 'TYPE_STRING';
    }

    /**
     * Add Action의 INSERT 쿼리 예제 생성
     */
    private function generateAddInsertExample(): string
    {
        $dbTable = $this->config['basic']['db_table'];
        $fields = $this->config['form_fields_add'] ?? [];

        // match_with 필드 제외
        $insertFields = [];
        foreach ($fields as $field) {
            if (empty($field['match_with'])) {
                $insertFields[] = $field;
            }
        }

        if (empty($insertFields)) {
            return "    // INSERT 쿼리 예시 없음";
        }

        // 컴럼명 및 파라미터 생성
        $columns = [];
        $params = [];
        $bindEntries = [];
        $arrayProcessing = []; // checkbox 배열 처리 코드

        foreach ($insertFields as $field) {
            $columns[] = $field['alias'];
            $params[] = ':' . $field['alias'];

            $defaultValue = 'null';
            if (isset($field['default'])) {
                if (is_string($field['default'])) {
                    $defaultValue = "'" . $field['default'] . "'";
                } elseif (is_numeric($field['default'])) {
                    $defaultValue = $field['default'];
                }
            }

            // checkbox 배열 처리
            if ($field['type'] === 'checkbox' && !empty($field['options'])) {
                // 배열을 JSON 문자열로 변환 (또는 쉼표로 구분된 문자열)
                $arrayProcessing[] = "    // {$field['alias']} 배열을 JSON 문자열로 변환";
                $arrayProcessing[] = "    \${$field['alias']}_value = !empty(\$param->{$field['alias']}) && is_array(\$param->{$field['alias']}) ? json_encode(\$param->{$field['alias']}) : {$defaultValue};";
                $bindEntries[] = "        '{$field['alias']}' => \${$field['alias']}_value";
            } else {
                $bindEntries[] = "        '{$field['alias']}' => \$param->{$field['alias']} ?? {$defaultValue}";
            }
        }

        // SQL pretty formatting
        $columnsIndented = "            " . implode(",\n            ", $columns);
        $paramsIndented = "            " . implode(",\n            ", $params);
        $bindCode = implode(",\n", $bindEntries);
        $arrayProcessingCode = !empty($arrayProcessing) ? "\n" . implode("\n", $arrayProcessing) . "\n" : "";

        return <<<PHP
    /*{$arrayProcessingCode}
    \$sql = "
        INSERT INTO {$dbTable} (
{$columnsIndented}
        ) VALUES (
{$paramsIndented}
        )
    ";
    \$bind = [
{$bindCode}
    ];
    \$db->query(\$sql, \$bind);
    \$res->success = true;
    \$res->message = '추가되었습니다.';
    */
PHP;
    }

    /**
     * Modify Action의 UPDATE 쿼리 예제 생성
     */
    private function generateModifyUpdateExample(): string
    {
        $dbTable = $this->config['basic']['db_table'];
        $primaryKey = $this->getPrimaryKeyField();
        $fields = $this->config['form_fields_modify'] ?? [];

        if (empty($fields)) {
            return "    // UPDATE 쿼리 예시 없음";
        }

        // SET 절 생성
        $setEntries = [];
        $bindEntries = [];
        $bindEntries[] = "        'id' => \$id";
        $arrayProcessing = []; // checkbox 배열 처리 코드

        foreach ($fields as $field) {
            $setEntries[] = "{$field['alias']} = :{$field['alias']}";

            // checkbox 배열 처리
            if ($field['type'] === 'checkbox' && !empty($field['options'])) {
                // 배열을 JSON 문자열로 변환
                $arrayProcessing[] = "    // {$field['alias']} 배열을 JSON 문자열로 변환";
                $arrayProcessing[] = "    \${$field['alias']}_value = !empty(\$param->{$field['alias']}) && is_array(\$param->{$field['alias']}) ? json_encode(\$param->{$field['alias']}) : null;";
                $bindEntries[] = "        '{$field['alias']}' => \${$field['alias']}_value";
            } else {
                $bindEntries[] = "        '{$field['alias']}' => \$param->{$field['alias']}";
            }
        }

        // SQL pretty formatting
        $setIndented = "            " . implode(",\n            ", $setEntries);
        $bindCode = implode(",\n", $bindEntries);
        $arrayProcessingCode = !empty($arrayProcessing) ? "\n" . implode("\n", $arrayProcessing) . "\n" : "";

        return <<<PHP
    /*{$arrayProcessingCode}
    \$sql = "
        UPDATE {$dbTable}
        SET
{$setIndented}
        WHERE {$primaryKey} = :id
    ";
    \$bind = [
{$bindCode}
    ];
    \$db->query(\$sql, \$bind);
    \$res->success = true;
    \$res->message = '수정되었습니다.';
    */
PHP;
    }

    /**
     * GET 액션용 SELECT 쿼리 생성
     */
    private function generateGetSelectQuery(): string
    {
        $dbTable = $this->config['basic']['db_table'];
        $primaryKey = $this->getPrimaryKeyField();
        $selectColumns = $this->generateSelectColumnsIndented();
        $leftJoinClause = $this->generateLeftJoinClause();

        return <<<PHP
    \$sql = "
        SELECT
{$selectColumns}
        FROM {$dbTable}
{$leftJoinClause}
        WHERE {$primaryKey} = :id
    ";
    \$bind = ['id' => \$id];
    \$rs = \$db->query(\$sql, \$bind);
    \$row = \$db->fetch(\$rs);
PHP;
    }

    /**
     * 상세 검색 HTML 생성
     */
    private function generateSearchHtml(): string
    {
        if (empty($this->config['custom_search'])) {
            return '            <!-- 상세 검색 필드 없음 -->';
        }

        $tableId = strtolower($this->config['basic']['table_id']);

        $html = '            <div class="sfdt-card sfdt-custom-search collapse show" id="sfdt-' . $tableId . '-custom-search">' . "\n";
        $html .= '                <div class="sfdt-card-body">' . "\n";
        $html .= '                    <div class="row gx-3 gy-2">' . "\n";

        foreach ($this->config['custom_search'] as $field) {
            // width 설정 (dateRange, datetimeRange는 기본값 설정)
            $width = $field['width'] ?? null;
            if ($width === null) {
                if ($field['type'] === 'dateRange') {
                    $width = '13.8rem';
                } elseif ($field['type'] === 'datetimeRange') {
                    $width = '18.8rem';
                }
            }

            $widthStyle = '';
            if ($width !== null) {
                $widthStyle = ' style="width: ' . $width . ';"';
            }

            $html .= '                        <div class="col-auto">' . "\n";
            $html .= '                            <div class="sfdt-search-item"' . $widthStyle . '>' . "\n";
            $html .= '                                <label class="form-label" for="sfdt-' . $tableId . '-search-' . $field['alias'] . '">' . $field['title'] . '</label>' . "\n";

            if ($field['type'] === 'string') {
                $html .= '                                <input type="search" id="sfdt-' . $tableId . '-search-' . $field['alias'] . '" name="' . $field['alias'] . '" class="sfdt-form-control sfdt-search-control" placeholder="' . $field['title'] . ' 검색">' . "\n";
            } elseif ($field['type'] === 'select') {
                $html .= '                                <select id="sfdt-' . $tableId . '-search-' . $field['alias'] . '" name="' . $field['alias'] . '" class="sfdt-form-select sfdt-search-control">' . "\n";
                if (!empty($field['options']) && is_array($field['options'])) {
                    foreach ($field['options'] as $value => $label) {
                        $html .= '                                    <option value="' . $value . '">' . $label . '</option>' . "\n";
                    }
                }
                $html .= '                                </select>' . "\n";
            } elseif ($field['type'] === 'radio') {
                $html .= '                                <div class="sfdt-btn-radio-group sfdt-search-control" role="group" data-search-name="' . $field['alias'] . '">' . "\n";
                $isFirst = true;
                if (!empty($field['options']) && is_array($field['options'])) {
                    foreach ($field['options'] as $value => $label) {
                        $html .= '                                    <input type="radio" class="btn-check" name="' . $field['alias'] . '" id="sfdt-' . $tableId . '-search-' . $field['alias'] . '-' . $value . '" value="' . $value . '" autocomplete="off"' . ($isFirst ? ' checked' : '') . '>' . "\n";
                        $html .= '                                    <label class="sfdt-radio-btn" for="sfdt-' . $tableId . '-search-' . $field['alias'] . '-' . $value . '">' . $label . '</label>' . "\n";
                        $isFirst = false;
                    }
                }
                $html .= '                                </div>' . "\n";
            } elseif ($field['type'] === 'dateRange') {
                $html .= '                                <input type="search" id="sfdt-' . $tableId . '-search-' . $field['alias'] . '" name="' . $field['alias'] . '" class="sfdt-form-control sfdt-search-control flatpickr-range" placeholder="날짜 범위 선택">' . "\n";
            } elseif ($field['type'] === 'datetimeRange') {
                $html .= '                                <input type="search" id="sfdt-' . $tableId . '-search-' . $field['alias'] . '" name="' . $field['alias'] . '" class="sfdt-form-control sfdt-search-control flatpickr-datetime-range" placeholder="날짜시간 범위 선택">' . "\n";
            } elseif ($field['type'] === 'numberRange') {
                $html .= '                                <input type="search" id="sfdt-' . $tableId . '-search-' . $field['alias'] . '" name="' . $field['alias'] . '" class="sfdt-form-control sfdt-search-control sfui-range" data-min="' . ($field['min'] ?? 0) . '" data-max="' . ($field['max'] ?? 1000000) . '" placeholder="숫자 범위 선택">' . "\n";
            }

            $html .= '                            </div>' . "\n";
            $html .= '                        </div>' . "\n";
        }

        $html .= '                    </div>' . "\n";
        $html .= '                </div>' . "\n";
        $html .= '            </div>';

        return $html;
    }

    /**
     * 추가 버튼 HTML 생성 (현재는 layout의 topEnd에서 처리)
     */
    private function generateAddButtonHtml(): string
    {
        // 추가 버튼은 이제 layout의 topEnd에 포함됨
        return '';
    }

    /**
     * 모달 HTML 생성
     */
    private function generateModalsHtml(): string
    {
        $html = '';

        // 추가 모달
        if ($this->config['enable_add']) {
            $html .= $this->generateAddModal();
        }

        // 상세보기 모달
        if ($this->config['enable_view']) {
            $html .= $this->generateViewModal();
        }

        // 수정 모달
        if ($this->config['enable_modify']) {
            $html .= $this->generateModifyModal();
        }

        return $html ?: '<!-- 모달 없음 -->';
    }

    /**
     * 추가 모달 HTML 생성
     */
    private function generateAddModal(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $modalWidth = $this->config['crud']['add_modal_width'] ?? null;
        $widthStyle = $modalWidth ? ' style="max-width: ' . $modalWidth . ';"' : '';

        $html = "\n" . '<!-- 추가 모달 -->' . "\n";
        $html .= '<div class="modal fade" id="sfdt-' . $tableId . '-modal-add" tabindex="-1">' . "\n";
        $html .= '    <div class="modal-dialog modal-dialog-centered modal-lg"' . $widthStyle . '>' . "\n";
        $html .= '        <div class="modal-content">' . "\n";
        $html .= '            <div class="modal-header sfdt-background-color-add">' . "\n";
        $html .= '                <h5 class="modal-title">추가</h5>' . "\n";
        $html .= '                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '            <div class="modal-body">' . "\n";
        $html .= '                <form id="sfdt-' . $tableId . '-form-add">' . "\n";

        // layout이 있으면 layout 사용, 없으면 기존 방식
        if (isset($this->config['form_layout_add']) && !empty($this->config['form_layout_add'])) {
            $html .= $this->generateFormLayout($this->config['form_layout_add'], 'add');
        } else {
            foreach ($this->config['form_fields_add'] ?? [] as $field) {
                $html .= $this->generateFormField($field, 'add');
            }
        }

        $html .= '                </form>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '            <div class="modal-footer">' . "\n";
        $html .= '                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>' . "\n";
        $html .= '                <button type="button" class="btn btn-primary" id="sfdt-' . $tableId . '-btn-save-add">저장</button>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '        </div>' . "\n";
        $html .= '    </div>' . "\n";
        $html .= '</div>' . "\n";

        return $html;
    }

    /**
     * 상세보기 모달 HTML 생성
     */
    private function generateViewModal(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $primaryKey = $this->getPrimaryKeyField();
        $modalWidth = $this->config['crud']['view_modal_width'] ?? null;
        $widthStyle = $modalWidth ? ' style="max-width: ' . $modalWidth . ';"' : '';

        $html = "\n" . '<!-- 상세보기 모달 -->' . "\n";
        $html .= '<div class="modal fade" id="sfdt-' . $tableId . '-modal-view" tabindex="-1">' . "\n";
        $html .= '    <div class="modal-dialog modal-dialog-centered modal-lg"' . $widthStyle . '>' . "\n";
        $html .= '        <div class="modal-content">' . "\n";
        $html .= '            <div class="modal-header sfdt-background-color-view">' . "\n";
        $html .= '                <h5 class="modal-title">상세보기</h5>' . "\n";
        $html .= '                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '            <div class="modal-body" id="sfdt-' . $tableId . '-view-content">' . "\n";

        // view_layout이 있으면 사용, 없으면 form_layout_modify 사용
        $viewLayout = $this->config['view_layout'] ?? $this->config['form_layout_modify'] ?? null;
        $viewFields = $this->config['view_fields'] ?? $this->config['form_fields_modify'] ?? [];

        if ($viewLayout && !empty($viewLayout)) {
            $html .= $this->generateViewLayout($viewLayout, $viewFields);
        } else {
            foreach ($viewFields as $field) {
                $html .= $this->generateViewField($field);
            }
        }

        $html .= '            </div>' . "\n";
        $html .= '            <div class="modal-footer">' . "\n";
        $html .= '                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '        </div>' . "\n";
        $html .= '    </div>' . "\n";
        $html .= '</div>' . "\n";

        return $html;
    }

    /**
     * 수정 모달 HTML 생성
     */
    private function generateModifyModal(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $primaryKey = $this->getPrimaryKeyField();
        $modalWidth = $this->config['crud']['modify_modal_width'] ?? null;
        $widthStyle = $modalWidth ? ' style="max-width: ' . $modalWidth . ';"' : '';

        $html = "\n" . '<!-- 수정 모달 -->' . "\n";
        $html .= '<div class="modal fade" id="sfdt-' . $tableId . '-modal-modify" tabindex="-1">' . "\n";
        $html .= '    <div class="modal-dialog modal-dialog-centered modal-lg"' . $widthStyle . '>' . "\n";
        $html .= '        <div class="modal-content">' . "\n";
        $html .= '            <div class="modal-header sfdt-background-color-modify">' . "\n";
        $html .= '                <h5 class="modal-title">수정</h5>' . "\n";
        $html .= '                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '            <div class="modal-body">' . "\n";
        $html .= '                <form id="sfdt-' . $tableId . '-form-modify">' . "\n";
        $html .= '                    <input type="hidden" name="' . $primaryKey . '" id="sfdt-' . $tableId . '-modify-' . $primaryKey . '">' . "\n";

        // layout이 있으면 layout 사용, 없으면 기존 방식
        if (isset($this->config['form_layout_modify']) && !empty($this->config['form_layout_modify'])) {
            $html .= $this->generateFormLayout($this->config['form_layout_modify'], 'modify');
        } else {
            foreach ($this->config['form_fields_modify'] ?? [] as $field) {
                $html .= $this->generateFormField($field, 'modify');
            }
        }

        $html .= '                </form>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '            <div class="modal-footer">' . "\n";
        $html .= '                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>' . "\n";
        $html .= '                <button type="button" class="btn btn-primary" id="sfdt-' . $tableId . '-btn-save-modify">저장</button>' . "\n";
        $html .= '            </div>' . "\n";
        $html .= '        </div>' . "\n";
        $html .= '    </div>' . "\n";
        $html .= '</div>' . "\n";

        return $html;
    }

    /**
     * 폼 레이아웃 HTML 생성
     */
    private function generateFormLayout(array $layout, string $mode): string
    {
        $html = '';

        foreach ($layout as $item) {
            if (isset($item['type'])) {
                if ($item['type'] === 'row') {
                    // Row 그룹 (여러 필드를 한 줄에 배치)
                    $fields = $item['fields'] ?? [];
                    $html .= '                    <div class="row">' . "\n";
                    foreach ($fields as $fieldAlias) {
                        $field = $this->findFieldByAlias($fieldAlias, $mode);
                        if ($field) {
                            $colClass = $item['col_class'] ?? 'col-md-6';
                            $html .= '                        <div class="' . $colClass . '">' . "\n";
                            $html .= $this->generateFormField($field, $mode);
                            $html .= '                        </div>' . "\n";
                        }
                    }
                    $html .= '                    </div>' . "\n";
                } elseif ($item['type'] === 'divider') {
                    // 구분선
                    $html .= '                    <hr class="my-4">' . "\n";
                } elseif ($item['type'] === 'html') {
                    // Static HTML (설명 등)
                    $html .= '                    ' . $item['content'] . "\n";
                } elseif ($item['type'] === 'heading') {
                    // 소제목
                    $html .= '                    <h6 class="sfdt-section-title mt-4 mb-3 pb-2 border-bottom">' . $item['title'] . '</h6>' . "\n";
                }
            } else {
                // 단일 필드 (alias만 있는 경우)
                $field = $this->findFieldByAlias($item, $mode);
                if ($field) {
                    $html .= $this->generateFormField($field, $mode);
                }
            }
        }

        return $html;
    }

    /**
     * alias로 필드 찾기
     */
    private function findFieldByAlias(string $alias, string $mode): ?array
    {
        $fieldsKey = $mode === 'add' ? 'form_fields_add' : 'form_fields_modify';
        foreach ($this->config[$fieldsKey] ?? [] as $field) {
            if ($field['alias'] === $alias) {
                return $field;
            }
        }
        return null;
    }

    /**
     * 폼 필드 HTML 생성
     */
    private function generateFormField(array $field, string $mode): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $fieldId = 'sfdt-' . $tableId . '-' . $mode . '-' . $field['alias'];
        $required = $field['required'] ? 'required' : '';
        $readonly = ($mode === 'view') ? 'readonly' : '';
        $disabled = ($mode === 'view') ? 'disabled' : '';

        $html = '                    <div class="mb-3">' . "\n";
        $html .= '                        <label for="' . $fieldId . '" class="form-label">' . $field['title'];
        if ($field['required'] && $mode !== 'view') {
            $html .= ' <span class="text-danger">*</span>';
        }
        $html .= '</label>' . "\n";

        if ($field['type'] === 'text' || $field['type'] === 'email' || $field['type'] === 'number' || $field['type'] === 'date' || $field['type'] === 'password') {
            $inputType = $field['type'];
            $html .= '                        <input type="' . $inputType . '" name="' . $field['alias'] . '" id="' . $fieldId . '" class="sfdt-form-control" ' . $required . ' ' . $readonly . '>' . "\n";
        } elseif ($field['type'] === 'select') {
            $html .= '                        <select name="' . $field['alias'] . '" id="' . $fieldId . '" class="sfdt-form-select" ' . $required . ' ' . $disabled . '>' . "\n";
            if (!empty($field['options']) && is_array($field['options'])) {
                foreach ($field['options'] as $value => $label) {
                    $html .= '                            <option value="' . $value . '">' . $label . '</option>' . "\n";
                }
            }
            $html .= '                        </select>' . "\n";
        } elseif ($field['type'] === 'radio') {
            // Radio 타입 - radio_type로 구분 (group 또는 default)
            $radioType = $field['radio_type'] ?? 'default';

            if ($radioType === 'group') {
                // 버튼 그룹 스타일 - label 아래에 control 표시
                $html .= '                        <div>' . "\n";
                $html .= '                            <div class="sfdt-btn-radio-group" role="group" data-field-name="' . $field['alias'] . '">' . "\n";
                if (!empty($field['options']) && is_array($field['options'])) {
                    foreach ($field['options'] as $value => $label) {
                        $radioId = $fieldId . '-' . $value;
                        $checked = (isset($field['default']) && $field['default'] == $value) ? 'checked' : '';
                        $html .= '                                <input type="radio" class="btn-check" name="' . $field['alias'] . '" id="' . $radioId . '" value="' . $value . '" autocomplete="off" ' . $checked . ' ' . $disabled . '>' . "\n";
                        $html .= '                                <label class="sfdt-radio-btn" for="' . $radioId . '">' . $label . '</label>' . "\n";
                    }
                }
                $html .= '                            </div>' . "\n";
                $html .= '                        </div>' . "\n";
            } else {
                // 일반 라디오 버튼 스타일
                // layout 옵션: vertical(기본값), horizontal, inline
                $layout = $field['layout'] ?? 'vertical';
                // gap 옵션: CSS gap 값 (예: '10px', '1rem', '0.5rem')
                $gap = $field['gap'] ?? null;

                $containerClass = '';
                $containerStyle = '';

                if ($layout === 'horizontal') {
                    $containerClass = 'd-flex flex-wrap';
                    $containerStyle = $gap ? 'gap: ' . $gap . ';' : 'gap: 1rem;';
                } elseif ($layout === 'inline') {
                    $containerClass = 'd-flex flex-wrap align-items-center';
                    $containerStyle = $gap ? 'gap: ' . $gap . ';' : 'gap: 0.75rem;';
                } else {
                    // vertical (기본값)
                    $containerStyle = $gap ? 'display: flex; flex-direction: column; gap: ' . $gap . ';' : '';
                }

                $html .= '                        <div class="' . $containerClass . '"';
                if ($containerStyle) {
                    $html .= ' style="' . $containerStyle . '"';
                }
                $html .= '>' . "\n";

                if (!empty($field['options']) && is_array($field['options'])) {
                    foreach ($field['options'] as $value => $label) {
                        $radioId = $fieldId . '-' . $value;
                        $checked = (isset($field['default']) && $field['default'] == $value) ? 'checked' : '';

                        if ($layout === 'inline') {
                            $html .= '                            <div class="sfdt-form-check sfdt-form-check-inline">' . "\n";
                        } else {
                            $html .= '                            <div class="sfdt-form-check">' . "\n";
                        }
                        $html .= '                                <input class="sfdt-form-check-input" type="radio" name="' . $field['alias'] . '" id="' . $radioId . '" value="' . $value . '" ' . $checked . ' ' . $disabled . '>' . "\n";
                        $html .= '                                <label class="sfdt-form-check-label" for="' . $radioId . '">' . $label . '</label>' . "\n";
                        $html .= '                            </div>' . "\n";
                    }
                }
                $html .= '                        </div>' . "\n";
            }
        } elseif ($field['type'] === 'checkbox') {
            // Checkbox 타입 - 단일 또는 다중 선택
            // validate_required: required일 때 실제로 체크 검증 여부 (기본값: true)
            $validateRequired = $field['validate_required'] ?? true;
            $requiredAttr = ($field['required'] && $validateRequired && $mode !== 'view') ? 'required' : '';

            // layout 옵션: vertical(기본값), horizontal, inline
            $layout = $field['layout'] ?? 'vertical';
            // gap 옵션: CSS gap 값 (예: '10px', '1rem', '0.5rem')
            $gap = $field['gap'] ?? null;

            if (!empty($field['options']) && is_array($field['options'])) {
                // 다중 체크박스 (options가 있는 경우)
                $containerClass = '';
                $containerStyle = '';

                if ($layout === 'horizontal') {
                    $containerClass = 'd-flex flex-wrap';
                    $containerStyle = $gap ? 'gap: ' . $gap . ';' : 'gap: 1rem;';
                } elseif ($layout === 'inline') {
                    $containerClass = 'd-flex flex-wrap align-items-center';
                    $containerStyle = $gap ? 'gap: ' . $gap . ';' : 'gap: 0.75rem;';
                } else {
                    // vertical (기본값)
                    $containerStyle = $gap ? 'display: flex; flex-direction: column; gap: ' . $gap . ';' : '';
                }

                $html .= '                        <div class="' . $containerClass . '"';
                if ($containerStyle) {
                    $html .= ' style="' . $containerStyle . '"';
                }
                $html .= '>' . "\n";

                $firstCheckbox = true;
                foreach ($field['options'] as $value => $label) {
                    $checkboxId = $fieldId . '-' . $value;
                    $checkboxRequired = ($firstCheckbox && $requiredAttr) ? $requiredAttr : '';
                    $firstCheckbox = false;

                    if ($layout === 'inline') {
                        $html .= '                            <div class="sfdt-form-check sfdt-form-check-inline">' . "\n";
                    } else {
                        $html .= '                            <div class="sfdt-form-check">' . "\n";
                    }
                    $html .= '                                <input class="sfdt-form-check-input" type="checkbox" name="' . $field['alias'] . '[]" id="' . $checkboxId . '" value="' . $value . '" ' . $checkboxRequired . ' ' . $disabled . '>' . "\n";
                    $html .= '                                <label class="sfdt-form-check-label" for="' . $checkboxId . '">' . $label . '</label>' . "\n";
                    $html .= '                            </div>' . "\n";
                }
                $html .= '                        </div>' . "\n";
            } else {
                // 단일 체크박스
                $html .= '                        <div class="sfdt-form-check">' . "\n";
                $html .= '                            <input class="sfdt-form-check-input" type="checkbox" name="' . $field['alias'] . '" id="' . $fieldId . '" value="1" ' . $requiredAttr . ' ' . $disabled . '>' . "\n";
                $html .= '                            <label class="sfdt-form-check-label" for="' . $fieldId . '">' . "\n";
                $html .= '                                ' . ($field['checkbox_label'] ?? '동의합니다') . "\n";
                $html .= '                            </label>' . "\n";
                $html .= '                        </div>' . "\n";
            }
        } elseif ($field['type'] === 'textarea') {
            $html .= '                        <textarea name="' . $field['alias'] . '" id="' . $fieldId . '" class="sfdt-form-control" rows="3" ' . $required . ' ' . $readonly . '></textarea>' . "\n";
        }

        // description이 있으면 출력 (view 모드에서는 제외)
        if (!empty($field['description']) && $mode !== 'view') {
            $html .= '                        <small class="text-muted">' . $field['description'] . '</small>' . "\n";
        }

        $html .= '                    </div>' . "\n";

        return $html;
    }

    /**
     * 상세보기 레이아웃 HTML 생성
     */
    private function generateViewLayout(array $layout, array $viewFields): string
    {
        $html = '';

        foreach ($layout as $item) {
            if (isset($item['type'])) {
                if ($item['type'] === 'row') {
                    // Row 그룹 (여러 필드를 한 줄에 배치)
                    $fields = $item['fields'] ?? [];
                    $html .= '                    <div class="row">' . "\n";
                    foreach ($fields as $fieldAlias) {
                        $field = $this->findFieldInArray($fieldAlias, $viewFields);
                        if ($field) {
                            $colClass = $item['col_class'] ?? 'col-md-6';
                            $html .= '                        <div class="' . $colClass . '">' . "\n";
                            $html .= $this->generateViewField($field);
                            $html .= '                        </div>' . "\n";
                        }
                    }
                    $html .= '                    </div>' . "\n";
                } elseif ($item['type'] === 'divider') {
                    // 구분선
                    $html .= '                    <hr class="my-4">' . "\n";
                } elseif ($item['type'] === 'html') {
                    // Static HTML (설명 등)
                    $html .= '                    ' . $item['content'] . "\n";
                } elseif ($item['type'] === 'heading') {
                    // 소제목
                    $html .= '                    <h6 class="sfdt-section-title mt-4 mb-3 pb-2 border-bottom">' . $item['title'] . '</h6>' . "\n";
                }
            } else {
                // 단일 필드 (alias만 있는 경우)
                $field = $this->findFieldInArray($item, $viewFields);
                if ($field) {
                    $html .= $this->generateViewField($field);
                }
            }
        }

        return $html;
    }

    /**
     * 필드 배열에서 alias로 필드 찾기
     */
    private function findFieldInArray(string $alias, array $fields): ?array
    {
        foreach ($fields as $field) {
            if ($field['alias'] === $alias) {
                return $field;
            }
        }
        return null;
    }

    /**
     * 상세보기 필드 HTML 생성 (읽기 전용 표시)
     */
    private function generateViewField(array $field): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $fieldId = 'sfdt-' . $tableId . '-view-' . $field['alias'];

        $html = '                    <div class="mb-3">' . "\n";
        $html .= '                        <label class="form-label fw-bold">' . $field['title'] . '</label>' . "\n";

        if ($field['type'] === 'textarea') {
            $html .= '                        <div class="sfdt-view-field" id="' . $fieldId . '" style="white-space: pre-wrap;"></div>' . "\n";
        } elseif ($field['type'] === 'select' || $field['type'] === 'radio') {
            $html .= '                        <div class="sfdt-view-field" id="' . $fieldId . '" data-type="select"';
            if (!empty($field['options'])) {
                $optionsJson = htmlspecialchars(json_encode($field['options'], JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8');
                $html .= ' data-options=\'' . $optionsJson . '\'';
            }
            $html .= '></div>' . "\n";
        } elseif ($field['type'] === 'checkbox') {
            // checkbox는 배열이나 단일 값으로 저장될 수 있음
            $html .= '                        <div class="sfdt-view-field" id="' . $fieldId . '" data-type="checkbox"';
            if (!empty($field['options'])) {
                $optionsJson = htmlspecialchars(json_encode($field['options'], JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8');
                $html .= ' data-options=\'' . $optionsJson . '\'';
            }
            $html .= '></div>' . "\n";
        } else {
            $html .= '                        <div class="sfdt-view-field" id="' . $fieldId . '"></div>' . "\n";
        }

        $html .= '                    </div>' . "\n";

        return $html;
    }

    /**
     * 검색 데이터 수집 JavaScript 생성
     */
    private function generateSearchDataCollection(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);

        if (empty($this->config['custom_search'])) {
            return '            // 상세 검색 조건 없음';
        }

        $code  = '            // 상세 검색 조건 수집' . "\n";
        $code .= '            const customSearch = {};' . "\n";
        $code .= '            $(\'#sfdt-' . $tableId . '-custom-search .sfdt-search-control\').each(function() {' . "\n";
        $code .= '                let name, value;' . "\n";
        $code .= '                if ($(this).hasClass(\'sfdt-btn-radio-group\')) {' . "\n";
        $code .= '                    // Radio button group' . "\n";
        $code .= '                    name = $(this).data(\'search-name\');' . "\n";
        $code .= '                    value = $(this).find(\'input[type=\"radio\"]:checked\').val();' . "\n";
        $code .= '                } else {' . "\n";
        $code .= '                    // Input, Select 등' . "\n";
        $code .= '                    name = $(this).attr(\'name\');' . "\n";
        $code .= '                    value = $(this).val();' . "\n";
        $code .= '                }' . "\n";
        $code .= '                if (value) {' . "\n";
        $code .= '                    customSearch[name] = value;' . "\n";
        $code .= '                }' . "\n";
        $code .= '            });' . "\n";
        $code .= '            if (Object.keys(customSearch).length > 0) {' . "\n";
        $code .= '                data.custom_search = customSearch;' . "\n";
        $code .= '            }';

        return $code;
    }

    /**
     * 컬럼 JSON 생성
     */
    private function generateColumnsJson(): string
    {
        $columns = [];
        $totalColumns = count($this->config['columns']);

        foreach ($this->config['columns'] as $index => $col) {
            $parts = [];
            $parts[] = sprintf('"originalIndex": %d', $index);
            $parts[] = sprintf('"data": %s', !empty($col['is_button']) ? 'null' : '"' . $col['alias'] . '"');
            $parts[] = sprintf('"title": "%s"', $col['title']);

            // className 생성 (align + no_export)
            $classNames = [];
            $classNames[] = 'text-' . ($col['align'] === 'left' ? 'start' : ($col['align'] === 'center' ? 'center' : 'end'));
            if (!empty($col['no_export'])) {
                $classNames[] = 'sfdt-no-export';
            }
            $parts[] = sprintf('"className": "%s"', implode(' ', $classNames));

            if ($col['width'] !== null) {
                $parts[] = sprintf('"width": "%s"', $col['width']);
            }
            $parts[] = sprintf('"orderable": %s', $col['orderable'] ? 'true' : 'false');
            $parts[] = sprintf('"searchable": %s', $col['searchable'] ? 'true' : 'false');
            if ($col['visible'] === false) {
                $parts[] = '"visible": false';
            }
            if ($col['defaultContent'] !== null) {
                $parts[] = sprintf('"defaultContent": "%s"', $col['defaultContent']);
            }

            $isLast = ($index === $totalColumns - 1);
            $comma = $isLast ? '' : ',';
            $columns[] = sprintf('            { %s }%s', implode(', ', $parts), $comma);
        }

        return "[\n" . implode("\n", $columns) . "\n        ]";
    }

    /**
     * 컬럼 정의 (render 함수) 생성
     */
    private function generateColumnDefs(): string
    {
        $defs = [];

        // 각 컬럼별 포맷팅 처리
        foreach ($this->config['columns'] as $index => $col) {
            // 버튼 컬럼 처리
            if (!empty($col['is_button'])) {
                $tableId = strtolower($this->config['basic']['table_id']);
                $buttons = [];

                // buttons 설정이 있으면 사용, 없으면 기본값 (view, modify, delete)
                $buttonConfigs = $col['buttons'] ?? [];
                if (empty($buttonConfigs)) {
                    // 기본값: enable_view, enable_modify, enable_delete에 따라 자동 추가
                    if ($this->config['enable_view']) {
                        $buttonConfigs[] = 'view';
                    }
                    if ($this->config['enable_modify']) {
                        $buttonConfigs[] = 'modify';
                    }
                    if ($this->config['enable_delete']) {
                        $buttonConfigs[] = 'delete';
                    }
                }

                foreach ($buttonConfigs as $btnConfig) {
                    if ($btnConfig === 'view' && $this->config['enable_view']) {
                        $viewClass = $this->config['view_button_class'];
                        $pkColumn = $this->config['basic']['pk_column'] ?? 'id';
                        $buttons[] = '\'<button type="button" class="' . $viewClass . ' sfdt-btn-view-' . $tableId . '" data-' . $pkColumn . '="\' + row.' . $pkColumn . ' + \'"><i class="bi bi-eye"></i> 상세보기</button>\'';
                    } elseif ($btnConfig === 'modify' && $this->config['enable_modify']) {
                        $modifyClass = $this->config['modify_button_class'];
                        $pkColumn = $this->config['basic']['pk_column'] ?? 'id';
                        $buttons[] = '\'<button type="button" class="' . $modifyClass . ' sfdt-btn-modify-' . $tableId . '" data-' . $pkColumn . '="\' + row.' . $pkColumn . ' + \'"><i class="bi bi-pencil"></i> 수정</button>\'';
                    } elseif ($btnConfig === 'delete' && $this->config['enable_delete']) {
                        $deleteClass = $this->config['delete_button_class'];
                        $buttons[] = '\'<button type="button" class="' . $deleteClass . ' sfdt-btn-delete-' . $tableId . '"><i class="bi bi-trash"></i> 삭제</button>\'';
                    } elseif (is_array($btnConfig) && $btnConfig['type'] === 'custom') {
                        // 커스텀 버튼
                        $customClass = str_replace('{tableId}', $tableId, $btnConfig['class']);
                        $icon = $btnConfig['icon'] ?? '';
                        $label = $btnConfig['label'] ?? '';
                        $iconHtml = $icon ? '<i class="' . $icon . '"></i> ' : '';
                        $buttons[] = '\'<button type="button" class="' . $customClass . '">' . $iconHtml . $label . '</button>\'';
                    }
                }

                if (!empty($buttons)) {
                    $buttonHtml = implode(" + ' ' + ", $buttons);
                    $defs[] = '            {
                targets: ' . $index . ',
                data: null,
                render: function(data, type, row) {
                    return ' . $buttonHtml . ';
                }
            }';
                }
                continue;
            }

            // options 처리 (select 타입 컬럼)
            if (!empty($col['options']) && is_array($col['options'])) {
                $optionsJson = json_encode($col['options'], JSON_UNESCAPED_UNICODE);
                $defs[] = '            {
                targets: ' . $index . ',
                render: function(data, type, row) {
                    const options = ' . $optionsJson . ';
                    return options[data] || data;
                }
            }';
                continue;
            }

            // 날짜 포맷 처리
            if (!empty($col['date_format'])) {
                $format = $col['date_format'];
                $defs[] = '            {
                targets: ' . $index . ',
                render: sfdtDateRenderer(\'' . $format . '\')
            }';
            }

            // 숫자 포맷 처리
            if (!empty($col['number_format'])) {
                $defs[] = '            {
                targets: ' . $index . ',
                render: sfdtNumberRenderer()
            }';
            }
        }

        if (empty($defs)) {
            return '';
        }

        return ',
        columnDefs: [
' . implode(",\n", $defs) . '
        ]';
    }

    /**
     * CRUD 스크립트 생성
     */
    private function generateCrudScripts(): string
    {
        $scripts = [];

        // 공통 AJAX 함수는 CRUD 기능이 하나라도 있으면 추가
        if ($this->config['enable_add'] || $this->config['enable_view'] || $this->config['enable_modify'] || $this->config['enable_delete']) {
            $scripts[] = $this->generateCommonAjaxFunction();
        }

        if ($this->config['enable_add']) {
            $scripts[] = $this->generateAddScript();
        }

        if ($this->config['enable_view']) {
            $scripts[] = $this->generateViewScript();
        }

        if ($this->config['enable_modify']) {
            $scripts[] = $this->generateModifyScript();
        }

        if ($this->config['enable_delete']) {
            $scripts[] = $this->generateDeleteScript();
        }

        // Inputmask 초기화 스크립트 추가
        if ($this->config['load_inputmask']) {
            $inputmaskScript = $this->generateInputmaskScript();
            if (!empty($inputmaskScript)) {
                $scripts[] = $inputmaskScript;
            }
        }

        return implode("\n    \n", $scripts);
    }

    /**
     * 공통 AJAX 요청 함수 생성 (sf-datatables.js 사용)
     */
    private function generateCommonAjaxFunction(): string
    {
        // sf-datatables.js의 sfdtSendAjax 함수를 사용하므로 빈 문자열 반환
        return '';
    }

    /**
     * 추가 스크립트 생성
     */
    private function generateAddScript(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);

        // match_with 필드를 가진 필드 찾기 (비밀번호 확인 등)
        $matchFields = [];
        foreach ($this->config['form_fields_add'] ?? [] as $field) {
            if (!empty($field['match_with'])) {
                $matchFields[] = [
                    'alias' => $field['alias'],
                    'match_with' => $field['match_with'],
                    'title' => $field['title'],
                ];
            }
        }

        // match_with 필드에 대한 change/keyup 이벤트 핸들러 생성
        $matchEventHandlers = '';
        if (!empty($matchFields)) {
            foreach ($matchFields as $matchField) {
                $matchEventHandlers .= <<<JS

    // {$matchField['title']} 일치 확인 이벤트
    $(document).on('change keyup', '#sfdt-{$tableId}-add-{$matchField['alias']}, #sfdt-{$tableId}-add-{$matchField['match_with']}', function() {
        const field_{$matchField['alias']} = document.getElementById('sfdt-{$tableId}-add-{$matchField['alias']}');
        const field_{$matchField['match_with']} = document.getElementById('sfdt-{$tableId}-add-{$matchField['match_with']}');

        if (field_{$matchField['alias']}.value && field_{$matchField['match_with']}.value) {
            if (field_{$matchField['alias']}.value !== field_{$matchField['match_with']}.value) {
                field_{$matchField['alias']}.setCustomValidity('{$matchField['title']}이(가) 일치하지 않습니다.');
            } else {
                field_{$matchField['alias']}.setCustomValidity('');
            }
        } else {
            field_{$matchField['alias']}.setCustomValidity('');
        }
    });
JS;
            }
        }

        return <<<JS
    // 추가 버튼 클릭
    $(document).on('click', '#sfdt-{$tableId}-btn-add', function() {
        $('#sfdt-{$tableId}-form-add')[0].reset();
        $('#sfdt-{$tableId}-modal-add').modal('show');
    });

    // 추가 저장
    $(document).on('click', '#sfdt-{$tableId}-btn-save-add', function() {
        // Form validation 체크
        const form = $('#sfdt-{$tableId}-form-add')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const sfdtFormData = $('#sfdt-{$tableId}-form-add').serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {});

        sfdtSendAjax('add', sfdtFormData, '추가되었습니다.', function() {
            $('#sfdt-{$tableId}-modal-add').modal('hide');
        }, window.sfdtTables['{$tableId}']);
    });
{$matchEventHandlers}
JS;
    }

    /**
     * 상세보기 스크립트 생성
     */
    private function generateViewScript(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $primaryKey = $this->getPrimaryKeyField();
        $pkColumn = $this->config['basic']['pk_column'] ?? 'id';
        $formFields = [];

        // view_fields가 있으면 사용, 없으면 form_fields_modify 사용
        $viewFields = $this->config['view_fields'] ?? $this->config['form_fields_modify'] ?? [];

        foreach ($viewFields as $field) {
            if ($field['type'] === 'select' && !empty($field['options'])) {
                // select 필드는 options에서 label 찾기
                $formFields[] = "                const \$field_{$field['alias']} = $('#sfdt-{$tableId}-view-{$field['alias']}');\n" .
                               "                const options_{$field['alias']} = \$field_{$field['alias']}.data('options');\n" .
                               "                \$field_{$field['alias']}.text(options_{$field['alias']}[data.{$field['alias']}] || data.{$field['alias']} || '-');";
            } else {
                // 일반 필드
                $formFields[] = "                $('#sfdt-{$tableId}-view-{$field['alias']}').text(data.{$field['alias']} || '-');";
            }
        }

        $formFieldsCode = implode("\n", $formFields);

        return <<<JS
    // 상세보기 버튼 클릭
    $(document).on('click', '#{$tableId} .sfdt-btn-view-{$tableId}', function() {
        const pkValue = $(this).data('{$pkColumn}');

        // Ajax로 데이터 조회
        $.ajax({
            url: window.location.pathname,
            type: 'POST',
            data: {
                sfdtAction: 'get',
                sfdtTableId: '{$tableId}',
                {$primaryKey}: pkValue
            },
            dataType: 'json'
        }).done(function(response) {
            if (response && response.data && response.data.success && response.data.success === true && response.data.data) {
                const data = response.data.data;
                // 컨텐츠에 데이터 표시
{$formFieldsCode}

                $('#sfdt-{$tableId}-modal-view').modal('show');
            } else {
                alert(response.data.message || '데이터를 불러오는데 실패했습니다.');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert('데이터 조회 중 오류가 발생했습니다.');
            console.error('Ajax error:', textStatus, errorThrown);
        });
    });
JS;
    }

    /**
     * 수정 스크립트 생성
     */
    private function generateModifyScript(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $primaryKey = $this->getPrimaryKeyField();
        $pkColumn = $this->config['basic']['pk_column'] ?? 'id';
        $formFields = [];

        foreach ($this->config['form_fields_modify'] ?? [] as $field) {
            $formFields[] = "                $('#sfdt-{$tableId}-modify-{$field['alias']}').val(data.{$field['alias']} ?? '');";
        }

        $formFieldsCode = implode("\n", $formFields);

        return <<<JS
    // 수정 버튼 클릭
    $(document).on('click', '#{$tableId} .sfdt-btn-modify-{$tableId}', function() {
        const pkValue = $(this).data('{$pkColumn}');

        // Ajax로 데이터 조회
        $.ajax({
            url: window.location.pathname,
            type: 'POST',
            data: {
                sfdtAction: 'get',
                sfdtTableId: '{$tableId}',
                {$primaryKey}: pkValue
            },
            dataType: 'json'
        }).done(function(response) {
            if (response && response.data && response.data.success && response.data.success === true && response.data.data) {
                const data = response.data.data;
                // 폼에 데이터 설정
                $('#sfdt-{$tableId}-modify-{$primaryKey}').val(data.{$primaryKey});
{$formFieldsCode}

                $('#sfdt-{$tableId}-modal-modify').modal('show');
            } else {
                alert(response.data.message || '데이터를 불러오는데 실패했습니다.');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert('데이터 조회 중 오류가 발생했습니다.');
            console.error('Ajax error:', textStatus, errorThrown);
        });
    });

    // 수정 저장
    $(document).on('click', '#sfdt-{$tableId}-btn-save-modify', function() {
        const sfdtFormData = $('#sfdt-{$tableId}-form-modify').serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {});

        sfdtSendAjax('modify', sfdtFormData, '수정되었습니다.', function() {
            $('#sfdt-{$tableId}-modal-modify').modal('hide');
        }, window.sfdtTables['{$tableId}']);
    });
JS;
    }

    /**
     * 삭제 스크립트 생성
     */
    private function generateDeleteScript(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $primaryKey = $this->getPrimaryKeyField();

        return <<<JS
    // 삭제 버튼 클릭
    $(document).on('click', '#{$tableId} .sfdt-btn-delete-{$tableId}', function() {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        const sfdtData = window.sfdtTables['{$tableId}'].row($(this).parents('tr')).data();
        sfdtSendAjax('delete', {{$primaryKey}: sfdtData.{$primaryKey}}, '삭제되었습니다.', null, window.sfdtTables['{$tableId}']);
    });
JS;
    }

    /**
     * Inputmask 초기화 스크립트 생성
     */
    private function generateInputmaskScript(): string
    {
        $tableId = strtolower($this->config['basic']['table_id']);
        $maskFields = [];

        // custom_search에서 mask 필드 수집
        foreach ($this->config['custom_search'] ?? [] as $field) {
            if (!empty($field['mask'])) {
                $maskFields[] = [
                    'selector' => "#sfdt-{$tableId}-search-{$field['alias']}",
                    'mask' => $field['mask']
                ];
            }
        }

        // form_fields_add에서 mask 필드 수집
        foreach ($this->config['form_fields_add'] ?? [] as $field) {
            if (!empty($field['mask'])) {
                $maskFields[] = [
                    'selector' => "#sfdt-{$tableId}-add-{$field['alias']}",
                    'mask' => $field['mask']
                ];
            }
        }

        // form_fields_modify에서 mask 필드 수집
        foreach ($this->config['form_fields_modify'] ?? [] as $field) {
            if (!empty($field['mask'])) {
                $maskFields[] = [
                    'selector' => "#sfdt-{$tableId}-modify-{$field['alias']}",
                    'mask' => $field['mask']
                ];
            }
        }

        if (empty($maskFields)) {
            return '';
        }

        $maskInitCode = [];
        foreach ($maskFields as $field) {
            $mask = $field['mask'];
            if ($mask === 'currency') {
                $maskInitCode[] = "    Inputmask('currency', { prefix: '', suffix: '원', groupSeparator: ',', digits: 0, autoGroup: true, rightAlign: false }).mask('{$field['selector']}');";
            } elseif ($mask === 'email') {
                $maskInitCode[] = "    Inputmask('email').mask('{$field['selector']}');";
            } else {
                $maskInitCode[] = "    Inputmask('{$mask}').mask('{$field['selector']}');";
            }
        }

        $maskCode = implode("\n", $maskInitCode);

        return <<<JS
    // Inputmask 초기화
{$maskCode}
JS;
    }

    /**
     * Template 파일 생성 - HTML + JS + CSS 직접 생성
     */
    private function generateTemplateFile(): string
    {
        $template = file_get_contents($this->templateDir . '/TemplateFile.html.tpl');

        $basic = $this->config['basic'];

        // 라이브러리 로딩
        $libraries = [];
        if ($this->config['load_jquery']) {
            $libraries[] = file_get_contents($this->templateDir . '/lib_jquery.html.tpl');
        }
        if ($this->config['load_bootstrap']) {
            $libraries[] = file_get_contents($this->templateDir . '/lib_bootstrap.html.tpl');
        }
        if ($this->config['load_choices']) {
            $libraries[] = file_get_contents($this->templateDir . '/lib_choices.html.tpl');
        }
        if ($this->config['load_flatpickr']) {
            $libraries[] = file_get_contents($this->templateDir . '/lib_flatpickr.html.tpl');
        }
        if ($this->config['load_inputmask']) {
            $libraries[] = file_get_contents($this->templateDir . '/lib_inputmask.html.tpl');
        }
        if ($this->config['load_sfui']) {
            $libraries[] = file_get_contents($this->templateDir . '/lib_sfui.html.tpl');
        }

        // 페이지 제목 HTML 생성
        $pageTitleHtml = $basic['show_page_title']
            ? "<h2><?php echo \$res->pageTitle ?? '{$basic['page_title']}'; ?></h2>\n\n"
            : '';

        $replacements = [
            '{{PAGE_TITLE}}' => $basic['page_title'],
            '{{PAGE_TITLE_HTML}}' => $pageTitleHtml,
            '{{TABLE_ID}}' => strtolower($basic['table_id']),
            '{{LIBRARIES}}' => implode("\n", $libraries),
            '{{SEARCH_HTML}}' => $this->generateSearchHtml(),
            '{{ADD_BUTTON_HTML}}' => $this->generateAddButtonHtml(),
            '{{MODALS_HTML}}' => $this->generateModalsHtml(),
            '{{SEARCH_DATA_COLLECTION}}' => $this->generateSearchDataCollection(),
            '{{COLUMNS_JSON}}' => $this->generateColumnsJson(),
            '{{DATATABLES_OPTIONS}}' => $this->generateDataTablesOptions(),
            '{{COLUMN_DEFS}}' => $this->generateColumnDefs(),
            '{{CRUD_SCRIPTS}}' => $this->generateCrudScripts(),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * DataTables 옵션 생성
     */
    private function generateDataTablesOptions(): string
    {
        $options = [];

        // stateSave
        $options[] = 'stateSave: ' . ($this->config['dt_stateSave'] ? 'true' : 'false');

        // pageLength
        $options[] = 'pageLength: ' . $this->config['dt_pageLength'];

        // lengthChange
        $options[] = 'lengthChange: ' . ($this->config['dt_lengthChange'] ? 'true' : 'false');

        // lengthMenu
        if ($this->config['dt_lengthChange']) {
            $menu = json_encode($this->config['dt_lengthMenu']);
            $options[] = 'lengthMenu: ' . $menu;
        }

        // ordering
        $options[] = 'ordering: ' . ($this->config['dt_ordering'] ? 'true' : 'false');

        // colReorder
        if ($this->config['dt_colReorder']) {
            $options[] = 'colReorder: true';
        }

        // responsive
        $options[] = 'responsive: ' . ($this->config['dt_responsive'] ? 'true' : 'false');

        // scrollX
        if ($this->config['dt_scrollX']) {
            $options[] = 'scrollX: true';
        }

        // retrieve
        if ($this->config['dt_retrieve']) {
            $options[] = 'retrieve: true';
        }

        // keys
        if ($this->config['dt_keys_enable']) {
            $keysOptions = [];
            $keysOptions[] = 'blurable: ' . ($this->config['dt_keys_blurable'] ? 'true' : 'false');
            if ($this->config['dt_keys_columns'] !== null) {
                $keysOptions[] = 'columns: \'' . $this->config['dt_keys_columns'] . '\'';
            }
            $options[] = 'keys: { ' . implode(', ', $keysOptions) . ' }';
        }

        // drawCallback - 사용자 정의와 sfdtDrawCallback을 함께 호출
        if ($this->config['dt_drawCallback'] !== null) {
            // 사용자 정의 drawCallback이 있으면 두 개를 모두 호출하는 wrapper 함수 생성
            if (is_array($this->config['dt_drawCallback'])) {
                $userCallback = "";
                foreach($this->config['dt_drawCallback'] as $cb) {
                    $userCallback .= trim($cb) . ' ';
                }
            } else {
                $userCallback = trim($this->config['dt_drawCallback']);
            }
            $options[] = 'drawCallback: function(settings) { sfdtDrawCallback(settings); ' . $userCallback . ' }';
        } else {
            $options[] = 'drawCallback: sfdtDrawCallback';
        }

        // layout
        $layout = $this->generateLayout();
        if ($layout) {
            $options[] = 'layout: ' . $layout;
        }

        return ",\n        " . implode(",\n        ", $options);
    }

    /**
     * Layout 옵션 생성
     */
    private function generateLayout(): string
    {
        $layout = $this->config['dt_layout'];
        $tableId = strtolower($this->config['basic']['table_id']);

        // layout이 null이면 기본 레이아웃 생성
        if ($layout === null) {
            return $this->generateDefaultLayout($tableId);
        }

        // 사용자 정의 layout 처리
        $parts = [];
        foreach (['topStart', 'topEnd', 'bottomStart', 'bottomEnd'] as $position) {
            if (!isset($layout[$position])) {
                continue;
            }

            $value = $layout[$position];

            if ($value === null) {
                $parts[] = "$position: null";
            } elseif (is_string($value)) {
                $parts[] = "$position: '$value'";
            } elseif (is_array($value)) {
                $jsonValue = json_encode($value);
                $parts[] = "$position: $jsonValue";
            }
        }

        if (empty($parts)) {
            return '';
        }

        return "{\n            " . implode(",\n            ", $parts) . "\n        }";
    }

    /**
     * 기본 Layout 생성
     */
    private function generateDefaultLayout(string $tableId): string
    {
        $pageTitle = $this->config['basic']['page_title'];
        $todayDate = date('Y-m-d');
        $hasCustomSearch = !empty($this->config['custom_search']);
        $enableAdd = $this->config['enable_add'];
        $enableGlobalSearch = !empty($this->config['global_search']['enabled']);

        // topStart 구성요소 배열
        $topStartItems = [];

        // global_search가 활성화되어 있으면 search 추가
        if ($enableGlobalSearch) {
            $topStartItems[] = "'search'";

            // global_search가 활성화되어 있을 때만 리셋 버튼 추가
            $buttons = [];
            $buttons[] = '<button type=\"button\" class=\"btn btn-sfdt-search-reset\" data-table-id=\"' . $tableId . '\"><i class=\"bi bi-arrow-clockwise\"></i></button>';

            // 상세검색 버튼 (custom_search가 있을 때만)
            if ($hasCustomSearch) {
                $buttons[] = '<button type=\"button\" class=\"btn btn-sm btn-secondary sfdt-custom-search-toggle\" data-bs-toggle=\"collapse\" data-bs-target=\"#sfdt-' . $tableId . '-custom-search\" data-table-id=\"' . $tableId . '\">상세검색 <i class=\"bi bi-caret-up-fill\"></i></button>';
            }

            $topStartItems[] = "function() { return '" . implode(' ', $buttons) . "'; }";
        } elseif ($hasCustomSearch) {
            // global_search는 비활성화이지만 custom_search가 있는 경우: 상세검색 버튼만
            $topStartItems[] = "function() { return '<button type=\"button\" class=\"btn btn-sm btn-secondary sfdt-custom-search-toggle\" data-bs-toggle=\"collapse\" data-bs-target=\"#sfdt-{$tableId}-custom-search\" data-table-id=\"{$tableId}\">상세검색 <i class=\"bi bi-caret-up-fill\"></i></button>'; }";
        }

        $topStartContent = implode(",\n                ", $topStartItems);

        // topEnd: enable_add가 true이면 추가 버튼 div 포함
        $addButtonDiv = $enableAdd
            ? ",\n                div: { html: `<button type=\"button\" id=\"sfdt-{$tableId}-btn-add\" class=\"btn btn-sm sfdt-btn-color-add\"><i class=\"bi bi-plus-circle\"></i> 추가</button>` }"
            : "";

        return <<<LAYOUT
{
            topStart: [
                {$topStartContent}
            ],
            topEnd: {
                buttons: [
                    {
                        extend: 'print',
                        title: '{$pageTitle}',
                        action: sfdtExportAction,
                        exportOptions: { columns: ':visible:not(.sfdt-no-export)' },
                        customize: function (win) {
                            \$(win.document.body).find('h1').each(function() {
                                \$(this).replaceWith('<h3 class="text-center mb-3">' + \$(this).html() + '</h3>');
                            });
                            \$(win.document.body).find('table').addClass('compact').css('font-size', '9pt').css('text-align', 'center');
                            \$(win.document.body).find('table').find('thead').find('th').css('text-align', 'center');
                        }
                    },
                    {
                        extend: 'pdf',
                        filename: '{$pageTitle}({$todayDate})',
                        action: sfdtExportAction,
                        title: '{$pageTitle}',
                        exportOptions: { columns: ':visible:not(.sfdt-no-export)' },
                        customize: function(doc) {
                            doc.defaultStyle.font = 'hangul';
                            doc.defaultStyle.fontSize = 9;
                            doc.defaultStyle.alignment = 'center';
                            doc.styles.tableHeader = { alignment: 'center', bold: true, fontSize: 9, noWrap: true };

                            let tblIdx = 0;
                            for(let i=0;i<doc.content.length;i++) {
                                if (doc.content[i].table) { tblIdx = i; break; }
                            }
                            if (\$(doc.content[tblIdx].table.body[0]).length > 7) doc.pageOrientation = 'landscape';
                            let mr = doc.content[tblIdx].table.body.length-1; if (mr > 20) mr = 20;
                            let colSum = {}, colCnt = {};
                            for(let j=0;j<doc.content[tblIdx].table.body[0].length;j++) { colSum[j] = 0; colCnt[j] = 0; }
                            for(let i=1;i<=mr;i++) {
                                for(let j=0;j<doc.content[tblIdx].table.body[i].length;j++) {
                                    if (doc.content[tblIdx].table.body[i][j].text.bytes() > 0) {
                                        colCnt[j]++;
                                        colSum[j] += doc.content[tblIdx].table.body[i][j].text.bytes();
                                    }
                                }
                            }
                            let avgSum = 0, colAvg = {};
                            for(let j=0;j<doc.content[tblIdx].table.body[0].length;j++) { colAvg[j] = colSum[j] / colCnt[j]; avgSum += colAvg[j]; }
                            let widths = [];
                            for(let j=0;j<doc.content[tblIdx].table.body[0].length;j++) {
                                widths.push(((colAvg[j] / avgSum) * 100) + "%");
                            }
                            doc.content[tblIdx].table.widths = widths;
                        }
                    },
                    {
                        extend: 'excel',
                        filename: '{$pageTitle}({$todayDate})',
                        action: sfdtExportAction,
                        title: '',
                        exportOptions: { columns: ':visible:not(.sfdt-no-export)' }
                    },
                    {
                        text: '열편집',
                        className: 'sfdt-btn-open-column-config',
                        attr: {
                            'data-table-id': '{$tableId}',
                            'data-server-side': 'true'
                        }
                    }
                ]{$addButtonDiv}
            },
            bottomEnd: [
                'pageLength',
                function() {
                    return `
                        <div class="d-flex align-items-center">
                            <input type="number" name="sfdt-{$tableId}-page-num" class="form-control form-control-sm sfdt-page-jump" min="1" data-table-id="{$tableId}">
                            <div class="input-group-append"><button type="button" class="btn btn-sm sfdt-btn-pagejump" data-table-id="{$tableId}">이동</button></div>
                        </div>
                    `;
                },
                'paging'
            ]
        }
LAYOUT;
    }

    /**
     * 검색 조건 처리 코드 생성 (Module 파일용)
     */
    /**
     * 통합 검색 대상 컬럼 목록 가져오기
     * @return array [['column' => 'name', 'type' => 'like'], ...]
     */
    private function getGlobalSearchColumns(): array
    {
        $columns = [];

        // 1. searchable=true인 컬럼 추가
        foreach ($this->config['columns'] as $col) {
            if (!empty($col['searchable']) && !empty($col['alias']) && empty($col['is_button'])) {
                // search_column 지정 여부 확인 (없으면 alias 사용)
                $searchColumn = $col['search_column'] ?? $col['alias'];
                // search_type 지정 여부 확인 (없으면 like 사용)
                $searchType = $col['search_type'] ?? 'like';

                $columns[] = [
                    'column' => $searchColumn,
                    'type' => $searchType
                ];
            }
        }

        // 2. global_search의 columns 추가 (중복 제거)
        if (isset($this->config['global_search']['columns']) && is_array($this->config['global_search']['columns'])) {
            $existingColumns = array_column($columns, 'column');

            foreach ($this->config['global_search']['columns'] as $col) {
                if (is_string($col)) {
                    // 문자열 형식: 'column_name' -> 기본 like 검색, 컬럼명은 그대로 사용
                    if (!in_array($col, $existingColumns)) {
                        $columns[] = ['column' => $col, 'type' => 'like'];
                    }
                } elseif (is_array($col) && isset($col['column'])) {
                    // 배열 형식: ['column' => 'name', 'type' => 'like|equal', 'search_column' => 'db_column']
                    $columnName = $col['column'];
                    $searchType = $col['type'] ?? 'like';
                    $searchColumn = $col['search_column'] ?? $columnName;

                    // 중복 체크 및 추가/업데이트
                    $found = false;
                    foreach ($columns as &$existing) {
                        if ($existing['column'] === $searchColumn) {
                            $existing['type'] = $searchType; // 타입 업데이트
                            $found = true;
                            break;
                        }
                    }

                    if (!$found) {
                        $columns[] = ['column' => $searchColumn, 'type' => $searchType];
                    }
                }
            }
        }

        return $columns;
    }

    private function generateSearchHandlingCode(): string
    {
        $code = '';

        // 통합 검색 처리
        if (!empty($this->config['global_search']['enabled'])) {
            $searchColumns = $this->getGlobalSearchColumns();
            if (!empty($searchColumns)) {
                $code .= "    // 통합 검색 처리\n";
                $code .= "    \$param->check('search', Param::TYPE_ARRAY);\n";
                $code .= "    if (\$param->search['value']) {\n";
                $code .= "        \$searchValue = trim(\$param->search['value']);\n";
                $code .= "        if (\$searchValue !== '') {\n";
                $code .= "            \$searchWhere = [];\n";
                foreach ($searchColumns as $idx => $colInfo) {
                    $column = $colInfo['column'];
                    $searchType = $colInfo['type'];
                    $bindKey = "global_search_{$idx}";

                    if ($searchType === 'equal') {
                        // equal 검색
                        $code .= "            \$searchWhere[] = '{$column} = :{$bindKey}';\n";
                        $code .= "            \$bind['{$bindKey}'] = \$searchValue;\n";
                    } else {
                        // like 검색 (기본값)
                        $code .= "            \$searchWhere[] = '{$column} LIKE :{$bindKey}';\n";
                        $code .= "            \$bind['{$bindKey}'] = '%' . \$searchValue . '%';\n";
                    }
                }
                $code .= "            \$where[] = '(' . implode(' OR ', \$searchWhere) . ')';\n";
                $code .= "        }\n";
                $code .= "    }\n\n";
            }
        }

        if (empty($this->config['custom_search'])) {
            return $code ?: '    // 검색 조건 없음';
        }

        $code .= "    // 상세 검색 조건 처리 (custom_search 배열)\n";
        $code .= "    \$param->check('custom_search', Param::TYPE_ARRAY);\n";
        $code .= "    if (\$param->custom_search) {\n";

        foreach ($this->config['custom_search'] as $field) {
            $alias = $field['alias'];
            $dbColumn = $field['db_column'];
            $type = $field['type'];

            $code .= "        // {$field['title']} 검색\n";

            // 범위 타입 처리 (dateRange, datetimeRange, numberRange)
            if ($type === 'dateRange') {
                $code .= "        if (!empty(\$param->custom_search['{$alias}'])) {\n";
                $code .= "            if (strpos(\$param->custom_search['{$alias}'], ' to ') !== false) {\n";
                $code .= "                \$dates = explode(' to ', \$param->custom_search['{$alias}']);\n";
                $code .= "                if (count(\$dates) === 2 && preg_match('/^\d{4}-\d{2}-\d{2}$/', \$dates[0]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', \$dates[1])) {\n";
                $code .= "                    \$where[] = \"{$dbColumn} BETWEEN :{$alias}_start AND :{$alias}_end\";\n";
                $code .= "                    \$bind['{$alias}_start'] = \$dates[0];\n";
                $code .= "                    \$bind['{$alias}_end'] = \$dates[1];\n";
                $code .= "                }\n";
                $code .= "            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', \$param->custom_search['{$alias}'])) {\n";
                $code .= "                \$where[] = \"{$dbColumn} >= :{$alias}_start\";\n";
                $code .= "                \$bind['{$alias}_start'] = \$param->custom_search['{$alias}'];\n";
                $code .= "            }\n";
                $code .= "        }\n\n";
            } elseif ($type === 'datetimeRange') {
                $code .= "        if (!empty(\$param->custom_search['{$alias}'])) {\n";
                $code .= "            if (strpos(\$param->custom_search['{$alias}'], ' to ') !== false) {\n";
                $code .= "                \$dates = explode(' to ', \$param->custom_search['{$alias}']);\n";
                $code .= "                if (count(\$dates) === 2 && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', \$dates[0]) && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', \$dates[1])) {\n";
                $code .= "                    \$where[] = \"{$dbColumn} BETWEEN :{$alias}_start AND :{$alias}_end\";\n";
                $code .= "                    \$bind['{$alias}_start'] = \$dates[0];\n";
                $code .= "                    \$bind['{$alias}_end'] = \$dates[1];\n";
                $code .= "                }\n";
                $code .= "            } elseif (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', \$param->custom_search['{$alias}'])) {\n";
                $code .= "                \$where[] = \"{$dbColumn} >= :{$alias}_start\";\n";
                $code .= "                \$bind['{$alias}_start'] = \$param->custom_search['{$alias}'];\n";
                $code .= "            }\n";
                $code .= "        }\n\n";
            } elseif ($type === 'numberRange') {
                $code .= "        if (!empty(\$param->custom_search['{$alias}']) && strpos(\$param->custom_search['{$alias}'], ' - ') !== false) {\n";
                $code .= "            list(\${$alias}_min, \${$alias}_max) = explode(' - ', \$param->custom_search['{$alias}']);\n";
                $code .= "            \${$alias}_min = str_replace(',', '', \${$alias}_min);\n";
                $code .= "            \${$alias}_max = str_replace(',', '', \${$alias}_max);\n";
                $code .= "            if (is_numeric(\${$alias}_min) && is_numeric(\${$alias}_max)) {\n";
                $code .= "                \$where[] = \"{$dbColumn} BETWEEN :{$alias}_min AND :{$alias}_max\";\n";
                $code .= "                \$bind['{$alias}_min'] = \${$alias}_min;\n";
                $code .= "                \$bind['{$alias}_max'] = \${$alias}_max;\n";
                $code .= "            }\n";
                $code .= "        }\n\n";
            } else {
                // string 타입은 LIKE 검색
                if ($type === 'string') {
                    $code .= "        if (!empty(\$param->custom_search['{$alias}'])) {\n";
                    $code .= "            \$where[] = \"{$dbColumn} LIKE :{$alias}\";\n";
                    $code .= "            \$bind['{$alias}'] = \"%{\$param->custom_search['{$alias}']}%\";\n";
                    $code .= "        }\n\n";
                } else {
                    // select 등 나머지는 = 검색
                    $code .= "        if (isset(\$param->custom_search['{$alias}']) && \$param->custom_search['{$alias}'] !== '' && \$param->custom_search['{$alias}'] !== null) {\n";
                    $code .= "            \$where[] = \"{$dbColumn} = :{$alias}\";\n";
                    $code .= "            \$bind['{$alias}'] = \$param->custom_search['{$alias}'];\n";
                    $code .= "        }\n\n";
                }
            }
        }

        $code .= "    }\n";

        return rtrim($code);
    }

    /**
     * 기본키 필드 찾기
     */
    private function getPrimaryKeyField(): string
    {
        // 첫 번째 컬럼을 기본키로 가정
        if (!empty($this->config['columns'])) {
            return $this->config['columns'][0]['alias'];
        }

        return 'id';
    }
}
