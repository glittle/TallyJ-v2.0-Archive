﻿/// <reference path="../../Scripts/site.js" />
/// <reference path="../../Scripts/PeopleHelper.js" />
/// <reference path="../../Scripts/jquery-1.7.1.js" />
/// <reference path="../../Scripts/fileuploader.js" />

var ImportCsvPage = function () {
    var local = {
        uploadListBody: null,
        uploadListTemplate: '',
        uploader: null,
        uploadList: [],
        activeFileRowId: 0
    };

    var staticSetup = function () {
        local.uploadListBody = $('#uploadListBody');
        local.uploadListTemplate = local.uploadListBody.html();

        $('#btnPrepareFields').live('click', function () {
            if (!local.activeFileRowId) {
                alert('Please select a file from the list first.');
                return;
            }
            getFieldsInfo();
        });

        $('.MakeActive').live('click', function () {
            var rowId = +$(this).parents('tr').data('rowid');
            setActiveUploadRowId(rowId, true);
        });

        $('.CopyMap').live('click', function () {
            if (!local.activeFileRowId) {
                alert('Please select a file from the list first.');
            }
            var rowId = +$(this).parents('tr').data('rowid');

            ShowStatusDisplay('Saving...');
            CallAjaxHandler(publicInterface.controllerUrl + '/CopyMap', { from: rowId, to: local.activeFileRowId }, function (info) {
                ShowStatusSuccess('Saved');
                showFields(info);
            });

        });
        $('#btnClearAll').live('click', function () {
            if (!confirm('Are you sure you want to permanently delete all the People records in this election?')) {
                return;
            }
            ShowStatusDisplay('Deleting...');

            CallAjaxHandler(publicInterface.controllerUrl + '/DeleteAllPeople', null, function (info) {
                ShowStatusSuccess('Deleted');
                $('#importResults').html(info.Results);
            });
        });

        $('button.deleteFile').live('click', function () {
            if (!confirm('Are you sure you want to permanently remove this file from the server?')) {
                return;
            }
            ShowStatusDisplay('Deleting...');

            var parentRow = $(this).parents('tr');
            parentRow.css('background-color', 'red');
            var rowId = parentRow.data('rowid');
            CallAjaxHandler(publicInterface.controllerUrl + '/DeleteFile', { id: rowId }, function (info) {
                if (info.previousFiles) {
                    showUploads(info);
                }
                if (rowId == local.activeFileRowId) {
                    local.activeFileRowId = 0;
                }
                ShowStatusSuccess('Deleted');
            });
        });
        $('#uploadListBody select').live('change', function () {
            var select = $(this);
            ShowStatusDisplay('Saving...');
            CallAjaxHandler(publicInterface.controllerUrl + '/FileCodePage', { id: select.parents('tr').data('rowid'), cp: select.val() }, function (info) {
                if (info.Message) {
                    ShowStatusFailed(info.Message);
                }
                else {
                    ShowStatusSuccess('Saved');
                }
            });
        });

        $('#btnImport').live('click', function () {
            if (!local.activeFileRowId) {
                alert('Please select a file from the list first.');
                return;
            }
            ShowStatusDisplay('Processing...');
            $('#importResults').html('');

            CallAjaxHandler(publicInterface.controllerUrl + '/Import', { id: local.activeFileRowId }, function (info) {
                if (info.result) {
                    $('#importResults').html(info.result);
                }
                ResetStatusDisplay();
            });
        });

        $('#fieldSelector select').live('change', fieldMapChanged);

        $('button.download').live('click', function () {
            top.location.href = '{0}/Download?id={1}'.filledWith(publicInterface.controllerUrl, $(this).parents('tr').data('rowid'));
        });

        $('#upload_target').load(function (ev) {
            ResetStatusDisplay();
        });

        local.uploader = new qq.FileUploader({
            element: $('#file-uploader')[0],
            action: publicInterface.controllerUrl + '/Upload',
            allowedExtensions: ['CSV'],
            onSubmit: function (id, fileName) {
                ShowStatusDisplay('Uploading...');
            },
            onProgress: function (id, fileName, loaded, total) {
            },
            onComplete: function (id, fileName, info) {
                ResetStatusDisplay();
                getUploadsList();
                if (info.rowId) {
                    setActiveUploadRowId(+info.rowId);
                    getFieldsInfo();
                }
            },
            onCancel: function (id, fileName) {
                ResetStatusDisplay();
            },
            showMessage: function (message) { ShowStatusFailed(message); }
        });
    };
    var getUploadsList = function () {
        CallAjaxHandler(publicInterface.controllerUrl + '/GetUploadList', null, function (info) {
            if (info.previousFiles) {
                showUploads(info);
            }
        });
    };
    var getFieldsInfo = function () {
        ShowStatusDisplay('Reading columns...');
        CallAjaxHandler(publicInterface.controllerUrl + '/ReadFields', { id: local.activeFileRowId }, function (info) {
            showFields(info);
            ResetStatusDisplay();
        });

    };
    var fieldMapChanged = function () {
        var mappings = [];

        var selectChanged = $(this);
        var selectNumChanged = selectChanged.data('num');
        var mapped = {};
        var dups = 0;

        $('#fieldSelector').children().each(function () {
            var div = $(this);
            var select = div.find('select');
            if (select.length == 0) {
                return;
            }
            //            // if other has same value, reset the other
            //            if (otherSelect.data('num') != selectNumChanged) {
            //                if (otherSelect.val() == newValue) {
            //                    // otherSelect.val('');
            //                    dups = true;
            //                }
            //            }

            var value = select.val();
            if (value) {
                mapped[value] = (mapped[value] || 0) + 1;
                if (mapped[value] > 1) {
                    dups++;
                }
                var from = div.find('h3').text();
                mappings.push(from + '->' + value);
            }
        });

        var $err = $('#mappingError');
        if (dups) {
            $err.text('Duplicate mappings found. Each TallyJ field can only be mapped to one data column.');
            return;
        }
        $err.text('');

        ShowStatusDisplay('Saving...');
        CallAjaxHandler(publicInterface.controllerUrl + '/SaveMapping', { id: local.activeFileRowId, mapping: mappings }, function (info) {
            if (info.Message) {
                ShowStatusFailed(info.Message);
            }
            else {
                ShowStatusSuccess('Saved');
            }
            if (info.Status) {
                activeUploadFileRow().children().eq(1).text(info.Status);
            }
        });
    };
    var showFields = function (info) {
        var host = $('#fieldSelector').html('<div class=ImportTips><span class="ui-icon ui-icon-info" id="qTipImportHead"></span><span class="ui-icon ui-icon-info" id="qTipImportFoot"></span></div>');
        var options = '<option value="{0}">{#ExpandName("{0}")}</option>'.filledWithEach(info.possible);
        var template1 = '<div{extra}><h3>{field}</h3><div>{^sampleDivs}</div><select data-num={num}><option class=Ignore value="">-</option>' + options + '</select></div>';
        var count = 1;
        $.each(info.csvFields, function () {
            this.sampleDivs = '<div>{0}&nbsp;</div>'.filledWithEach(this.sample);
            if (count == 1) {
                this.extra = " class=FirstCol";
            }
            this.num = count++;
            host.append(template1.filledWith(this));
            host.find('select').last().val(this.map);
        });

        site.qTips.push({ selector: '#qTipImportHead', title: 'Headers', text: 'These are the headers as found in the first line of the CSV file.  One column is shown for each column found in the CSV file.  All columns are shown, but may not need to be imported.' });
        site.qTips.push({ selector: '#qTipImportFoot', title: 'TallyJ Fields', text: 'For each column shown above, select the TallyJ field that is the best match for the information in the column.' });
        ActivateTips();
    };

    var showUploads = function (info) {
        var list;
        if (typeof info !== 'undefined') {
            list = extendUploadList(info.previousFiles);
            local.uploadList = list;
        } else {
            list = local.uploadList;
        }
        local.uploadListBody.html(local.uploadListTemplate.filledWithEach(list));
        $('div.uploadList').toggle(local.uploadListBody.children().length != 0);
        local.uploadListBody.find('select').each(function () {
            var select = $(this);
            select.val(select.data('value'));
            if (this.selectedIndex == -1) {
                this.selectedIndex = 0;
            }
        });

        if (list.length == 1) {
            setActiveUploadRowId(list[0].C_RowId, true);
        }
        showActiveFileName();
    };
    var extendUploadList = function (list) {
        $.each(list, function () {
            this.UploadTimeExt = FormatDate(this.UploadTime, null, null, true);
            this.RowClass = this.C_RowId == local.activeFileRowId ? 'Active' : 'NotActive';
            this.ProcessingStatusAndSteps = this.ProcessingStatus;
        });
        return list;
    };
    var setActiveUploadRowId = function (rowId, highlightInList) {
        SetInStorage('ActiveUploadRowId', rowId);
        local.activeFileRowId = rowId;
        if (highlightInList) {
            $.each(local.uploadList, function () {
                this.RowClass = this.C_RowId == rowId ? 'Active' : 'NotActive';
            });
            // showUploads();
            getFieldsInfoIfNeeded();
        }
        showActiveFileName();
    };
    var getFieldsInfoIfNeeded = function () {
        if (activeUploadFileRow().children().eq(1).text().trim() == 'Uploaded') {
            getFieldsInfo();
        }
    };
    var showActiveFileName = function () {
        var row = activeUploadFileRow();
        $('#activeFileName').text(row.length == 0 ? 'the CSV file' : '"' + row.children().eq(2).text().trim() + '"');
    };
    var activeUploadFileRow = function () {
        return local.uploadListBody.find('tr[data-rowid={0}]'.filledWith(local.activeFileRowId));
    };
    var preparePage = function () {
        staticSetup();
        local.activeFileRowId = GetFromStorage('ActiveUploadRowId', 0);

        showUploads(publicInterface);

        if (activeUploadFileRow().length == 0) {
            local.activeFileRowId = 0;
            SetInStorage('ActiveUploadRowId', 0);
        } else {
            getFieldsInfoIfNeeded();
        }
    };
    var publicInterface = {
        controllerUrl: '',
        PreparePage: preparePage,
        previousFiles: []
    };
    return publicInterface;
};

var importCsvPage = ImportCsvPage();

$(function () {
    importCsvPage.PreparePage();
});


