﻿/// <reference path="../../Scripts/site.js" />
/// <reference path="../../Scripts/PeopleHelper.js" />
/// <reference path="../../Scripts/jquery-1.7.1.js" />
/// <reference path="EditPerson.cshtml.js" />

var PeoplePage = function () {
    var local = {
        People: [],
        peopleHelper: null,
        keyTimer: null,
        keyTime: 300,
        lastSearch: '',
        totalOnFile: 0,
        actionTag: null,
        inputField: null,
        nameList: null,
        rowSelected: 0,
        showPersonId: null,
        maintainCurrentRow: false,
        template: '<li id=P{Id}>{^Name}</li>'
    };
    var onNamesReady = function (info) {
        local.People = info.People;
        local.nameList.html(local.template.filledWithEach(local.People));
        $('#more').html(info.MoreFound || moreFound(local.totalOnFile));
        if (!local.People.length && local.lastSearch) {
            local.nameList.append('<li>...no matches found...</li>');
        }
        else {
            if (info.MoreFound && local.lastSearch) {
                local.nameList.append('<li>...more matched...</li>');
            }
            if (local.showPersonId) {
                local.rowSelected = local.nameList.find('#P' + local.showPersonId).index();
                local.showPersonId = 0;
            } else {
                $.each(local.People, function (i, item) {
                    if (item.BestMatch && !local.maintainCurrentRow) {
                        local.rowSelected = i;
                    }
                });
            }
        }
        local.maintainCurrentRow = false;
        local.actionTag.removeClass('searching');
        local.inputField.removeClass('searching');
        local.actionTag.removeClass('delaying');
        local.inputField.removeClass('delaying');

        local.nameList.children().eq(local.rowSelected).addClass('selected');
    };
    var moveSelected = function (delta) {
        var children = local.nameList.children();
        var numChildren = children.length;
        if (children.eq(numChildren - 1).text() == '...') { numChildren--; }

        var rowNum = local.rowSelected;
        rowNum = rowNum + delta;
        if (rowNum < 0) { rowNum = numChildren - 1; }
        if (rowNum >= numChildren) { rowNum = 0; }
        setSelected(children, rowNum);
    };
    var setSelected = function (children, rowNum) {
        children.removeClass('selected');
        children.eq(local.rowSelected = rowNum).addClass('selected');
    };
    var edit = function (personId) {
        var id = 'P' + personId;
        var children = local.nameList.children();
        children.each(function (i, el) {
            if (el.id == id) {
                setSelected(children, i);
                return false;
            }
        });
        ShowStatusDisplay("Loading...");
        CallAjaxHandler(publicInterface.peopleUrl + '/GetDetail', { id: personId }, showPersonDetail);
    };

    var addNewPerson = function () {
        editPersonPage.startNewPerson($('#editPanel'));
    };

    var showPersonDetail = function (info) {
        applyValues(info.Person);
        ResetStatusDisplay();
    };

    var applyValues = function (person) {
        var panel = $('#editPanel');
        if (person == null) {
            panel.hide();
            return;
        };

        editPersonPage.applyValues(panel, person);

    };

    //    var saveChanges = function () {
    //        var form = {};
    //        $(':input[data-name]').each(function () {
    //            var input = $(this);
    //            var value;
    //            switch (input.attr('type')) {
    //                case 'checkbox':
    //                    value = input.prop('checked');
    //                    break;
    //                default:
    //                    value = input.val();
    //                    break;
    //            }
    //            form[input.data('name')] = value;
    //        });

    //        ShowStatusDisplay("Saving...");
    //        CallAjaxHandler(publicInterface.controllerUrl + '/SavePerson', form, function (info) {
    //            if (info.Person) {
    //                applyValues(info.Person);
    //                var searchText = $('#txtSearch').val();
    //                if (searchText) {
    //                    local.peopleHelper.SearchNames(searchText, onNamesReady, false);
    //                }
    //            }
    //            ShowStatusDisplay(info.Status);
    //        });
    //    };


    var navigating = function (ev) {
        switch (ev.which) {
            case 38: // up
                moveSelected(-1);
                ev.preventDefault();
                return true;

            case 40: // down
                moveSelected(1);
                ev.preventDefault();
                return true;

            case 13: // enter
                var selected = local.nameList.children().eq(local.rowSelected).attr('id');
                if (selected) {
                    var id = +selected.substr(1);
                    edit(id);
                    ev.preventDefault();
                    return true;
                }
                ev.preventDefault();
                return false;

            default:
        }
        return false;
    };

    var runSearch = function (ev) {
        clearTimeout(local.keyTimer);
        var input = $(this);
        var text = input.val();
        if (navigating(ev)) {
            return;
        }
        if (local.lastSearch === text.trim()) return;
        if (text == '') {
            resetSearch();
            return;
        }
        local.actionTag.addClass('delaying');
        input.addClass('delaying');

        local.keyTimer = setTimeout(function () {
            local.lastSearch = text;
            local.actionTag.removeClass('delaying');
            input.removeClass('delaying');
            local.actionTag.addClass('searching');
            input.addClass('searching');

            local.peopleHelper.SearchNames(text, onNamesReady, false, null, false);
        }, local.keyTime);
    };
    var resetSearch = function () {
      $('#txtSearch').val('');
      local.actionTag.removeClass('delaying');
      local.inputField.removeClass('delaying');
      local.lastSearch = '';
      onNamesReady({
            People: [],
            MoreFound: moreFound(local.totalOnFile)
        });
    };
    var moreFound = function (num) {
        return comma(num) + '  people on file';
    };
    var nameClick = function (ev) {
        var el = ev.target;
        while (el.tagName != 'LI') {
            el = el.parentNode;
            if (el == null) return;
        }
        edit(+el.id.substr(1));
    };
    var preparePage = function () {
        local.peopleHelper = new PeopleHelper(publicInterface.peopleUrl);
        local.peopleHelper.Prepare();

        local.inputField = $('#txtSearch').focus();
        local.inputField.bind('keyup paste', runSearch);
        local.actionTag = $('#action');
        local.nameList = $('#nameList');
        $(document).on('click', '#nameList li', nameClick).focus();
        $(document).on('click', '#btnAddNew', addNewPerson);

        $('#btnListVoters').click(function () {
          specialSearch('~~Voters~~');
        });
        $('#btnListTied').click(function () {
          specialSearch('~~Tied~~');
        });

        local.totalOnFile = publicInterface.namesOnFile;

        site.onbroadcast(site.broadcastCode.personSaved, personSaved);

        resetSearch();

        site.qTips.push({ selector: '#qTipSearch', title: 'Searching', text: 'Type one or two parts of the person\'s name. ' });
    };

  var specialSearch = function(code) {
    resetSearch();
    local.peopleHelper.SearchNames(code, onNamesReady, false, null, false);
  };
  
  var personSaved = function (ev, info) {
        var searchText = $('#txtSearch').val();
        local.totalOnFile = info.OnFile;
        if (searchText) {
            local.maintainCurrentRow = true;
            local.showPersonId = info.Person.C_RowId;
            local.peopleHelper.SearchNames(searchText, onNamesReady, false, null, false);
        }
        else {
            $('#more').html(moreFound(info.OnFile));
        }
    };

    //    var prepareReasons = function () {
    //        var html = ['<option value="">Select a reason if ineligible...</option>'];
    //        var group = '';
    //        $.each(publicInterface.invalidReasons, function () {
    //            var reasonGroup = this.Group;
    //            if (reasonGroup != group) {
    //                if (group) {
    //                    html.push('</optgroup>');
    //                }
    //                html.push('<optgroup label="{0}">'.filledWith(reasonGroup));
    //                group = reasonGroup;
    //            }
    //            html.push('<option value="{Guid}">{Desc}</option>'.filledWith(this));
    //        });
    //        html.push('</optgroup>');
    //        return html.join('\n');
    //    };

    var publicInterface = {
        peopleUrl: '',
        namesOnFile: 0,
        PreparePage: preparePage
    };
    return publicInterface;
};

var peoplePage = PeoplePage();

$(function () {
    peoplePage.PreparePage();
});