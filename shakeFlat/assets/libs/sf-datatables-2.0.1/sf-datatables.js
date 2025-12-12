/**
 * ShakeFlat DataTables JavaScript Library
 * Version: 2.0.1
 */

// 오류 모드 설정: 예외 던지기
$.fn.dataTable.ext.errMode = 'throw';

/**
 * 모달 aria-hidden 에러 방지
 * 모달이 닫힐 때 포커스된 요소의 포커스를 제거하여 aria-hidden 경고 방지
 */
$(document).on('hide.bs.modal', '.modal', function() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
});

/**
 * DataTable 초기화 헬퍼 함수
 * 상세검색 상태 복원, DataTable 초기화, 이벤트 바인딩을 자동으로 처리
 * @param {string} tableId - 테이블 ID (소문자)
 * @param {object} options - DataTables 옵션 객체
 * @returns {object} DataTable 인스턴스
 */
function sfdtInitTable(tableId, options) {
    // 전역 배열 변수 초기화
    if (typeof window.sfdtTables === 'undefined') {
        window.sfdtTables = {};
    }

    // 상세검색 초기 상태 설정 (렌더링 전)
    sfdtPreInitCustomSearchToggle(tableId);

    // DataTable 인스턴스 생성 및 전역 배열에 저장
    const table = $('#' + tableId).DataTable(options);
    window.sfdtTables[tableId] = table;

    // 검색 이벤트 및 Flatpickr 초기화
    sfdtInit(tableId, table);

    // 상세검색 토글 이벤트 초기화 (아이콘 변경 및 localStorage 저장)
    sfdtInitCustomSearchToggle(tableId);

    return table;
}

/**
 * AJAX 응답 처리 (DataTables용)
 * @param {object} json - 서버 응답 JSON
 * @param {string} textStatus - 응답 상태
 * @param {object} jqXHR - jQuery XHR 객체
 * @param {function} callback - DataTables 콜백 함수
 * @param {object} data - 요청 데이터 (draw 값 포함)
 */
function sfdtHandleAjaxResponse(json, textStatus, jqXHR, callback, data) {
    try {
        // Response 구조 검증
        if (typeof json !== 'object') throw new Error("json is not object");
        if (!('error' in json) || !('errCode' in json.error) || !('errMsg' in json.error)) {
            throw new Error("error object is not exist");
        }

        // 에러 코드 확인
        if (json.error.errCode !== 0) {
            if ('errUrl' in json.error && json.error.errUrl) {
                alert(json.error.errMsg);
                window.location.href = json.error.errUrl;
            } else {
                alert(json.error.errMsg);
            }
            callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
            return;
        }

        // DataTables 응답 데이터 검증
        if (!('data' in json) || !('draw' in json.data) || !('recordsTotal' in json.data) ||
            !('recordsFiltered' in json.data) || !('data' in json.data)) {
            throw new Error("data object is not exist");
        }

        callback(json.data);
    } catch (e) {
        alert("서버가 잘못된 응답을 하였습니다. 잠시 후 다시 시도해보세요.");
        console.error("ajax page returns data in wrong:", e);
        console.log("json:", json);
        console.log("textStatus:", textStatus);
        console.log("jqXHR:", jqXHR);
        callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
    }
}

/**
 * AJAX 에러 처리 (DataTables용)
 * @param {object} jqXHR - jQuery XHR 객체
 * @param {string} textStatus - 에러 상태
 * @param {string} errorThrown - 에러 메시지
 * @param {function} callback - DataTables 콜백 함수
 * @param {object} data - 요청 데이터 (draw 값 포함)
 */
function sfdtHandleAjaxError(jqXHR, textStatus, errorThrown, callback, data) {
    alert("서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해보세요.");
    console.error("ajax fail");
    console.log("textStatus:", textStatus);
    console.log("jqXHR:", jqXHR);
    console.log("errorThrown:", errorThrown);
    callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
}

/**
 * 날짜 포맷 렌더러
 * @param {string} format - 날짜 포맷 (YYYY-MM-DD, YYYY-MM-DD HH:mm, Y-m-d, Y-m-d H:i:s 등)
 * @returns {function} DataTables render 함수
 */
function sfdtDateRenderer(format) {
    return function(data, type, row) {
        if (!data || type !== 'display') return data;
        const d = new Date(data);
        if (isNaN(d)) return data;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        // PHP 날짜 형식 지원
        let result = format;
        result = result.replace('Y', year);
        result = result.replace('m', month);
        result = result.replace('d', day);
        result = result.replace('H', hours);
        result = result.replace('i', minutes);
        result = result.replace('s', seconds);

        // JavaScript/Moment.js 형식도 지원
        result = result.replace('YYYY', year);
        result = result.replace('MM', month);
        result = result.replace('DD', day);
        result = result.replace('HH', hours);
        result = result.replace('mm', minutes);
        result = result.replace('ss', seconds);

        return result;
    };
}

/**
 * 숫자 포맷 렌더러
 * @returns {function} DataTables render 함수
 */
function sfdtNumberRenderer() {
    return function(data, type, row) {
        if (type !== 'display' || data === null || data === '') return data;
        return Number(data).toLocaleString('ko-KR');
    };
}

/**
 * 공통 CRUD AJAX 요청 함수
 * @param {string} action - 액션 (add, modify, delete)
 * @param {object} data - 전송할 데이터
 * @param {string} successMsg - 성공 메시지
 * @param {function} onSuccess - 성공 콜백
 * @param {object} table - DataTable 인스턴스
 */
function sfdtSendAjax(action, data, successMsg, onSuccess, table) {
    // sfAjax 로딩 체크
    if (typeof sfAjax !== 'function') {
        console.error('sfAjax is not loaded. Please include sfAjax.js before sf-datatables.js');
        alert('sfAjax 라이브러리가 로딩되지 않았습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
        return;
    }

    // 요청 데이터 구성
    const requestData = Object.assign({sfdtAction: action}, data);

    // sfAjax를 사용하여 요청
    sfAjax(
        window.location.pathname,
        requestData,
        function(response) {
            // 성공 콜백
            const resData = response.data || {};
            if (resData.success) {
                if (typeof noti === 'function') {
                    noti(successMsg);
                } else {
                    alert(successMsg);
                }
                if (onSuccess) onSuccess();
                if (table) table.ajax.reload();
            } else {
                console.log('AJAX error response:', response);
                alert(resData.message || action + ' 실패');
            }
        },
        function(error) {
            // 에러 콜백
            console.error("AJAX error:", error);
            alert('서버 오류가 발생했습니다.');
        },
        null,
        {
            responseMode: 'shakeFlat'
        }
    );
}

/**
 * 검색 이벤트 초기화
 * @param {string} tableId - 테이블 ID (소문자)
 * @param {object} table - DataTable 인스턴스
 */
function sfdtInitSearchEvents(tableId, table) {
    const $customSearch = $('#sfdt-' + tableId + '-custom-search');

    // 검색 컨트롤 change 이벤트
    $customSearch.find('.sfdt-search-control').on('change keyup', function() {
        table.ajax.reload();
    });

    // input[type="search"] x 아이콘 클릭시 change 이벤트 발생
    $customSearch.find('.sfdt-search-control').filter('input[type="search"]').on('search', function() {
        $(this).trigger('change');
    });
}

/**
 * Flatpickr clear 아이콘 설정 헬퍼 함수
 * @param {jQuery} $input - Flatpickr input 요소
 * @param {object} instance - Flatpickr 인스턴스
 */
function sfdtSetupFlatpickrClear($input, instance) {
    const clearIconSvg = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%23666\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M3.646 3.854a.5.5 0 1 1 .708-.708L8 6.793l3.646-3.647a.5.5 0 0 1 .708.708L8.707 8l3.647 3.646a.5.5 0 0 1-.708.708L8 8.707l-3.646 3.647a.5.5 0 0 1-.708-.708L7.293 8 3.646 3.854Z\' stroke=\'%23666\' stroke-width=\'0.8\'/%3E%3C/svg%3E")';

    const updateClearIcon = function() {
        $input.css({
            'background-image': $input.val() ? clearIconSvg : 'none',
            'cursor': $input.val() ? 'pointer' : 'text'
        });
    };

    $input.on('change input', updateClearIcon);
    updateClearIcon();

    $input.on('click', function(e) {
        if ($input.val() && e.offsetX > $input.width() - 30) {
            instance.clear();
            $input.trigger('change');
            e.stopPropagation();
        }
    });
}

/**
 * Flatpickr 초기화 (custom_search 내부의 flatpickr 요소만 처리)
 * @param {string} tableId - 테이블 ID (소문자)
 */
function sfdtInitFlatpickr(tableId) {
    const $customSearch = $('#sfdt-' + tableId + '-custom-search');

    // 날짜 범위 선택 (dateRange)
    $customSearch.find('.flatpickr-range').each(function() {
        const $input = $(this).attr('autocomplete', 'off');
        const instance = $input.flatpickr({
            mode: 'range',
            dateFormat: 'Y-m-d',
            locale: Object.assign({}, flatpickr.l10ns.ko, { rangeSeparator: ' to ' }),
            allowInput: true
        });
        sfdtSetupFlatpickrClear($input, instance);
    });

    // 날짜시간 범위 선택 (datetimeRange)
    $customSearch.find('.flatpickr-datetime-range').each(function() {
        const $input = $(this).attr('autocomplete', 'off');
        const instance = $input.flatpickr({
            mode: 'range',
            enableTime: true,
            dateFormat: 'Y-m-d H:i',
            time_24hr: true,
            locale: Object.assign({}, flatpickr.l10ns.ko, { rangeSeparator: ' to ' }),
            allowInput: true
        });
        sfdtSetupFlatpickrClear($input, instance);
    });
}

/**
 * sfUI RangeSlider 초기화 (custom_search 내부의 sfui-range 요소만 처리)
 * @param {string} tableId - 테이블 ID (소문자)
 */
function sfdtInitRangeSlider(tableId) {
    const $customSearch = $('#sfdt-' + tableId + '-custom-search');

    // custom_search 내부의 sfui-range 요소만 처리
    $customSearch.find('.sfui-range').each(function() {
        $(this).attr('autocomplete', 'off');
        const $input = $(this);
        const min = parseFloat($input.data('min')) || 0;
        const max = parseFloat($input.data('max')) || 1000000;
        const thousands = $input.data('thousands') || ',';
        const prefix = $input.data('prefix') || '';
        const suffix = $input.data('suffix') || '';

        // sfUI RangeSlider 초기화
        const instance = sfUI.rangeslider.init(this, {
            min: min,
            max: max,
            thousands: thousands,
            prefix: prefix,
            suffix: suffix,
            theme: 'auto'
        });

        // apply 이벤트 발생시 change 이벤트 트리거
        this.addEventListener('apply.sfrangeslider', function(e) {
            $input.trigger('change');
        });
    });
}

/**
 * localStorage에서 컬럼 설정 검증
 * @param {string} tableId - 테이블 ID (소문자)
 * @param {object} table - DataTable 인스턴스
 * @returns {object|null} 검증된 설정 객체 또는 null
 */
function sfdtValidateColumnConfig(tableId, table) {
    const savedConfig = localStorage.getItem('sfdt-' + tableId + '-column-config');
    if (!savedConfig) return null;

    try {
        const config = JSON.parse(savedConfig);
        if (!config.order || !config.visibility || !config.original) {
            // 구 버전 형식이면 제거
            localStorage.removeItem('sfdt-' + tableId + '-column-config');
            return null;
        }

        // 현재 테이블의 original 정보 가져오기
        const currentOriginal = {};
        const aoColumns = table.settings()[0].aoColumns;

        aoColumns.forEach(function(colSettings) {
            const originalIdx = colSettings.originalIndex;
            if (originalIdx !== undefined) {
                currentOriginal[originalIdx] = {
                    title: colSettings.sTitle || colSettings.title || '',
                    data: colSettings.data || null
                };
            }
        });

        // original 정보 검증 (컬럼 구조가 변경되었는지 확인)
        const savedKeys = Object.keys(config.original).sort();
        const currentKeys = Object.keys(currentOriginal).sort();

        if (savedKeys.length !== currentKeys.length) {
            // 컬럼 개수가 다르면 설정 제거
            localStorage.removeItem('sfdt-' + tableId + '-column-config');
            return null;
        }

        // 각 컬럼의 title과 data가 일치하는지 확인
        for (let i = 0; i < savedKeys.length; i++) {
            const key = savedKeys[i];
            const saved = config.original[key];
            const current = currentOriginal[key];

            if (!current || saved.title !== current.title || saved.data !== current.data) {
                // 컬럼 정보가 다르면 설정 제거
                localStorage.removeItem('sfdt-' + tableId + '-column-config');
                return null;
            }
        }

        // 검증 통과 - 설정 반환
        return config;
    } catch (e) {
        // JSON 파싱 에러 등이 발생하면 설정 제거
        console.error('Failed to validate column config:', e);
        localStorage.removeItem('sfdt-' + tableId + '-column-config');
        return null;
    }
}

/**
 * 컬럼 설정 적용
 * @param {string} tableId - 테이블 ID
 * @param {object} table - DataTable 인스턴스
 * @param {object} config - 적용할 설정
 */
function sfdtApplyColumnConfigFromStorage(tableId, table, config) {
    if (!config) return;

    try {
        if (config.order && config.order.length > 0) {
            table.colReorder.order(config.order, false);
        }

        if (config.visibility) {
            table.columns().every(function(idx) {
                const colSettings = table.settings()[0].aoColumns[idx];
                const originalIdx = colSettings.originalIndex;
                if (originalIdx !== undefined && config.visibility.hasOwnProperty(originalIdx)) {
                    this.visible(config.visibility[originalIdx], false);
                }
            });
        }
    } catch (e) {
        console.warn('Failed to apply column config:', e);
    }
}

/**
 * drawCallback에서 호출될 통합 함수
 * 테이블이 그려진 후 실행되어야 하는 모든 작업을 여기서 처리
 * @param {object} settings - DataTables settings 객체
 */
function sfdtDrawCallback(settings) {
    // tableId 추출 (settings.sTableId는 대문자를 포함하므로 toLowerCase 필요)
    const tableId = settings.sTableId.toLowerCase();
    const table = window.sfdtTables[tableId];

    if (!table) return;

    // 컬럼 설정 복원 (최초 1회만 실행)
    if (!table._sfdtConfigRestored) {
        const config = sfdtValidateColumnConfig(tableId, table);
        if (config) {
            sfdtApplyColumnConfigFromStorage(tableId, table, config);
        }
        table._sfdtConfigRestored = true;
    }

    // 상세검색 토글 아이콘 초기화 (최초 1회만 실행)
    if (!table._sfdtSearchToggleInitialized) {
        const customSearchElement = $('#sfdt-' + tableId + '-custom-search');
        if (customSearchElement.length > 0) {
            // 임시 스타일 제거
            const tempStyle = document.getElementById('sfdt-' + tableId + '-icon-init');
            if (tempStyle) {
                tempStyle.remove();
            }

            // 아이콘 상태 업데이트
            const isShown = customSearchElement.hasClass('show');
            const toggleButton = $('.sfdt-custom-search-toggle[data-table-id="' + tableId + '"]');
            const iconElement = toggleButton.find('i');

            if (iconElement.length > 0) {
                if (isShown) {
                    iconElement.removeClass('bi-caret-down-fill').addClass('bi-caret-up-fill');
                } else {
                    iconElement.removeClass('bi-caret-up-fill').addClass('bi-caret-down-fill');
                }
            }
        }
        table._sfdtSearchToggleInitialized = true;
    }

    // 컬럼 조정 - DOM이 완전히 준비된 경우에만 실행
    try {
        // 테이블 컨테이너가 DOM에 존재하는지 확인
        const container = table.table().container();
        if (container && document.contains(container)) {
            table.columns.adjust();
        }
    } catch (e) {
        // ResizeObserver 에러는 무시 (DOM이 준비되지 않은 경우)
        if (!e.message || !e.message.includes('ResizeObserver')) {
            console.warn('Column adjust failed in drawCallback:', e);
        }
    }

    // 추가적인 drawCallback 로직이 필요하면 여기에 추가
}

/**
 * 테이블 초기화 (검색 이벤트 + Flatpickr + RangeSlider)
 * @param {string} tableId - 테이블 ID (소문자)
 * @param {object} table - DataTable 인스턴스
 */
function sfdtInit(tableId, table) {
    // 검색 이벤트 초기화
    sfdtInitSearchEvents(tableId, table);

    // custom_search에 flatpickr 요소가 있으면 Flatpickr 초기화
    const $customSearch = $('#sfdt-' + tableId + '-custom-search');
    if ($customSearch.find('.flatpickr-range, .flatpickr-datetime-range').length > 0) {
        sfdtInitFlatpickr(tableId);
    }

    // custom_search에 sfui-range 요소가 있으면 RangeSlider 초기화
    if ($customSearch.find('.sfui-range').length > 0) {
        sfdtInitRangeSlider(tableId);
    }

    // 컬럼 설정은 drawCallback에서 복원됨
}

/**
 * 상세검색 토글 초기화 (DataTables 초기화 전 호출)
 * @param {string} tableId - 테이블 ID (소문자)
 */
function sfdtPreInitCustomSearchToggle(tableId) {
    const toggleStateKey = 'sfdt-' + tableId + '-custom-search-toggle';
    const customSearchElement = $('#sfdt-' + tableId + '-custom-search');

    if (customSearchElement.length === 0) {
        return; // 상세검색 없음
    }

    // localStorage에서 상태 복원
    const savedState = localStorage.getItem(toggleStateKey);
    if (savedState === 'hidden') {
        customSearchElement.removeClass('show');

        // 아이콘도 미리 설정 (닫힌 상태)
        const style = document.createElement('style');
        style.id = 'sfdt-' + tableId + '-icon-init';
        style.textContent = '.sfdt-custom-search-toggle[data-table-id="' + tableId + '"] i { display: none; } ' +
                           '.sfdt-custom-search-toggle[data-table-id="' + tableId + '"]::after { content: "\\F282"; font-family: "bootstrap-icons"; }';
        document.head.appendChild(style);
    }
}

/**
 * 상세검색 토글 초기화 (DataTables 초기화 후 호출)
 * @param {string} tableId - 테이블 ID (소문자)
 */
function sfdtInitCustomSearchToggle(tableId) {
    const toggleStateKey = 'sfdt-' + tableId + '-custom-search-toggle';
    const customSearchElement = $('#sfdt-' + tableId + '-custom-search');

    if (customSearchElement.length === 0) {
        return; // 상세검색 없음
    }

    // 아이콘 업데이트 함수
    const updateIcon = function(isShown) {
        const toggleButton = $('.sfdt-custom-search-toggle[data-table-id="' + tableId + '"]');
        const iconElement = toggleButton.find('i');

        if (iconElement.length > 0) {
            if (isShown) {
                iconElement.removeClass('bi-caret-down-fill').addClass('bi-caret-up-fill');
            } else {
                iconElement.removeClass('bi-caret-up-fill').addClass('bi-caret-down-fill');
            }
        }
    };

    // collapse 이벤트 리스너 - 상태 변경 직전에 아이콘 변경
    // 초기 아이콘 상태는 drawCallback에서 설정됨
    customSearchElement.on('show.bs.collapse', function() {
        updateIcon(true);
        localStorage.setItem(toggleStateKey, 'shown');
    }).on('hide.bs.collapse', function() {
        updateIcon(false);
        localStorage.setItem(toggleStateKey, 'hidden');
    });
}

/**
 * 서버사이드 처리용 내보내기 액션
 */
function sfdtExportAction(e, dt, button, config, cb) {
    var self = this;
    var oldStart = dt.settings()[0]._iDisplayStart;
    dt.one('preXhr', function (e, s, data) {
        // Just this once, load all data from the server...
        data.start = 0;
        data.length = dt.page.info().recordsTotal;
        dt.one('preDraw', function (e, settings) {
            // Call the original action function
            if (button[0].className.indexOf('buttons-copy') >= 0) {
                $.fn.dataTable.ext.buttons.copyHtml5.action.call(self, e, dt, button, config, cb);
            } else if (button[0].className.indexOf('buttons-excel') >= 0) {
                $.fn.dataTable.ext.buttons.excelHtml5.available(dt, config) ?
                    $.fn.dataTable.ext.buttons.excelHtml5.action.call(self, e, dt, button, config, cb) :
                    $.fn.dataTable.ext.buttons.excelFlash.action.call(self, e, dt, button, config, cb);
            } else if (button[0].className.indexOf('buttons-csv') >= 0) {
                $.fn.dataTable.ext.buttons.csvHtml5.available(dt, config) ?
                    $.fn.dataTable.ext.buttons.csvHtml5.action.call(self, e, dt, button, config, cb) :
                    $.fn.dataTable.ext.buttons.csvFlash.action.call(self, e, dt, button, config, cb);
            } else if (button[0].className.indexOf('buttons-pdf') >= 0) {
                $.fn.dataTable.ext.buttons.pdfHtml5.available(dt, config) ?
                    $.fn.dataTable.ext.buttons.pdfHtml5.action.call(self, e, dt, button, config, cb) :
                    $.fn.dataTable.ext.buttons.pdfFlash.action.call(self, e, dt, button, config, cb);
            } else if (button[0].className.indexOf('buttons-print') >= 0) {
                $.fn.dataTable.ext.buttons.print.action(e, dt, button, config, cb);
            }
            dt.one('preXhr', function (e, s, data) {
                // DataTables thinks the first item displayed is index 0, but we're not drawing that.
                // Set the property to what it was before exporting.
                settings._iDisplayStart = oldStart;
                data.start = oldStart;
            });
            // Reload the grid with the original page. Otherwise, API functions like table.cell(this) don't work properly.
            setTimeout(dt.ajax.reload, 0);
            // Prevent rendering of the full data to the DOM
            return false;
        });
    });
    // Requery the server with the new one-time export settings
    dt.ajax.reload();
}

$(document).on("click", "button.sfdt-btn-pagejump", function() {
    let tableId = $(this).data('table-id');
    let page = parseInt($(this).parents('div').prev('input').val(), 10);
    if (page < 1 || !page) page = 1;
    if (page > window.sfdtTables[tableId].page.info().pages) page = window.sfdtTables[tableId].page.info().pages;
    window.sfdtTables[tableId].page(page - 1).draw('page');
    $(this).parents('div').prev('input').val(page);
});

/**
 * 검색 리셋 버튼 클릭 이벤트
 */
$(document).on("click", "button.btn-sfdt-search-reset", function() {
    const tableId = $(this).data('table-id');
    const table = window.sfdtTables[tableId];

    if (!table) return;

    // 통합 검색 초기화
    $('.dataTables_wrapper .dt-search input').val('').trigger('input');
    table.search('');

    // 상세 검색 초기화
    const $customSearch = $('#sfdt-' + tableId + '-custom-search');
    $customSearch.find('.sfdt-search-control').each(function() {
        const $control = $(this);

        // input type에 따라 초기화
        if ($control.is('select')) {
            $control.val('').trigger('change');
        } else if ($control.hasClass('flatpickr-range') || $control.hasClass('flatpickr-datetime-range')) {
            // Flatpickr 인스턴스 초기화
            if ($control[0]._flatpickr) {
                $control[0]._flatpickr.clear();
            }
            $control.val('').trigger('change');
        } else if ($control.hasClass('sfui-range')) {
            // sfUI RangeSlider 초기화
            const min = parseFloat($control.data('min')) || 0;
            const max = parseFloat($control.data('max')) || 1000000;
            if ($control[0].sfRangeSlider) {
                $control[0].sfRangeSlider.reset();
            }
            $control.val('').trigger('change');
        } else {
            // 일반 input
            $control.val('').trigger('change');
        }
    });

    // 테이블 새로고침
    table.ajax.reload();
});

/**
 * 열 편집 모달 관련 기능
 */
$(document).on('click', '.sfdt-btn-open-column-config', function() {
    const tableId = $(this).data('table-id');
    sfdtOpenColumnConfig(tableId);
});

function sfdtOpenColumnConfig(tableId) {
    const table = window.sfdtTables[tableId];
    if (!table) return;

    const modalId = 'sfdt-modal-column-config-' + tableId;
    const $modal = $('#' + modalId);

    // 모달 HTML 생성 (없으면)
    if ($modal.length === 0) {
        const modalHtml = `
<div class="modal fade" tabindex="-1" id="${modalId}" aria-modal="true" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="width: auto; max-width: fit-content;">
        <div class="modal-content">
            <div class="modal-body" id="${modalId}-body">
                <table class="table table-sm table-hover mb-0" style="min-width: 20rem;">
                    <caption class="caption-top text-nowrap text-center pt-0">열의 순서와 표시 여부를 설정합니다.</caption>
                    <thead>
                        <tr>
                            <th class="text-center text-nowrap">열</th>
                            <th class="text-center text-nowrap">표시</th>
                            <th class="text-center text-nowrap">순서</th>
                        </tr>
                    </thead>
                    <tbody id="${modalId}-tbody"></tbody>
                </table>
            </div>
            <div class="modal-footer d-flex justify-content-between">
                <div>
                    <button type="button" class="btn btn-sm btn-secondary sfdt-btn-column-config-reset" data-table-id="${tableId}">초기화</button>
                </div>
                <div>
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">취소</button>
                    <button type="button" class="btn btn-sm btn-primary sfdt-btn-column-config-apply" data-table-id="${tableId}">적용</button>
                </div>
            </div>
        </div>
    </div>
</div>`;
        $('body').append(modalHtml);

        // 이벤트 바인딩 (최초 1회)
        // 위로 이동
        $(document).on('click', '#' + modalId + ' .sfdt-btn-column-config-up', function() {
            const $row = $(this).closest('tr');
            const $prev = $row.prev();
            if ($prev.length > 0) {
                $row.insertBefore($prev);
            }
        });
        // 아래로 이동
        $(document).on('click', '#' + modalId + ' .sfdt-btn-column-config-down', function() {
            const $row = $(this).closest('tr');
            const $next = $row.next();
            if ($next.length > 0) {
                $row.insertAfter($next);
            }
        });

        // 드래그 앤 드롭 이벤트
        let draggedRow = null;
        $(document).on('dragstart', '#' + modalId + '-tbody tr', function(e) {
            draggedRow = this;
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            // Firefox requires data to be set
            e.originalEvent.dataTransfer.setData('text/plain', '');
            $(this).addClass('table-active');
        });
        $(document).on('dragover', '#' + modalId + '-tbody tr', function(e) {
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'move';
            return false;
        });
        $(document).on('drop', '#' + modalId + '-tbody tr', function(e) {
            e.preventDefault();
            if (draggedRow && draggedRow !== this) {
                const allRows = Array.from(draggedRow.parentNode.children);
                if (allRows.indexOf(draggedRow) < allRows.indexOf(this)) {
                    $(this).after(draggedRow);
                } else {
                    $(this).before(draggedRow);
                }
            }
            return false;
        });
        $(document).on('dragend', '#' + modalId + '-tbody tr', function() {
            $(this).removeClass('table-active');
            draggedRow = null;
        });

        // 적용 버튼
        $(document).on('click', '#' + modalId + ' .sfdt-btn-column-config-apply', function() {
            const tId = $(this).data('table-id');
            sfdtApplyColumnConfig(tId);
        });
        // 초기화 버튼
        $(document).on('click', '#' + modalId + ' .sfdt-btn-column-config-reset', function() {
            const tId = $(this).data('table-id');
            sfdtResetColumnConfig(tId);
        });

        // 모달 닫힐 때 포커스 해제 (접근성 경고 방지)
        $('#' + modalId).on('hide.bs.modal', function() {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });
    }

    // 현재 테이블 상태로 모달 내용 구성
    const $tbody = $('#' + modalId + '-tbody');
    $tbody.empty();

    // 원본 인덱스 기반으로 열 정보 가져오기
    const columnStatus = sfdtGetColumnStatus(tableId);

    // 현재 순서 가져오기
    const nowOrder = table.colReorder.order();

    // 순서대로 행 추가 (nowOrder는 현재 표시 순서, 값은 원본 인덱스)
    nowOrder.forEach(function(originalIdx) {
        const colInfo = columnStatus[originalIdx];

        if (!colInfo) return; // 안전 체크

        const checkedAttr = colInfo.visible ? 'checked' : '';
        const disabledAttr = colInfo.disableInvisible ? 'disabled' : '';

        const rowHtml = `
            <tr draggable="true" data-column-index="${originalIdx}">
                <td class="text-center align-middle text-nowrap">${colInfo.title}</td>
                <td class="text-center align-middle text-nowrap">
                    <input type="checkbox" class="form-check-input sfdt-column-config-visible" ${checkedAttr} ${disabledAttr}>
                </td>
                <td class="text-center align-middle text-nowrap pb-2">
                    <button type="button" class="btn btn-xs btn-primary me-1 sfdt-btn-column-config-up" title="위로">
                        <i class="bi bi-caret-up-fill"></i>
                    </button>
                    <button type="button" class="btn btn-xs btn-primary sfdt-btn-column-config-down" title="아래로">
                        <i class="bi bi-caret-down-fill"></i>
                    </button>
                </td>
            </tr>
        `;
        $tbody.append(rowHtml);
    });    // 모달 표시
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

/**
 * 테이블의 모든 열 정보를 원본 인덱스 기반으로 가져오기
 * @param {string} tableId - 테이블 ID
 * @returns {object} 원본 인덱스를 키로 하는 열 정보 객체
 */
function sfdtGetColumnStatus(tableId) {
    const table = window.sfdtTables[tableId];
    const columnInfo = {};
    const aoColumns = table.settings()[0].aoColumns;

    // 모든 열을 순회하면서 originalIndex를 키로 정보 저장
    aoColumns.forEach(function(colSettings) {
        const originalIdx = colSettings.originalIndex;
        if (originalIdx !== undefined) {
            columnInfo[originalIdx] = {
                title: colSettings.sTitle || colSettings.title || '',
                visible: colSettings.bVisible,
                disableInvisible: colSettings.sClass && colSettings.sClass.includes('sfdt-disable-invisible')
            };
        }
    });

    return columnInfo;
}

function sfdtApplyColumnConfig(tableId) {
    const table = window.sfdtTables[tableId];
    const modalId = 'sfdt-modal-column-config-' + tableId;
    const newOrder = [];
    const visibilityMap = {};

    // 모달에서 변경된 순서와 표시 여부 수집
    $('#' + modalId + '-tbody tr').each(function() {
        const originalIdx = parseInt($(this).data('column-index'));
        const visible = $(this).find('.sfdt-column-config-visible').is(':checked');
        newOrder.push(originalIdx);
        visibilityMap[originalIdx] = visible;
    });

    // 순서 적용
    table.colReorder.order(newOrder, true);

    // aoColumns 한 번만 순회하면서 visibility 적용 & original 정보 수집
    const originalInfo = {};
    const aoColumns = table.settings()[0].aoColumns;

    aoColumns.forEach(function(colSettings, idx) {
        const originalIdx = colSettings.originalIndex;
        if (originalIdx !== undefined) {
            // original 정보 저장
            originalInfo[originalIdx] = {
                title: colSettings.sTitle || colSettings.title || '',
                data: colSettings.data || null
            };

            // visibility 적용
            if (visibilityMap.hasOwnProperty(originalIdx)) {
                table.column(idx).visible(visibilityMap[originalIdx], false);
            }
        }
    });

    table.columns.adjust().draw();

    // localStorage에 저장
    localStorage.setItem('sfdt-' + tableId + '-column-config', JSON.stringify({
        order: newOrder,
        visibility: visibilityMap,
        original: originalInfo
    }));

    bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
}

function sfdtResetColumnConfig(tableId) {
    const table = window.sfdtTables[tableId];

    // localStorage 제거
    localStorage.removeItem('sfdt-' + tableId + '-column-config');

    // 테이블 초기화
    table.colReorder.reset();
    table.columns().visible(true);
    table.columns.adjust().draw();

    bootstrap.Modal.getInstance(document.getElementById('sfdt-modal-column-config-' + tableId)).hide();
}