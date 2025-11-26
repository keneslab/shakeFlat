<?php
/**
 * ConfigCollector - Config 파일 검증 및 처리
 */

namespace ShakeFlat\Generator;

class ConfigCollector
{
    /**
     * Config 파일 검증 및 경로 생성
     */
    public function validate(array $config): array
    {
        // 경로 설정 기본값
        $this->validatePaths($config);

        // 필수 섹션 확인
        $this->validateBasic($config);
        $this->validateColumns($config);

        // 옵션 섹션 기본값 설정
        if (!isset($config['global_search'])) {
            $config['global_search'] = [
                'enabled' => true,
                'columns' => null,
            ];
        } else {
            if (!isset($config['global_search']['enabled'])) {
                $config['global_search']['enabled'] = true;
            }
            if (!isset($config['global_search']['columns'])) {
                $config['global_search']['columns'] = null;
            }
        }

        if (!isset($config['custom_search'])) {
            $config['custom_search'] = [];
        }

        if (!isset($config['crud'])) {
            $config['crud'] = [
                'enable_add' => false,
                'enable_view' => false,
                'enable_modify' => false,
                'enable_delete' => false,
            ];
        }

        // form_fields 호환성 처리 (구 방식)
        if (isset($config['form_fields']) && !isset($config['form_fields_add']) && !isset($config['form_fields_modify'])) {
            $config['form_fields_add'] = $config['form_fields'];
            $config['form_fields_modify'] = $config['form_fields'];
        }

        if (!isset($config['form_fields_add'])) {
            $config['form_fields_add'] = [];
        }

        if (!isset($config['form_fields_modify'])) {
            $config['form_fields_modify'] = [];
        }

        // form_layout 기본값
        if (!isset($config['form_layout_add'])) {
            $config['form_layout_add'] = null;
        }

        if (!isset($config['form_layout_modify'])) {
            $config['form_layout_modify'] = null;
        }

        // view_fields 및 view_layout 기본값
        if (!isset($config['view_fields'])) {
            $config['view_fields'] = null;  // null이면 form_fields_modify 사용
        }

        if (!isset($config['view_layout'])) {
            $config['view_layout'] = null;  // null이면 form_layout_modify 사용
        }

        if (!isset($config['libraries'])) {
            $config['libraries'] = [
                'jquery' => true,
                'bootstrap' => false,
                'sfui' => false,
                'choices' => true,
                'flatpickr' => true,
            ];
        }

        if (!isset($config['datatables_options'])) {
            $config['datatables_options'] = [
                'stateSave' => false,
                'pageLength' => 20,
                'lengthChange' => true,
                'lengthMenu' => [10, 20, 50, 100],
                'ordering' => true,
                'colReorder' => true,
                'responsive' => false,
                'scrollX' => false,
                'retrieve' => true,
                'keys' => [
                    'enable' => false,
                    'blurable' => true,
                    'columns' => null,
                ],
                'drawCallback' => null,
                'layout' => null,
            ];
        }

        // 편의를 위한 플래그 설정
        $config['enable_add'] = $config['crud']['enable_add'];
        $config['enable_view'] = $config['crud']['enable_view'] ?? false;
        $config['enable_modify'] = $config['crud']['enable_modify'];
        $config['enable_delete'] = $config['crud']['enable_delete'];

        // 버튼 CSS 클래스 기본값
        if (!isset($config['crud']['view_button_class'])) {
            $config['crud']['view_button_class'] = 'btn sfdt-btn-xs sfdt-btn-color-view';
        }
        if (!isset($config['crud']['modify_button_class'])) {
            $config['crud']['modify_button_class'] = 'btn sfdt-btn-xs sfdt-btn-color-modify';
        }
        if (!isset($config['crud']['delete_button_class'])) {
            $config['crud']['delete_button_class'] = 'btn sfdt-btn-xs sfdt-btn-color-delete';
        }
        $config['view_button_class'] = $config['crud']['view_button_class'];
        $config['modify_button_class'] = $config['crud']['modify_button_class'];
        $config['delete_button_class'] = $config['crud']['delete_button_class'];

        $config['load_jquery'] = $config['libraries']['jquery'];
        $config['load_bootstrap'] = $config['libraries']['bootstrap'] ?? false;
        $config['load_sfui'] = $config['libraries']['sfui'];
        $config['load_choices'] = $config['libraries']['choices'];
        $config['load_flatpickr'] = $config['libraries']['flatpickr'];
        $config['load_inputmask'] = $config['libraries']['inputmask'] ?? false;

        // DataTables 옵션 플래그
        $config['dt_stateSave'] = $config['datatables_options']['stateSave'];
        $config['dt_pageLength'] = $config['datatables_options']['pageLength'];
        $config['dt_lengthChange'] = $config['datatables_options']['lengthChange'];
        $config['dt_lengthMenu'] = $config['datatables_options']['lengthMenu'];
        $config['dt_ordering'] = $config['datatables_options']['ordering'];
        $config['dt_colReorder'] = $config['datatables_options']['colReorder'];
        $config['dt_responsive'] = $config['datatables_options']['responsive'];
        $config['dt_scrollX'] = $config['datatables_options']['scrollX'];
        $config['dt_retrieve'] = $config['datatables_options']['retrieve'];
        $config['dt_keys_enable'] = $config['datatables_options']['keys']['enable'];
        $config['dt_keys_blurable'] = $config['datatables_options']['keys']['blurable'];
        $config['dt_keys_columns'] = $config['datatables_options']['keys']['columns'];
        $config['dt_drawCallback'] = $config['datatables_options']['drawCallback'];
        $config['dt_layout'] = $config['datatables_options']['layout'];

        // 경로 생성
        $config['paths'] = $this->generatePaths($config);
        $config['url'] = "/{$config['basic']['module_name']}/{$config['basic']['function_name']}";

        return $config;
    }

    /**
     * 경로 설정 검증 및 기본값 설정
     */
    private function validatePaths(array &$config): void
    {
        if (!isset($config['paths']) || !is_array($config['paths'])) {
            $config['paths'] = [];
        }

        // 기본값 설정
        if (!isset($config['paths']['project_root']) || empty($config['paths']['project_root'])) {
            $config['paths']['project_root'] = SHAKEFLAT_PATH;
        }

        if (!isset($config['paths']['module_dir'])) {
            $config['paths']['module_dir'] = 'sample/modules';
        }

        if (!isset($config['paths']['template_dir'])) {
            $config['paths']['template_dir'] = 'sample/templates/admin';
        }

        // 절대 경로로 변환
        $projectRoot = rtrim($config['paths']['project_root'], '/');
        $config['paths']['project_root'] = $projectRoot;
        $config['paths']['module_dir'] = trim($config['paths']['module_dir'], '/');
        $config['paths']['template_dir'] = trim($config['paths']['template_dir'], '/');
    }

    /**
     * 기본 정보 검증
     */
    private function validateBasic(array &$config): void
    {
        if (!isset($config['basic']) || !is_array($config['basic'])) {
            throw new \Exception("'basic' 섹션이 없거나 올바르지 않습니다.");
        }

        $required = ['module_name', 'function_name', 'table_id', 'db_table', 'page_title'];

        foreach ($required as $key) {
            if (empty($config['basic'][$key])) {
                throw new \Exception("'basic.{$key}' 값이 필수입니다.");
            }
        }

        // show_page_title 기본값 설정
        if (!isset($config['basic']['show_page_title'])) {
            $config['basic']['show_page_title'] = false;
        }
    }

    /**
     * 컬럼 정보 검증
     */
    private function validateColumns(array &$config): void
    {
        if (!isset($config['columns']) || !is_array($config['columns']) || empty($config['columns'])) {
            throw new \Exception("'columns' 섹션이 없거나 비어있습니다. 최소 1개 이상의 컬럼이 필요합니다.");
        }

        foreach ($config['columns'] as $idx => $col) {
            if (!isset($col['alias']) || !isset($col['title'])) {
                throw new \Exception("columns[{$idx}]에 'alias'와 'title'이 필요합니다.");
            }

            // 기본값 설정
            if (!isset($col['width'])) $col['width'] = null;
            if (!isset($col['align'])) $col['align'] = 'left';
            if (!isset($col['orderable'])) $col['orderable'] = true;
            if (!isset($col['searchable'])) $col['searchable'] = false;
            if (!isset($col['visible'])) $col['visible'] = true;
            if (!isset($col['defaultContent'])) $col['defaultContent'] = null;
            if (!isset($col['is_button'])) $col['is_button'] = false;
            if (!isset($col['no_export'])) $col['no_export'] = false;

            $config['columns'][$idx] = $col;
        }
    }

    /**
     * 파일 경로 생성
     */
    private function generatePaths(array $config): array
    {
        $moduleName = $config['basic']['module_name'];
        $functionName = $config['basic']['function_name'];
        $projectRoot = $config['paths']['project_root'];
        $moduleDir = $config['paths']['module_dir'];
        $templateDir = $config['paths']['template_dir'];

        return [
            'module_file' => "{$projectRoot}/{$moduleDir}/{$moduleName}/{$functionName}.php",
            'template_file' => "{$projectRoot}/{$templateDir}/{$moduleName}/{$functionName}.html",
        ];
    }
}
