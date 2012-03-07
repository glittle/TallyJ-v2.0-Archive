﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TallyJ.Code;
using TallyJ.Code.Session;
using TallyJ.Models;

namespace TallyJ.Controllers
{
  public class PublicController : Controller
  {
    //
    // GET: /Public/

    public ActionResult Index()
    {
      return View("Home", new PublicHomeViewModel());
    }

    public ActionResult About()
    {
      return View();
    }

    public ActionResult Contact()
    {
      return View();
    }

    public ActionResult Learning()
    {
      return View();
    }

    public JsonResult Heartbeat()
    {
      return new PulseModel().ProcessPulseJson();
    }

    public ActionResult Install()
    {
      return View();
    }

    public JsonResult TellerJoin(int election, string pc)
    {
      return new TellerModel().GrantAccessToGuestTeller(election, pc);
    }

    public JsonResult GetTimeOffset(long now, string tz)
    {
      // adjust client time by .5 seconds to allow for network and server time
      const double fudgeFactor = .5 * 1000;
      var clientTimeNow = new DateTime(1970, 1, 1).AddMilliseconds(now + fudgeFactor);
      var serverTime = DateTime.Now.ToUniversalTime();
      var diff = (serverTime - clientTimeNow).TotalMilliseconds;
      UserSession.TimeOffset = diff.AsInt();
      UserSession.TimeOffsetKnown = true;
      return new
               {
                 timeOffset = diff
               }.AsJsonResult();
    }
  }
}
