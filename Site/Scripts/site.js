﻿// Sunwapta Solutions Inc.
/// <reference path="jquery-1.7.1.js" />
/// <reference path="superfish.js" />
/// <reference path="jquery.qtip.js" />

var site = {
    onload: [],
    languageCode: 'EN',
    computerCode: '',
    computerName: '',
    teller1: '',
    teller2: '',
    templates: {},
    computerActive: true,
    context: '', // controller/action
    lastVersionNum: 0,
    infoForHeartbeat: {},
    heartbeatActive: true,
    heartbeatSeconds: 60, // default seconds
    heartbeatTimeout: null,
    timeOffsetKnown: false,
    qTips: [],
    broadcastCode: {
        electionStatusChanged: 'electionStatusChanged',
        locationChanged: 'locationChanged',
        startNewPerson: 'startNewPerson',
        personSaved: 'personSaved',
        pulse: 'pulse'
    },
    broadcast: function (broadcastCode, data) {
        $(document).triggerHandler(broadcastCode, data);
    },
    onbroadcast: function (broadcastCode, fn, eventData) {
        $(document).on(broadcastCode, null, eventData, fn);
    },
    timeOffset: 0,
    rootUrl: ''
};
var storageKey = {
    MonitorRefresh: 'MonitorRefresh'
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

    // site.timeOffset = site.serverTime.parseJsonDate() - new Date();

    SendHeartbeat();

    CheckTimeOffset();

    AttachHelp();

    PrepareMainMenu();
    HighlightActiveLink();

    AttachHandlers();

    PrepareTopLocationAndTellers();

    PrepareQTips();
}

function HighlightActiveLink() {
    var url = location.href;
    $('#quickLinks2 a').each(function () {
        var matched = url == this.href;
        var a = $(this);
        if (matched) {
            a.addClass('Active');
        }
        else {
            a.removeClass('Active');
        }
    });
}

function PrepareQTips(doNow) {
    if (!doNow) {
        setTimeout(function () {
            PrepareQTips(true);
        }, 500);
        return;
    }

    // global tips
    site.qTips.push({ selector: '#qTipQuickLinks', title: 'Common Pages', text: 'Shows the pages relevant to the current state of the election. All other pages are still available in the Dashboard.' });
    site.qTips.push({ selector: '#qTipElectionStatus', title: 'Election State', text: 'An election proceeds through various states. The head teller should actively change the state when appropriate.' });
    site.qTips.push({ selector: '#qTipTeller', title: 'Tellers', text: 'Please ensure that your name shows here when using this computer. If your name is not in the list, add it! This can help later when reviewing ballots.' });
    site.qTips.push({ selector: '#qTipTopLocation', title: 'Location', text: 'Please ensure that this is your location!' });

    // add some tips for pages without dedicated js
    if ($('#qTipReg1').length) {
        site.qTips.push({ selector: '#qTipReg1', title: 'Account Name', text: 'This is your personal account name, and can be relatively short.  You will use it when logging in each time you use TallyJ.  It will not be seen in many places, mostly just by administrators of the TallyJ system.' });
        site.qTips.push({ selector: '#qTipReg2', title: 'Email Address', text: 'Please use a valid address where you can be notified when there is important news regarding TallyJ. It will not be given to anyone else or used for other purposes.' });
        site.qTips.push({ selector: '#qTipReg3', title: 'Password', text: 'Needs to be at least 6 characters long. It will be encrypted when stored, so cannot be viewed by anyone.' });
    }

    ActivateTips();
}

function ActivateTips() {
    var baseOption = {
        position: {
            my: 'bottom left',
            at: 'top center',
            viewport: true
        },
        style: {
            classes: 'ui-tooltip-green ui-tooltip-shadow'
        }
    };

    $('.qTip').qtip(baseOption);

    $.each(site.qTips, function () {
        if ($(this).data('done')) return;

        var opt = $.extend({}, baseOption);
        if (this.text) {
            if (this.title) {
                $.extend(opt, { content: { text: this.text, title: { text: this.title } } });
            } else {
                $.extend(opt, { content: { text: this.text } });
            }
        }
        $(this).data('done', true);
        $(this.selector).qtip(opt);
    });

}

function AttachHandlers() {
    var hide = function (ev) {
        if ($(ev.srcElement).parents('.TopInfo').length) {
            return;
        }
        $('.ChangeElectionState').hide();
        $(document).off('click', hide);
    };
    $('body.AuthKnown .AllowChangeElectionState').on('click', function () {
        $('.ChangeElectionState').toggle();
        $(document).on('click', hide);
    });
    $('body.AuthKnown #electionState li').on('click', function () {
        var item = $(this);
        var form = {
            status: item.data('state')
        };
        ShowStatusDisplay('Saving...');
        CallAjaxHandler(site.rootUrl + 'Elections/UpdateElectionStatus', form, function (info) {
            $('.ChangeElectionState').fadeOut();
            info.State = form.status;
            site.broadcast(site.broadcastCode.electionStatusChanged, info);
            ResetStatusDisplay();
        });
    });
    site.onbroadcast(site.broadcastCode.electionStatusChanged, UpdateElectionStatus);
}

function UpdateElectionStatus(ev, info) {
    site.info1 = info;
    setTimeout(function () {
        if (info.QuickLinks) {
            $('#quickLinks2').hide().html(info.QuickLinks).fadeIn('fast');
            HighlightActiveLink();
            $('#mmHeader').html(info.StateName);
        }
        var target = $('#electionState');
        target.data('state', info.State);
        target.find('li').each(function () {
            var li = $(this);
            var matched = li.data('state') == info.State;
            li.toggleClass('Active_True', matched);
            li.toggleClass('Active_False', !matched);
        });
    }, 0);
}

function CheckTimeOffset() {
    if (site.timeOffsetKnown) return;
    var now = new Date();
    var form = {
        now: now.getTime() - now.getTimezoneOffset() * 60 * 1000
    };
    CallAjaxHandler(GetRootUrl() + 'Public/GetTimeOffset', form, function (info) {
        site.timeOffset = info.timeOffset;
        site.timeOffsetKnown = true;
    });
}

function PrepareTopLocationAndTellers() {
    $('#ddlTopLocation').change(function () {
        ShowStatusDisplay('Saving...');
        var form = {
            id: $(this).val()
        };
        CallAjaxHandler(GetRootUrl() + 'Dashboard/ChooseLocation', form, function () {
            ShowStatusSuccess('Saved');
            site.broadcast(site.broadcastCode.locationChanged);
        });
    });

    $('.TopTeller').change(function (ev) {
        var ddl = $(this);
        var choice = +ddl.val();
        var form = {
            num: this.id.substr(-1),
            teller: choice
        };
        if (choice == -1) {
            form.newName = prompt('Please type name to add:');
            if (!form.newName) {
                ddl.val(ddl.data('current'));
                ResetStatusDisplay();
                return;
            }
        }
        ShowStatusDisplay('Saving...');

        CallAjaxHandler(GetRootUrl() + 'Dashboard/ChooseTeller', form, function (info) {
            ShowStatusSuccess('Saved');

            ddl.data('current', ddl.val());

            if (info.TellerList) {
                ddl.html(info.TellerList);

                var otherDll = $('.TopTeller').not(ddl);
                var otherValue = otherDll.val();
                otherDll.html(info.TellerList);
                otherDll.val(otherValue);
            }

            $('.CurrentInfo').toggleClass('NotSet', +$('#ddlTopTeller1').val() <= 0);
        });
    }).each(function () {
        var ddl = $(this);
        ddl.data('current', ddl.val());
    });

    $('.CurrentInfo').toggleClass('NotSet', +$('#ddlTopTeller1').val() <= 0);
}

function PrepareMainMenu() {
    $('.QuickLinks').supersubs().superfish();

    //  $("#MasterMenu").dialog({
    //    autoOpen: false,
    //    show: "blind fast",
    //    hide: "explode",
    //    resizable: false,
    //    draggable: false,
    //    modal: true,
    //    title: 'Main Menu',
    //    position: {
    //      my: "right+10 top+10",
    //      at: "right+10 top+10",
    //      of: window
    //    },
    //    width: '500px'
    //  });
    //
    //  $('#btnShowMasterMenu').click(function () {
    //      $("#MasterMenu").dialog("open");
    //      return false;
    //  });

    //    $("ul.sf-menu").supersubs({
    //        minWidth: 12,   // minimum width of sub-menus in em units 
    //        maxWidth: 27,   // maximum width of sub-menus in em units 
    //        extraWidth: 1     // extra width can ensure lines don't sometimes turn over 
    //        // due to slight rounding differences and font-family 
    //    }).superfish();
}

function AttachHelp() {
    var pi = $('.PullInstructions');
    pi.before($('<div class=PullInstructionsHandle><span class="ui-icon ui-icon-info IfClosed qTip" title="Click to show more instructions"></span><span class=IfOpen>Hide</span><span class=IfClosed>Show</span> Instructions</div>'));

    var toggleIt = function (handle,
        fast) {
        var next = handle.next();
        if (fast) {
            next.toggle();
        }
        else {
            next.slideToggle();
        }
        handle.toggleClass('Closed');
        SetInStorage('HidePI_' + location.pathname, handle.hasClass('Closed') ? 'hide' : 'show');
    };

    $(document).on('click', '.PullInstructionsHandle', function (ev) {
        var handle = $(ev.currentTarget);
        toggleIt(handle, false);
    });

    if (GetFromStorage('HidePI_' + location.pathname, 'show') == 'hide') {
        $('.PullInstructionsHandle').each(function () {
            toggleIt($(this), true);
        });
    }

}

//var UpdateActiveInfo = function () {
//  var election = GetFromStorage(lsName.Election);
//  if (election) {
//    var electionDisplay = $('.CurrentElectionName');
//    electionDisplay.text(election.Name);
//    electionDisplay.effect('highlight', { mode: 'slow' });
//    site.heartbeatActive = true;
//    // SetInStorage(lsName.Election, election);
//    ActivateHeartbeat(true);
//  }
//};

//var lastVersionNum = function () {
//  return {
//    get: function (defaultValue) {
//      return GetFromStorage(lsName.LastVersionNum) || defaultValue;
//    },
//    set: function (value) {
//      SetInStorage(lsName.LastVersionNum, value);
//      return value;
//    }
//  };
//};

/// Called after AJAX server calls

function HasErrors(data) {
    // PrepareNextKeepAlive(); 
    // --> would like to update KeepAlive after each AJAX call, but session is not extended on the server for AJAX calls!

    //  if (data.search(/login/i) !== -1) {
    //    var now = new Date();
    //    alert('{0}\n\nYou are no longer logged in.\n\nYou must login again to continue.\n\nThis happened at...  {1}'.filledWith(document.title, now.toLocaleTimeString()));
    //    top.location.href = GetRootUrl() + 'login';
    //    return true;
    //  }
    if (/\<h2\>Object moved to/.test(data)) {
        top.location.href = new RegExp('href\=\"(.*)"\>').exec(data)[1];
        return true;
    }

    if (/\<\!DOCTYPE html\>/.test(data)) {
        // seem to have a complete web page!
        top.location.reload();
        return true;
    }

    if (/Internal Server Error/.test(data)) {
        ShowStatusFailed('Server Error.');
        return true;
    }
    if (/Server Error/.test(data)) {
        ShowStatusFailed(data);
        return true;
    }
    if (/Error\:/.test(data)) {
        ShowStatusFailed('An error occurred on the server. The Technical Support Team has been provided with the error details.');
        return true;
    }
    return false;
}

function LogMessage(msg) {
    /// <summary>Log the message to the console, if the browser supports it
    /// </summary>
    if (typeof console != 'undefined' && console) {
        console.log(('' + msg).toString());
    } else if (typeof window != 'undefined' && window && typeof window.console != 'undefined' && window.console) {
        window.console.log(msg);
    }
}

function GetResource(resourceKey) {
    return MyResources[resourceKey];
}

function ActivateHeartbeat(makeActive, delaySeconds) {
    if (makeActive) {
        if (delaySeconds) {
            site.heartbeatSeconds = +delaySeconds;
        }
        clearTimeout(site.heartbeatTimeout);
        site.heartbeatTimeout = setTimeout(SendHeartbeat, 1000 * site.heartbeatSeconds);
    }
    else {
        clearTimeout(site.heartbeatTimeout);
    }
}

function SendHeartbeat() {
    if (!site.heartbeatActive) return;
    var form = {
        Status: $('#electionState').data('state'),
        Context: site.context,
        Stamp: site.lastVersionNum
    };
    CallAjaxHandler(GetRootUrl() + 'Public/Heartbeat', form, ProcessPulseResult);
}

function ProcessPulseResult(info) {
    ActivateHeartbeat(site.heartbeatActive);
    if (!info) {
        return;
    }
    if (info.NewStamp) {
        site.lastVersionNum = info.NewStamp;
    }

    site.computerActive = info.Active;
    if (info.Active) {
        $('.Heartbeat').removeClass('Frozen').text('').effect('highlight', 'slow');
    }
    else {
        $('.Heartbeat').addClass('Frozen').text('Not Connected');
    }

    if (info.NewStatus) {
        site.broadcast(site.broadcastCode.electionStatusChanged, info.NewStatus);
    }

    if (info.PulseSeconds) {
        site.heartbeatSeconds = info.PulseSeconds;
    }

    site.broadcast(site.broadcastCode.pulse, info);
}

// function ShowQaPanel(url) {
// setTimeout(function () {
// $('body').append('<iframe src="' + url + '" id=QaPanelFrame frameborder=0></iframe>');
// }, 1000);
// }


function CallAjaxHandler(handlerUrl, form, callbackWithInfo, optionalExtraObjectForCallbackFunction, callbackOnFailed, waitForResponse) {
    /// <summary>Do a POST to the named handler. If form is not needed, pass null. Query and Form are objects with named properties.</summary>
    var options = {
        type: 'POST',
        url: handlerUrl,
        traditional: true,
        success: function (data) {
            if (HasErrors(data)) return;

            ResetStatusDisplay();

            if (typeof callbackWithInfo != 'undefined') {
                callbackWithInfo(JsonParse(data), optionalExtraObjectForCallbackFunction);
            }
        },
        error: function (xmlHttpRequest, textStatus) {
            if (typeof callbackOnFailed != 'undefined') {
                callbackOnFailed(xmlHttpRequest);
            } else {
                ShowStatusFailed(xmlHttpRequest);
            }
        }
    };

    if (form) {
        options.data = form; //  JoinProperties(form);
    }
    if (waitForResponse) {
        options.async = false;
    }
    $.ajax(options);
}


String.prototype.parseJsonDate = function () {
    if (this == '') return null;
    var num = /\((.+)\)/.exec(this)[1];
    return new Date(+num);

    ///Date(1072940400000)/
    ///Date(1654149600000)/
    ///Date(165414960000)/
    ///Date(-1566496800000)/
};

String.prototype.parseJsonDateForInput = function () {
    if (this == '') return '';
    var d = this.parseJsonDate();

    var day = ("0" + d.getDate()).slice(-2);
    var month = ("0" + (d.getMonth() + 1)).slice(-2);
    var date = d.getFullYear() + "-" + (month) + "-" + (day);
    return date;
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
    try {
        return eval('(' + json + ')');
    } catch (e) {
        LogMessage(e);
        LogMessage(json);
    }
}


// Root Url ////////////////////////////////////////////////////////////////////////////

function GetRootUrl() {
    return site.rootUrl;
}

//  Status Display //////////////////////////////////////
var statusDisplay = {
    minDisplayTimeBeforeStatusReset: 0,
    resetTimer: null,
    delayedShowStatusArray: []
};

function PrepareStatusDisplay() {
    //if ($('body').hasClass('Public Index')) {
    var target = $('body').hasClass('Public Index') ? 'body' : '#body';

    $('body').prepend('<div class="StatusOuter"><div class="StatusMiddle"><div class="StatusInner">'
            + '<div id="statusDisplay" class="StatusActive" style="display: none;"></div>'
            + '</div></div></div>');
    //} else {
    //    $('#body').prepend('<div class="StatusOuter2 content-wrapper"><span id="statusDisplay2" class="StatusActive" style="display: none;"></span></div>');
    //}
}

function ShowStatusDisplay(msg, delayBeforeShowing, timeBeforeStatusReset, showErrorIcon, showNoIcon) {
    statusDisplay.minDisplayTimeBeforeStatusReset = timeBeforeStatusReset =
         (typeof timeBeforeStatusReset === 'number') ? timeBeforeStatusReset : 15 * 1000;
    if (statusDisplay.minDisplayTimeBeforeStatusReset) {
        clearTimeout(statusDisplay.resetTimer);
        statusDisplay.resetTimer = setTimeout(ResetStatusDisplay, statusDisplay.minDisplayTimeBeforeStatusReset);
        statusDisplay.minDisplayTimeBeforeStatusReset = 0;
    }

    if (typeof delayBeforeShowing !== 'number') {
        delayBeforeShowing = 0;
    }

    if (delayBeforeShowing > 0) {
        statusDisplay.delayedShowStatusArray[statusDisplay.delayedShowStatusArray.length] = setTimeout(function () {
            ShowStatusDisplay(msg, 0, timeBeforeStatusReset, showErrorIcon);
        }, delayBeforeShowing);
        return;
    }
    var target = $('#statusDisplay2, #statusDisplay');
    if (target.length === 0) {
        // ??? on a page without a Status display
    }
    var loaderPath = '<img class=ajaxIcon src="' + GetRootUrl() + 'images/ajax-loader.gif"> ';
    var imageHtml = showErrorIcon ? '<span class="ui-icon ui-icon-alert"></span>' :
                        showNoIcon ? '' : loaderPath;
    target.html(imageHtml + msg).show();
    if (showErrorIcon) {
        target.addClass('error');
    } else {
        target.removeClass('error');
    }
    // idea: hold errors until click ok?    <button onclick="ClearDisplay()" type=button>Ok</button>
}

function ShowStatusSuccess(msg) {
    ShowStatusDisplay(msg, 0, 3000, false, true);
}

function ShowStatusFailed(msg, keepTime) {
    ResetStatusDisplay();
    var delayBeforeShow = 0;
    var msgShown = false;

    if (typeof keepTime == 'undefined') keepTime = 600 * 1000; // 10 minutes

    var text;
    if (typeof msg === 'string') {
        text = msg;
    } else if (typeof msg.statusText === 'string') {
        if (msg.status === 200 || msg.status === 406) {
            text = msg.responseText;
        } else if (msg.status === 0 && msg.statusText == 'error') {
            text = 'Please wait...';
            ShowStatusDisplay(text, 0, keepTime, false, false);
            msgShown = true;
        } else if (msg.status === 503) {
            top.location.href = top.location.href;
            return '';
        } else {
            LogMessage(msg);
            text = '(' + msg.status + ') ' + msg.statusText + ': ';
            var matches = msg.responseText.match(/\<title\>(.*?)\<\/title\>/i);
            if (matches !== null) {
                text = text + matches[1];
            } else {
                text = text + msg.responseText;
            }
        }
    } else {
        text = 'Error';
    }

    if (!msgShown) {
        ShowStatusDisplay(text, delayBeforeShow, keepTime, true);
    }

    return text;
}

function ResetStatusDisplay() {
    clearTimeout(statusDisplay.resetTimer);

    for (; statusDisplay.delayedShowStatusArray.length;) {
        clearTimeout(statusDisplay.delayedShowStatusArray[statusDisplay.delayedShowStatusArray.length - 1]);
        statusDisplay.delayedShowStatusArray.length--;
    }

    if (statusDisplay.minDisplayTimeBeforeStatusReset !== 0) {
        statusDisplay.resetTimer = setTimeout(ResetStatusDisplay, statusDisplay.minDisplayTimeBeforeStatusReset);
        statusDisplay.minDisplayTimeBeforeStatusReset = 0;
        return;
    }

    HideStatusDisplay();
}

function HideStatusDisplay() {
    $('#statusDisplay2, #statusDisplay').hide();
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

function FormatDate(dateObj, format, forDisplayOnly, includeHrMin, doNotAdjustForServerTimeOffset) {
    // MMM = JAN
    // MMMM = JANUARY
    if (('' + dateObj).substring(0, 5) == '/Date') {
        dateObj = dateObj.parseJsonDate();
    }
    if (dateObj == null || isNaN(dateObj) || dateObj == 'NaN' || dateObj === '01/01/0001' || dateObj === '') {
        return '';
    }

    var date = new Date(dateObj);
    if (isNaN(date)) {
        return '[Invalid Date]';
    }
    if (!doNotAdjustForServerTimeOffset) {
        LogMessage('time offset {0}'.filledWith(site.timeOffset));
        LogMessage('  - original: {0}'.filledWith(date.toString()));
        date = new Date(date.getTime() + site.timeOffset);
        LogMessage('  - after   : {0}'.filledWith(date.toString()));
    }

    if (!format) {
        format = 'YYYY-MM-DD';
    }

    var months = 'January February March April May June July August September October November December'.split(' ');
    var days = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');

    var dayValue = date.getDate();
    var monthValue = date.getMonth();
    var yearValue = date.getFullYear();
    var hourValue = date.getHours();
    var minuteValue = date.getMinutes();
    var result = '';

    switch (format) {
        case 'MMM D, YYYY':
            result = months[monthValue].substring(0, 3) + ' ' + dayValue + ', ' + yearValue;
            break;

        case 'D MMM YYYY':
            var returnVal = dayValue + ' ' + months[monthValue].substring(0, 3) + ' ' + yearValue;
            if (site.languageCode == 'FR' && forDisplayOnly && +dayValue == 1) {
                returnVal = returnVal.replace('1', '1<sup>{0}</sup>'.filledWith('er'));
            }
            result = returnVal;
            break;

        case 'DDD, D MMM YYYY':
            result = days[date.getDay()] + ', ' + dayValue + ' ' + months[monthValue].substring(0, 3) + ' ' + yearValue;
            break;

        case 'YYYY-MM-DD':
            var monthNum = monthValue + 1;
            result = yearValue + '-' + (monthNum < 10 ? '0' : '') + monthNum + '-' + (dayValue < 10 ? '0' : '') + dayValue;
            break;

        case 'MMM YYYY':
            result = months[monthValue].substring(0, 3) + ' ' + yearValue;
            break;

        case 'MMMM YYYY':
            result = months[monthValue] + ' ' + yearValue;
            break;

        case 'MM/DD/YYYY':
            var monthval = monthValue + 1;
            var monthStr = ('0' + monthval).slice(-2);
            var dayStr = ('0' + dayValue).slice(-2);
            result = monthStr + '/' + dayStr + '/' + yearValue;
            break;

        default:
            result = '';
            break;
    }

    if (includeHrMin) {
        result += ' {0}:{1}'.filledWith(hourValue.as2digitString(), minuteValue.as2digitString());
    }

    return result;
}

Number.prototype.as2digitString = function () {
    return ('00' + this).substr(-2);
};
String.prototype.filledWith = function () {
    /// <summary>Similar to C# String.Format...  in two modes:
    /// 1) Replaces {0},{1},{2}... in the string with values from the list of arguments. 
    /// 2) If the first and only parameter is an object, replaces {xyz}... (only names allowed) in the string with the properties of that object. 
    /// </summary>
    var values = typeof arguments[0] === 'object' && arguments.length === 1 ? arguments[0] : arguments;
    if (arguments.length == 0 && arguments[0].length) {
        // use values in array, substituting {0}, {1}, etc.
        values = {};
        $.each(arguments[0], function (i, value) {
            values[i] = value;
        });
    }

    var testForFunc = /^#/; // simple test for "#"
    var testForNoEscape = /^\^/; // simple test for "^"
    var extractTokens = /{([^{]+?)}/g; // greedy

    var replaceTokens = function (input) {
        return input.replace(extractTokens, function () {
            var token = arguments[1];
            var value = undefined;
            try {
                if (values === null) {
                    value = '';
                } else if (testForFunc.test(token)) {
                    value = eval(token.substring(1));
                } else if (testForNoEscape.test(token)) {
                    value = values[token.substring(1)];
                } else {
                    var toEscape = values[token];
                    value = typeof toEscape == 'undefined' || toEscape === null ? '' : ('' + toEscape).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/{/g, '&#123;');
                }
            } catch (err) {
                LogMessage('filledWithError:\n' + err + '\ntoken:' + token + '\nvalue:' + value + '\ntemplate:' + input);
                LogMessage(values);
                throw 'Error in filledWith';
            }
            return (typeof value == 'undefined' || value == null ? '' : ('' + value));
        });
    };

    var result = replaceTokens(this);

    var lastResult = '';
    while (lastResult != result) {
        lastResult = result;
        result = replaceTokens(result);
    }

    return result.replace(/&#123;/g, '{');
};

String.prototype.filledWithEach = function (arr, sep) {
    /// <summary>Silimar to 'filledWith', but repeats the fill for each item in the array. Returns a single string with the results.
    /// </summary>
    if (arr === undefined || arr === null) return '';
    if (sep === undefined) sep = '';
    var result = [];
    for (var i = 0, max = arr.length; i < max; i++) {
        result[result.length] = this.filledWith(arr[i]);
    }
    return result.join(sep);
};

/// Turn { a:1, b:2 } into   a=1&b=2

//function JoinProperties(obj, sep1, sep2, sepInner1, sepInner2) {
//    var toJoin = [];
//    sep1 = sep1 || '=';
//    sep2 = sep2 || '&';
//    sepInner1 = sepInner1 || ('\\' + sep1);
//    sepInner2 = sepInner2 || ('\\' + sep2);
//    for (var i in obj) {
//        var prop = obj[i];
//        if (typeof prop !== 'function' && obj.hasOwnProperty(i)) {
//            if (prop === null) {
//                toJoin.push(i + sep1);
//            } else if (typeof prop === 'object' && prop.jquery) {
//                toJoin.push(i + sep1 + encodeURIComponent(prop.val()));
//            } else if ($.isArray(prop)) {
//                toJoin.push(i + sep1 + encodeURIComponent(prop.join()));
//            } else if (typeof prop === 'object') {
//                toJoin.push(i + sep1 + JoinProperties(prop.jquery ? encodeURIComponent(prop.val()) : prop, sepInner1, sepInner2));
//            } else {
//                toJoin.push(i + sep1 + encodeURIComponent(prop));
//            }
//        }
//    }
//    return toJoin.join(sep2);
//}


function StringifyObject(obj) {
    return JSON.stringify(obj);

    //  var toJoin = [];

    //  for (var i in obj) {
    //    var prop = obj[i];
    //    if (typeof prop !== 'function' && obj.hasOwnProperty(i)) {
    //      if (typeof prop === 'object') {
    //        if (prop === null) {
    //          toJoin.push('"' + i + '":null');
    //        } else {
    //          toJoin.push('"' + i + '":' + StringifyObject(prop));
    //        } 
    //      } else {
    //        toJoin.push('"' + i + '":' + JSON.stringify(prop));
    //      }

    //    }
    //  }
    //  return ('{' + toJoin.join() + '}');
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

//  Storge  //////////////////////////////////////////////////
var ObjectConstant = '$****$';

function GetFromStorage(key, defaultValue) {

    var checkForObject = function (obj) {

        if (obj.substring(0, ObjectConstant.length) == ObjectConstant) {
            obj = JSON.parse(obj.substring(ObjectConstant.length));
        }
        return obj;
    };

    var value = localStorage[key];
    if (typeof value !== 'undefined' && value != null) return checkForObject(value);
    return defaultValue;
}

function SetInStorage(key, value) {
    if (typeof value === 'object') {
        var strObj = StringifyObject(value);
        value = ObjectConstant + strObj;
    }
    localStorage[key] = value;
    return value;
}

var adjustElection = function (election) {
    return election;
    election.DateOfElection = FormatDate(
        !isNaN(election) ? election :
           election.DateOfElection ? election.DateOfElection.parseJsonDate() : new Date());
    return election;
};

function ExpandName(s) {
    var result = [];
    for (var i = 0, len = s.length; i < len; i++) {
        var ch = s[i];
        if (ch >= 'A' && ch <= 'Z') {
            result.push(' ');
        }
        result.push(ch);
    }
    return result.join('');
}

