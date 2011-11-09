﻿using System.Linq;
using System.Web.Mvc;
using TallyJ.Code;
using TallyJ.EF;
using TallyJ.Models;

namespace TallyJ.Controllers
{
  public class SetupController : BaseController
  {
    
    public ActionResult Index()
    {
      return View("Setup");
    }

    public ActionResult People()
    {
      return View();
    }

    public JsonResult SaveElection(Election election)
    {
      return new ElectionModel().SaveElection(election);
    }

    public JsonResult DetermineRules(string type, string mode)
    {
      return new ElectionModel().GetRules(type, mode).AsJsonResult();
    }
  }
}