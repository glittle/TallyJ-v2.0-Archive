﻿/// <reference path="../../Scripts/site.js" />
/// <reference path="../../Scripts/jquery-1.7-vsdoc.js" />

var dashboardIndex = function () {
  var localSettings = {
  };
  var publicInterface = {
    elections: [],
    electionsUrl: '',
    PreparePage: function () {
    }
  };

  return publicInterface;
};

var dashboardIndexPage = dashboardIndex();

$(function () {
  dashboardIndexPage.PreparePage();
});