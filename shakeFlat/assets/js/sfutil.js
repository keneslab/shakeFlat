function valueForSelect(id, defaultValue) {
    let obj = null;
    if (typeof id == "string") {
        obj = document.getElementById(id);
    } else if (id instanceof HTMLElement) {
        obj = id;
    }
    let v = obj ? obj.value : undefined;
    if (v == undefined) return defaultValue;
    if (v) return v;
    return defaultValue;
}

// like htmlspecialchars for PHP
String.prototype.escapeHtml = function() { return escapeHtml(this); }
function escapeHtml(str)
{
    if (!str) return '';
    if (typeof(str) != "string") return str;
	let map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return str.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Read a page's GET URL variables and return them as an associative array.
function getParam(k, defaultValue)
{
    let vars = [], hash;
    let hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(let i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    if (k) {
        if (vars[k]) {
            return vars[k];
        } else if (defaultValue) {
            return defaultValue;
        } else {
            return null;
        }
    }
    return vars;
}

// retrieves the computed CSS styles of an HTML element and converts them into a JavaScript object
// example : let styles = getStyleObject(document.getElementById("element"));
// styles : {width: "100px", height: "100px", ...}
function getStyleObject(element) {
    let style;
    let returns = {};

    if (window.getComputedStyle) {
        let camelize = function(a, b) {
            return b.toUpperCase();
        };
        style = window.getComputedStyle(element, null);
        for (let i = 0, l = style.length; i < l; i++) {
            let prop = style[i];
            let camel = prop.replace(/\-([a-z])/g, camelize);
            let val = style.getPropertyValue(prop);
            returns[camel] = val;
        }
        return returns;
    }

    if (style = element.currentStyle) {
        for (let prop in style) {
            returns[prop] = style[prop];
        }
        return returns;
    }

    return {};
}

// HTMLElement prototype method for convenience
HTMLElement.prototype.getStyleObject = function() {
    return getStyleObject(this);
};

// Cut to length of string. (Korean processing)
String.prototype.cut = function(len) {
    let str = this;
    let s = 0;
    for (let i=0; i<str.length; i++) {
        s += (str.charCodeAt(i) > 128) ? 2 : 1;
        if (s > len) return str.substring(0,i) + "...";
    }
    return str;
}

// Returns the length of the string in bytes (handling Korean 2 bytes)
String.prototype.bytes = function() {
    let str = this;
    let s = 0;
    for (let i=0; i<str.length; i++) s += (str.charCodeAt(i) > 128) ? 2 : 1;
    return s;
}

// like number_format() for PHP
Number.prototype.numberFormat = function() {
    let num = this;
    if (num === null || num === undefined || isNaN(num)) return 0;
    return num.toLocaleString('ko-KR');
}

// zero to blank.
Number.prototype.numberFormatX = function() {
    let num = this;
    if (num === null || num === undefined || isNaN(num) || num == 0) return "";
    return num.toLocaleString('ko-KR');
}

// like number_format() for PHP for strings
String.prototype.numberFormat = function() {
    let num = parseFloat(this);
    return num.numberFormat();
}

// zero to blank for strings
String.prototype.numberFormatX = function() {
    let num = parseFloat(this);
    return num.numberFormatX();
}

function numberFormat(num) {
    if (num === null || num === undefined || isNaN(num)) return 0;
    if (typeof num === "string") num = parseFloat(num);
    return num.numberFormat();
}

function numberFormatX(num) {
    if (num === null || num === undefined || isNaN(num) || num == 0) return "";
    if (typeof num === "string") num = parseFloat(num);
    return num.numberFormatX();
}

function numberToKorean(num) {
    num = parseInt((num + '').replace(/[^0-9]/g, ''), 10) + '';
    if(num == '0') return '영';
    var number = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    var unit = ['', '만', '억', '조'];  var smallUnit = ['천', '백', '십', ''];
    var result = [];
    var unitCnt = Math.ceil(num.length / 4);
    num = num.padStart(unitCnt * 4, '0');
    var regexp = /[\w\W]{4}/g;
    var array = num.match(regexp);
    for(var i = array.length - 1, unitCnt = 0; i >= 0; i--, unitCnt++) {
        var hanValue = _makeHan(array[i]);
        if(hanValue == '') continue;
        result.unshift(hanValue + unit[unitCnt]);
    }
    function _makeHan(text) {
        var str = '';
        for(var i = 0; i < text.length; i++) {
            var num = text[i];
            if(num == '0') continue;
            str += number[num] + smallUnit[i];
        }
        return str;
    }
    return result.join('');
}

// 스트링으로 된 날짜 값을 입력 받아서, 날짜 format 에 맞춘 스트링으로 반환해주는 함수
// ex) let dateStr = "2020-01-01";
//     let formattedDate = dateStr.formatDate("YYYY년 MM월 DD일 HH시 mm분 ss초");
String.prototype.formatDateTime = function(toFormat) {
    let dateStr = this;
    if (dateStr == null || dateStr == "" || dateStr == "0000-00-00 00:00:00" || dateStr == "0000-00-00") return "";
    let date = new Date(dateStr);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let min = date.getMinutes();
    let sec = date.getSeconds();

    let formattedDate = toFormat;
    formattedDate = formattedDate.replace("YYYY", year);
    formattedDate = formattedDate.replace("MM", padZero(month));
    formattedDate = formattedDate.replace("DD", padZero(day));
    formattedDate = formattedDate.replace("HH", padZero(hour));
    formattedDate = formattedDate.replace("mm", padZero(min));
    formattedDate = formattedDate.replace("ss", padZero(sec));

    return formattedDate;
}

// Sorts an dictionary object's keys in descending order and returns a new sorted object.
function sortKeysDescending(obj) {
    let items = Object.keys(obj).map(function(key) { return [key, obj[key]]; });
    items.sort(function(first, second) { return second[0].localeCompare(first[0]); });

    let sorted_obj = {};
    items.forEach(function(value) {
        let key = value[0];
        let val = value[1];
        sorted_obj[key] = val;
    });

    return sorted_obj;
}

// perform form validation checks, and if the end of id or named is _confirm, we check if the password matches.
function checkValidityForm(frm, passwdConfirmCustomMessage = "Password does not match") {
    let frmObj = null;
    let pwList = [];

    if (typeof frm === 'string') {
        frmObj = document.getElementById(frm);
    } else if (frm instanceof HTMLElement) {
        frmObj = frm;
    } else {
        return false;
    }

    const passwordInputs = frmObj.querySelectorAll("input[type=password]");
    passwordInputs.forEach(element => {
        let elementId = element.getAttribute("id") || element.getAttribute("name");
        if (elementId) {
            pwList.push({
                id: elementId,
                element: element
            });
        }
    });

    if (pwList.length > 0) {
        pwList.forEach(function(o) {
            if (o.id && o.id.substr(-8) == "_confirm") {
                let str = o.id.slice(0, -8);
                let originalPw = pwList.find(function(pw) { return pw.id === str; });

                if (originalPw) {
                    let originalVal = originalPw.element.value;
                    let confirmVal = o.element.value;

                    if (originalVal != confirmVal) {
                        o.element.setCustomValidity(passwdConfirmCustomMessage);
                        return false;
                    } else {
                        o.element.setCustomValidity("");
                    }
                }
            }
        });
    }

    // check validity
    if (!frmObj.checkValidity()) { frmObj.reportValidity(); return false; }

    return true;
}

// Function to add leading zeros to a number based on desired length
function padZero(number, length = 2) {
    return String(number).padStart(length, '0');
}

// rem to pixel (element is optional)
// ex) let pixel = convertRemToPixels(3, document.getElementById('myElement'));
function convertRemToPixels(rem, element) {
    if (!element) element = document.documentElement;
    return rem * parseFloat(getComputedStyle(element).fontSize);
}

// pixel to rem
function convertPixelToRem(pixel, element) {
    if (!element) element = document.documentElement;
    return pixel / parseFloat(getComputedStyle(element).fontSize);
}

// width(pixel) for string with font
// ex) let charWidth = getStringPixelWidth('text', document.getElementById('myElement'));
function getStringPixelWidth(str, element) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.font =  window.getComputedStyle(element).getPropertyValue('font-size') + " " +  window.getComputedStyle(element).getPropertyValue('font-family');
    let metrics = context.measureText(str);
    return metrics.width;
}

// width(pixel) for string with font
String.prototype.stringWidth = function(font, fontSize) {
    let tt = this.toLowerCase().split(/\n|<br>|<br\/>|<br \/>|<p>/);
    let max_tt = "";
    for (let i = 0; i < tt.length; i++) {
        if (max_tt.length < tt[i].length) max_tt = tt[i];
    }

    let fs = "1.2rem";
    if (fontSize) fs = fontSize;
    let f = font || fs + " 'Pretendard GOV Variable'";

    // Create temporary element to measure width
    let tempDiv = document.createElement('div');
    tempDiv.textContent = max_tt;
    tempDiv.style.position = 'absolute';
    tempDiv.style.float = 'left';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.font = f;

    document.body.appendChild(tempDiv);
    let w = tempDiv.offsetWidth;
    document.body.removeChild(tempDiv);

    w += 50;
    if (w < 400) w = 400;
    if (w > 1200) w = 1200;

    return w;
}

function stripHTML(html){
   let doc = new DOMParser().parseFromString(html, 'text/html');
   return doc.body.textContent || "";
}

// alculates the number of days between a date string and today.
function getDaysFromToday(dateString) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

    // Get today and reset hours
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse input date and reset hours
    const inputDate = new Date(dateString);
    inputDate.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(inputDate.getTime())) return false;

    // Calculate difference in days
    const differenceInDays = Math.floor((today - inputDate) / (1000 * 3600 * 24));

    // Return result
    return differenceInDays;
}

// 날짜 기준으로 경과된 일수 계산 (시간 무관,날짜만 비교)
function getDaysElapsed(dateString) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) return false;

    // 입력 날짜를 Date 객체로 변환
    const inputDate = new Date(dateString);
    if (isNaN(inputDate.getTime())) return false;

    // 오늘 날짜를 Date 객체로 변환
    const now = new Date();

    // 두 날짜의 차이(밀리초)
    const diffTime = now - inputDate;

    // 1일(24시간) 단위로 올림 처리
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// second 값을 pretty하게 변환
function prettySecond(second) {
    if (second == null || second == undefined || second == 0) return "";
    let str = "";
    let hour = Math.floor(second / 3600);
    let min = Math.floor((second % 3600) / 60);
    let sec = second % 60;
    if (hour > 0) str += hour + "시간 ";
    if (min > 0) str += min + "분 ";
    if (sec > 0) str += sec + "초";
    return str;
}

// second 값을 분 단위로 pretty하게 변환
function prettySecondMin(second) {
    if (second == null || second == undefined || second == 0) return "";
    let str = "";
    let min = Math.floor(second / 60);
    if (min > 0) str = min + "분";
    return str;
}

// byte 를 pretty하게 변환
function prettyByte(byte) {
    if (byte == null || byte == undefined || byte == 0) return "";
    let str = "";
    if (byte < 1024) {
        str = byte + "bytes";
    } else if (byte < 1024 * 1024) {
        str = (byte / 1024).toFixed(1) + "KB";
    } else if (byte < 1024 * 1024 * 1024) {
        str = (byte / (1024 * 1024)).toFixed(1) + "MB";
    } else {
        str = (byte / (1024 * 1024 * 1024)).toFixed(1) + "GB";
    }
    return str;
}

// string 을 클립보드에 복사
function copyToClipboard(text) {
    let tempInput = document.createElement("input");
    tempInput.style.position = "absolute";
    tempInput.style.opacity = "0";
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
}