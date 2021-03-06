﻿using System.Collections.Generic;
using System.Web.Mvc;
using TallyJ.Code;
using TallyJ.CoreModels;

namespace TallyJ.Controllers
{
  public class AfterController : BaseController
  {
    //
    // GET: /Setup/

    public ActionResult Index()
    {
      return View("After");
    }

    [ForAuthenticatedTeller]
    public ActionResult Analyze()
    {
      var resultsModel = new ResultsModel();

      return View(resultsModel);
    }

    [ForAuthenticatedTeller]
    public ActionResult Reports()
    {
      return View("Reports");
    }

    public ActionResult Presenter()
    {
      return View();
    }

    public ActionResult Monitor()
    {
      return View(new MonitorModel());
    }

    public JsonResult RefreshMonitor()
    {
      return new MonitorModel().LocationInfo.AsJsonResult();
    }

    [ForAuthenticatedTeller]
    public JsonResult RunAnalyze()
    {
      var resultsModel = new ResultsModel();

      resultsModel.GenerateResults();

      return resultsModel.GetCurrentResults().AsJsonResult();
    }

    public JsonResult GetReport()
    {
      var resultsModel = new ResultsModel();

      return resultsModel.FinalResultsJson;
    }

    [ForAuthenticatedTeller]
    public JsonResult UpdateElectionShowAll(bool showAll)
    {
      return new ElectionModel().UpdateElectionShowAllJson(showAll);
    }

    [ForAuthenticatedTeller]
    public JsonResult UpdateListing(bool listOnPage)
    {
      return new ElectionModel().UpdateListOnPageJson(listOnPage);
    }

    [ForAuthenticatedTeller]
    public JsonResult GetReportData(string code)
    {
      return new ResultsModel().GetReportData(code);
    }

    [ForAuthenticatedTeller]
    public JsonResult SaveTieCounts(List<string> counts)
    {
      return new ResultsModel().SaveTieCounts(counts);
    }
  }
}