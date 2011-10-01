﻿// Sunwapta Solutions Inc.
/// <reference path="jquery-1.6.4-vsdoc.js" />

var site = {
    onload: [],
    languageCode: 'EN',
    templates: {}
};
var MyResources = {};

$(function () {
    Onload();
});

function Onload() {
    if (site.onload.length !== 0) {
        eval(site.onload.join(';'));
    }
  PrepareStatusDisplay();
}

/// Called after AJAX server calls

function HasErrors(data) {
    // PrepareNextKeepAlive(); 
    // --> would like to update KeepAlive after each AJAX call, but session is not extended on the server for AJAX calls!

    if (data.search(/login/i) !== -1) {
        var now = new Date();
        alert('{0}\n\nYou are no longer logged in.\n\nYou must login again to continue.\n\nThis happened at...  {1}'.filledWith(document.title, now.toLocaleTimeString()));
        top.location.href = GetRootUrl() + '/login';
        return true;
    }
    if (data.search(/Internal Server Error/) !== -1) {
        ShowStatusFailed('Server Error.');
        return true;
    }
    if (data.search(/Error/) !== -1) {
        ShowStatusFailed('An error occurred on the server. The Technical Support Team has been provided with the error details.');
        return true;
    }
    return false;
}

function LogMessage(msg) {
    /// <summary>Log the message to the console, if the browser supports it
    /// </summary>
    if (typeof console != 'undefined' && console) {
        console.log(msg);
    } else if (typeof window != 'undefined' && window && typeof window.console != 'undefined' && window.console) {
        window.console.log(msg);
    }
}

function GetResource(resourceKey) {
    return MyResources[resourceKey];
}

// function ShowQaPanel(url) {
    // setTimeout(function () {
        // $('body').append('<iframe src="' + url + '" id=QaPanelFrame frameborder=0></iframe>');
    // }, 1000);
// }


function CallAjaxHandler(handlerUrl, form, callbackWithInfo, optionalExtraObjectForCallbackFunction, callbackOnFailed, waitForResponse) {
    /// <summary>Do a GET or POST to the named handler. If form is not needed, pass null. Query and Form are objects with named properties.</summary>
    var options = {
        type: 'POST',
        url: handlerUrl,
        success: function (data) {
            if (HasErrors(data)) return;

            if (callbackWithInfo) {
                callbackWithInfo(JsonParse(data), optionalExtraObjectForCallbackFunction);
            }

            ResetStatusDisplay();
        },
        error: function (xmlHttpRequest, textStatus) {
            if (callbackOnFailed) {
                callbackOnFailed(xmlHttpRequest);
            } else {
                ShowStatusFailed(xmlHttpRequest);
            }
        }
    };

    if (form) {
        options.data = JoinProperties(form);
    }
    if (waitForResponse) {
        options.async = false;
    }
    $.ajax(options);
}


String.prototype.parseJsonDate = function () {
    var answer = this;
    this.replace(/\((.+)\)/g, function () { answer = arguments[1]; });
    return new Date(parseFloat(answer));

    ///Date(1072940400000)/
    ///Date(1654149600000)/
    ///Date(165414960000)/
    ///Date(-1566496800000)/
};

function JsonParse(json) {
    if (typeof (JSON) == undefined && JSON) {
        //if (!!window.chrome) json = json.replace('\\', '\\\\');
        try {
            return JSON.parse(json); // if not pure JSON, may get parse error
        } catch (e) {
            ShowStatusFailed(e.message);
        }
    }
    return eval('(' + json + ')');
}


// Root Url ////////////////////////////////////////////////////////////////////////////

function GetRootUrl() {
    return location.pathname.substring(0, location.pathname.substring(1).indexOf('/') + 1);
}

//  Status Display //////////////////////////////////////
var statusDisplay = {
    minDisplayTimeBeforeStatusReset: 0,
    delayedShowStatusArray: []
};

function PrepareStatusDisplay() {
    $('body').prepend('<div class="StatusOuter"><div class="StatusMiddle"><div class="StatusInner">'
    + '<div id="statusDisplay" class="StatusActive" style="display: none;"></div>'
    + '</div></div></div>');
}

function ShowStatusDisplay(msg, minDisplayTimeBeforeStatusReset, showAsError, dontShowUntilAfter) {
    if (typeof minDisplayTimeBeforeStatusReset === 'number') {
        statusDisplay.minDisplayTimeBeforeStatusReset = minDisplayTimeBeforeStatusReset;
    }
    if (typeof dontShowUntilAfter !== 'number') {
        dontShowUntilAfter = 500;
    }

    if (dontShowUntilAfter > 0) {
        statusDisplay.delayedShowStatusArray[statusDisplay.delayedShowStatusArray.length] = setTimeout(function () {
            ShowStatusDisplay(msg, minDisplayTimeBeforeStatusReset, showAsError, 0);
        }, dontShowUntilAfter);
        return;
    }

    var target = $('#statusDisplay');
    if (target.length === 0) {
        // ??? on a page without a Status display
    }
    var loaderPath = GetRootUrl() + '/images/ajax-loader.gif';
    target.html((showAsError ? '<span class="ui-icon ui-icon-alert"></span>' : '<img class=ajaxIcon src="' + loaderPath + '"> ') + msg)
    .show();
    if (showAsError) {
        target.addClass('error');
    } else {
        target.removeClass('error');
    }
    // idea: hold errors until click ok?    <button onclick="ClearDisplay()" type=button>Ok</button>
}

function ShowStatusFailed(msg, keep) {
    if (!keep) ResetStatusDisplay();

    var text;
    if (typeof msg === 'string') {
        text = msg;
    } else if (typeof msg.statusText === 'string') {
        if (msg.status === 200 || msg.status === 406) {
            text = msg.responseText;
        } else {
            text = '(' + msg.status + ') ' + msg.statusText + ': ';
            var matches = msg.responseText.match(/\<title\>(.*?)\<\/title\>/i);
            if (matches !== null) {
                text = text + matches[1];
            } else {
                text = text + msg.responseText;
            }
        }
    }

    ShowStatusDisplay(text, keep ? null : 15000, true, 0);

    return text;
}

function ResetStatusDisplay() {
    for (; statusDisplay.delayedShowStatusArray.length; ) {
        clearTimeout(statusDisplay.delayedShowStatusArray[statusDisplay.delayedShowStatusArray.length - 1]);
        statusDisplay.delayedShowStatusArray.length--;
    }
    if (statusDisplay.minDisplayTimeBeforeStatusReset !== 0) {
        $('.ajaxIcon').hide();
        setTimeout(ResetStatusDisplay, statusDisplay.minDisplayTimeBeforeStatusReset);
        statusDisplay.minDisplayTimeBeforeStatusReset = 0;
        return;
    }

    $('#statusDisplay')
    .fadeOut('slow');
}

function HideStatusDisplay() {
    $('#statusDisplay').hide();
}


function alerts(arg1, arg2, arg3, etc) {
    // alert('{0}\n'.filledWithEach(arguments));
    // show the contents of a list of parameters
    var msgList = [];
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        try {
            var msg = arg === null ? 'null' : typeof arg === 'undefined' ? 'undefined' : arguments[i].toString();
            msgList[msgList.length] = (i + 1) + ': ' + msg;
        } catch (e) {
            msgList[msgList.length] = (i + 1) + ': ' + e.name + ' - ' + e.message;
        }
    }
    alert(msgList.join('\n'));
}


function comma(number, iDecimals, type, zeroText) { // works on positive numbers under 100 trillion
    // modified from version at irt.org - not very efficient!?
    if (number == 0 && typeof (zeroText) != 'undefined' && zeroText != null && zeroText != '') {
        return zeroText;
    }
    var bNegative = (number < 0); //work with the positive number and add -'ve at end if needed
    number = Math.abs(number);
    number = number - 0; // convert to number
    if (isNaN(number)) return 'Num?';
    var bFrench = site.languageCode == 'FR'; //if idecimals is -1 then only return decimals if there are some
    if (iDecimals == -1) {
        if (Math.floor(number) == number)
            iDecimals = 0;
        else
            iDecimals = 2;
    }
    // round to correct decimals
    if (iDecimals == null) iDecimals = 0;
    if (iDecimals >= 0) {
        number = number * Math.pow(10, iDecimals);
        number = Math.round(number);
        number = number / Math.pow(10, iDecimals);
    }

    // chop result in parts
    var whole = Math.floor(number);
    var decimal = number - whole;
    whole = '' + whole; // convert to text
    var output, i;
    if (whole.length > 3) {
        var mod = whole.length % 3; // leftover after groups of 3 removed
        var sections = Math.floor(whole.length / 3);
        output = (mod > 0 ? (whole.substring(0, mod)) : '');
        for (i = 0; i < sections; i++) {
            if ((mod == 0) && (i == 0))
                output = output + '' + whole.substring(mod + 3 * i, mod + 3 * i + 3);
            else
                output = output + (bFrench ? ' ' : ',') + whole.substring(mod + 3 * i, mod + 3 * i + 3);
        }
    } else
        output = whole;
    var sDecimalChar = (bFrench ? ',' : '.');
    if (decimal != '' && iDecimals != 0) {
        output += sDecimalChar + (Math.round(decimal * Math.pow(10, iDecimals)) / Math.pow(10, iDecimals)).toString().substr(2);
    }

    //make sure that the specified number of decimals is returned
    if (iDecimals != 0) {
        var nPosition = output.indexOf(sDecimalChar);
        var nLength = output.length;
        if (nPosition == -1)    //no decimal point
        {
            nPosition = output.length - 1;
            output += sDecimalChar;
        }
        var nRequired = Math.abs(nLength - nPosition - 1 - iDecimals);
        for (i = 0; i < nRequired; i++) {
            output += 0;
        }
    }

    if (bNegative)
        output = '-' + output;
    if (type === "D") {
        if (bFrench)
            output = output + ' $';
        else
            output = '$' + output;
    }

    if (type === "P") {
        if (bFrench)
            output = output + ' %';
        else
            output = output + '%';
    }

    return output;

}

function BrowserRemovesAttrQuotes() {
    //http://stackoverflow.com/questions/1231770/innerhtml-removes-attribute-quotes-in-internet-explorer
    //see this website for possible solution to ie removal of quotes
    return site.browserModelDetail === 'IE8';
}

function getTemplate(selector, replacements) {
    /// <summary>Return the numeric value of a css measure (without 'px')
    /// </summary>
    /// <param name="selector">JQuery selector to get one DOM object</param>
    /// <param name="replacements">(Optional) An object with named properities. The HTML will be searched for each "name" and replaced with its "value".</param>
    var target = $(selector);
    var rawHtml = target.html();
    if (!rawHtml) return '';

    var html = BrowserRemovesAttrQuotes() ? ieInnerHTML(target) : rawHtml;

    var internalReplacements = {
        // Firefox encodes these
        '%7B': '{',
        '%7D': '}'
    };

    $.extend(internalReplacements, replacements);

    for (var replacement in internalReplacements) {
        var regex = new RegExp(replacement, 'g');
        html = html.replace(regex, internalReplacements[replacement]);
    }

    return html;
}


function ieInnerHTML(obj, convertToLowerCase) {
    var zz = obj.html(), z = zz.match(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g);

    if (z) {
        for (var i = 0; i < z.length; i++) {
            var y, zSaved = z[i], attrRE = /\=[a-zA-Z\.\:\[\]_\(\)\{\}\&\$\%#\@\!0-9]+[?\s+|?>]/g;
            z[i] = z[i]
        .replace(/(<?\w+)|(<\/?\w+)\s/, function (a) { return a.toLowerCase(); });
            y = z[i].match(attrRE); //deze match

            if (y) {
                var j = 0, len = y.length;
                while (j < len) {
                    var replaceRE = /(\=)([a-zA-Z\.\:\[\]_\(\{\}\)\&\$\%#\@\!0-9]+)?([\s+|?>])/g, replacer = function () {
                        var args = Array.prototype.slice.call(arguments);
                        return '="' + (convertToLowerCase ? args[2].toLowerCase() : args[2]) + '"' + args[3];
                    };
                    z[i] = z[i].replace(y[j], y[j].replace(replaceRE, replacer));
                    j++;
                }
            }
            zz = zz.replace(zSaved, z[i]);
        }
    }
    return zz;
}

function CountOf(s, re) { // match regular expression to string. If find more than X of re, return false
    var match = s.match(re);
    if (match) {
        return match.length;
    } else
        return 0;
}

function GetValue(sNum) {

    if (site.languageCode == 'FR') {
        sNum = sNum.replace(/\./g, '');
        sNum = sNum.replace(/,/g, '.');
    } else {
        sNum = sNum.replace(/\,/g, '');
    }
    // ensure no more than one .
    if (CountOf(sNum, /\./g) > 1) return NaN;

    sNum = sNum.replace(/\$/g, '');

    sNum = sNum.replace(/\%/g, '');

    sNum = sNum.replace(/[ \xA0]/g, '');

    var nNum = Number(sNum);
    return nNum;
}

function FormatDate(date, format, forDisplayOnly) {
    // MMM = JAN
    // MMMM = JANUARY
    if (date == null || date == 'NaN' || date === '01/01/0001' || date === '') {
        return '';
    }
    if (!format) {
        if (site.languageCode == 'FR') {
            format = 'D MMM YYYY';
        }
        else {
            format = 'MMM D, YYYY';
        }
    }

    var months = 'January February March April May June July August September October November December'.split(' ');
    var days = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');

    var mydate = new Date(date);
    if (isNaN(mydate)) {
        return '[Invalid Date]';
    }

    var day_value = mydate.getDate();
    var month_value = mydate.getMonth();
    var year_value = mydate.getFullYear();

    switch (format) {
        case 'MMM D, YYYY':
            return months[month_value].substring(0, 3) + ' ' + day_value + ', ' + year_value;
        case 'D MMM YYYY':
            var returnVal = day_value + ' ' + months[month_value].substring(0, 3) + ' ' + year_value;
            if (site.languageCode == 'FR' && forDisplayOnly && +day_value == 1) {
                returnVal = returnVal.replace('1', '1<sup>{0}</sup>'.filledWith('er'));
            }
            return returnVal;
        case 'DDD, D MMM YYYY':
            return days[mydate.getDay()] + ', ' + day_value + ' ' + months[month_value].substring(0, 3) + ' ' + year_value;
        case 'YYYY-M-DD':
            if (month_value.toString().length === 1) {
                month_value = '0' + (month_value + 1);
            }
            return year_value + '-' + month_value + '-' + day_value;
        case 'MMM YYYY':
            return months[month_value].substring(0, 3) + ' ' + year_value;
        case 'MMMM YYYY':
            return months[month_value] + ' ' + year_value;
        case 'MM/DD/YYYY':
            var monthval = month_value + 1;
            var monthStr = ('0' + monthval).slice(-2);
            var dayStr = ('0' + day_value).slice(-2);
            return monthStr + '/' + dayStr + '/' + year_value;
    }

    return date;
}

String.prototype.filledWith = function () {
    /// <summary>Similar to C# String.Format...  in two modes:
    /// 1) Replaces {0},{1},{2}... in the string with values from the list of arguments. 
    /// 2) If the first and only parameter is an object, replaces {xyz}... (only names allowed) in the string with the properties of that object. 
    /// Notes: the { } symbols cannot be escaped and should only be used for replacement target tokens;  only a single pass is done. 
    /// </summary>
    var values = typeof arguments[0] === 'object' && arguments.length === 1 ? arguments[0] : arguments;

    //return this.replace(/{(.+)}/g, function () {


    var testForFunc = /#\w+/; // simple test for "#function"
    var extractTokens = /{([^{]+?)}/g; // greedy
    var replaceTokens = function (input) {
        return input.replace(extractTokens, function () {
            var token = arguments[1];
            var value = values[token];
            if (testForFunc.test(token)) {
                //LogMessage(token);
                value = eval(token.substring(1));
            }
            return "" + value;
        });
    };

    var result = replaceTokens(this);

    var lastResult = '';
    while (lastResult != result && (extractTokens.test(result) || testForFunc.test(result))) {
        lastResult = result;
        result = replaceTokens(result);
    }

    return result;
};

//String.addMethod('filledWithEach', function (arr) {
String.prototype.filledWithEach = function (arr) {
    /// <summary>Silimar to 'filledWith', but repeats the fill for each item in the array. Returns a single string with the results.
    /// </summary>
    if (arr === undefined || arr === null) return '';
    var result = [];
    for (var i = 0, max = arr.length; i < max; i++) {
        result[result.length] = this.filledWith(arr[i]);
    }
    return result.join('');
};

/// Turn { a:1, b:2 } into   a=1&b=2

function JoinProperties(obj, sep1, sep2, sepInner1, sepInner2) {
    var toJoin = [];
    sep1 = sep1 || '=';
    sep2 = sep2 || '&';
    sepInner1 = sepInner1 || ('\\' + sep1);
    sepInner2 = sepInner2 || ('\\' + sep2);
    for (var i in obj) {
        var prop = obj[i];
        if (typeof prop !== 'function' && obj.hasOwnProperty(i)) {
            if (prop === null) {
                toJoin.push(i + sep1);
            } else if (typeof prop === 'object' && prop.jquery) {
                toJoin.push(i + sep1 + escape(prop.val()));
            } else if (typeof prop === 'object') {
                toJoin.push(i + sep1 + JoinProperties(prop.jquery ? escape(prop.val()) : prop, sepInner1, sepInner2));
            } else {
                toJoin.push(i + sep1 + escape(prop));
            }
        }
    }
    return toJoin.join(sep2);
}


function StringifyObject(obj) {
    var toJoin = [];

    for (var i in obj) {
        var prop = obj[i];
        if (typeof prop !== 'function' && obj.hasOwnProperty(i)) {
            if (typeof prop === 'object') {
                toJoin.push('"' + i + '":' + StringifyObject(prop));
            } else {
                toJoin.push('"' + i + '":' + JSON.stringify(prop));
            }

        }
    }
    return ('{' + toJoin.join() + '}');
}

function Plural(num, plural, single, zero) {
    if (num === 1) return single || '';
    if (num === 0) return zero || plural || 's';
    return plural || 's';
}

//following for performance testing

function startTimer() {
    site.stTime = new Date().getTime();
}

function endTimer(msg) {
    if (typeof site.stTime != 'undefined' && site.stTime) {
        LogMessage(msg + " " + (new Date().getTime() - site.stTime));
    }

}

function OptionsFromResourceList(resourceList, defaultValue) {
    var items = [];
    $.each(resourceList, function (key, text) {
        items.push({ Key: key, Text: text, Selected: defaultValue == key ? ' selected' : '' });
    });

    return '<option value="{Key}"{Selected}>{Text}</option>'
    .filledWithEach(items);
}
