<?php
/**
 * {{PAGE_TITLE}} - Template 파일
 *
 * 자동 생성됨 - ShakeFlat DataTables Generator
 */
?>

{{LIBRARIES}}
<!-- DataTables CSS/JS -->
<link rel="stylesheet" href="/assets/libs/datatables-2.3.4/datatables.min.css">
<script src="/assets/libs/datatables-2.3.4/datatables.min.js"></script>
<script src="/assets/libs/datatables-2.3.4/i18n/pdf-ko.js"></script>

<!-- ShakeFlat DataTables CSS/JS -->
<link rel="stylesheet" href="/assets/libs/sf-datatables-2.0.0/sf-datatables.css">
<script src="/assets/libs/sf-datatables-2.0.0/sf-datatables.js"></script>

<!-- 페이지 컨텐츠 -->
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
{{PAGE_TITLE_HTML}}{{SEARCH_HTML}}

{{ADD_BUTTON_HTML}}

            <!-- DataTables -->
            <table id="{{TABLE_ID}}" class="table table-striped table-hover"></table>

        </div>
    </div>
</div><!-- /container-fluid -->

{{MODALS_HTML}}

<!-- DataTables 초기화 스크립트 -->
<script>
$(document).ready(function() {
    // DataTable 초기화
    const sfdtOptions_{{TABLE_ID}} = {
        ajax: function(data, callback, settings) {
{{SEARCH_DATA_COLLECTION}}

            data.sfdtAction = 'list';
            data.sfdtTableId = '{{TABLE_ID}}';

            $.ajax({
                url: window.location.pathname,
                type: 'POST',
                data: data,
            }).done(function(json, textStatus, jqXHR) {
                sfdtHandleAjaxResponse(json, textStatus, jqXHR, callback, data);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                sfdtHandleAjaxError(jqXHR, textStatus, errorThrown, callback, data);
            });
        },
        order: [[0, 'desc']],
        language: { url: '/assets/libs/datatables-2.3.4/i18n/ko.json' },
        serverSide: true,
        processing: true{{DATATABLES_OPTIONS}},
        columns: {{COLUMNS_JSON}}{{COLUMN_DEFS}}
    };

    // DataTable 초기화 (자동으로 상세검색, 이벤트 바인딩 처리)
    sfdtInitTable('{{TABLE_ID}}', sfdtOptions_{{TABLE_ID}});

{{CRUD_SCRIPTS}}
});
</script>
