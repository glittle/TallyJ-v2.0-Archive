﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity.Validation;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using FluentSecurity;
using Le;
using Microsoft.AspNet.SignalR;
using Microsoft.Practices.ServiceLocation;
using Microsoft.Practices.Unity;
using NLog;
using TallyJ.Code;
using TallyJ.Code.Helpers;
using TallyJ.Code.Session;
using TallyJ.Code.UnityRelated;
using TallyJ.Controllers;
using Unity.Mvc3;

namespace TallyJ
{
  // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
  // visit http://go.microsoft.com/?LinkId=9394801

  public class MvcApplication : HttpApplication
  {
    protected void Application_Start()
    {
      ServiceLocator.SetLocatorProvider(() => new UnityServiceLocator(UnityInstance.Container));

      UnityInstance.Container.RegisterControllers();

      DependencyResolver.SetResolver(new UnityDependencyResolver(UnityInstance.Container));

      FixUpConnectionString();
      Bootstrapper.Initialise();

      SecurityConfigurator.Configure(
        configuration =>
          {
            // http://www.fluentsecurity.net/getting-started

            // Let Fluent Security know how to get the authentication status of the current user
            configuration.GetAuthenticationStatusFrom(
              () => HttpContext.Current.User.Identity.IsAuthenticated);

            configuration.ResolveServicesUsing(
              type => UnityInstance.Container.ResolveAll(type));

            // This is where you set up the policies you want Fluent Security to enforce on your controllers and actions

            configuration.ForAllControllers().DenyAnonymousAccess();

            configuration.For<PublicController>().Ignore();


            configuration.For<AfterController>().AddPolicy(new RequireElectionPolicy());

            configuration.For<BallotsController>().AddPolicy(new RequireElectionPolicy());
            configuration.For<BallotsController>().AddPolicy(new RequireLocationPolicy());

            configuration.For<BeforeController>().AddPolicy(new RequireElectionPolicy());

            configuration.For<DashboardController>().DenyAnonymousAccess();

            configuration.For<ElectionsController>().DenyAnonymousAccess();

            configuration.For<PeopleController>().AddPolicy(new RequireElectionPolicy());

            configuration.For<SetupController>().AddPolicy(new RequireElectionPolicy());
            configuration.For<SetupController>(x=>x.Upload()).AddPolicy(new RequireElectionPolicy());

            configuration.For<AccountController>(x => x.LogOn()).DenyAuthenticatedAccess();
            configuration.For<AccountController>(x => x.Register()).DenyAuthenticatedAccess();
            configuration.For<AccountController>(x => x.ChangePassword()).DenyAnonymousAccess();
          });


      //AreaRegistration.RegisterAllAreas();

      // Register the default hubs route: ~/signalr/hubs
      RouteTable.Routes.MapHubs();            

      RegisterGlobalFilters(GlobalFilters.Filters);
      RegisterRoutes(RouteTable.Routes);

      ConfigureNLog();
    }

    private void ConfigureNLog()
    {
      // see http://nlog-project.org/wiki/Configuration_API
      var config = LogManager.Configuration;
      var target = config.FindTargetByName("logentries") as LeTarget;
      if (target != null)
      {
        var siteInfo = new SiteInfo();
        var newKey = "";
        if (siteInfo.CurrentEnvironment == "Dev")
        {
          try
          {
            newKey = File.ReadAllText(@"c:\AppHarborConfig.LogEntries.txt");
          }
          catch
          {
            // swallow this
          }
        }
        else
        {
          newKey = ConfigurationManager.AppSettings["LOGENTRIES_ACCOUNT_KEY"];
        }

        if (newKey.HasContent())
        {
          target.Key = newKey;
        }
      }
    }

    private void Application_Error(object sender, EventArgs e)
    {
      var mainException = Server.GetLastError().GetBaseException();

      var msgs = new List<string>();

      var logger = LogManager.GetCurrentClassLogger();
      var siteInfo = new SiteInfo();
      var mainMsg = mainException.GetAllMsgs("; ");
      
      msgs.Add(mainMsg);

      var ex = mainException;
      while (ex != null)
      {
        var dbEntityValidation = ex as DbEntityValidationException;
        if (dbEntityValidation != null)
        {
          var msg = dbEntityValidation.EntityValidationErrors
            .Select(eve => eve.ValidationErrors
                             .Select(ve => "{0}: {1}".FilledWith(ve.PropertyName, ve.ErrorMessage))
                             .JoinedAsString("; "))
            .JoinedAsString("; ");
          logger.Debug(msg);
          msgs.Add(msg);
        }

        ex = ex.InnerException;
      }

      logger.FatalException("Env: {0}  Err: {1}".FilledWith(siteInfo.CurrentEnvironment, msgs.JoinedAsString("; ")), mainException);

      var url = siteInfo.RootUrl;
      Response.Write(String.Format("Server Error: {0}", msgs.JoinedAsString("\r\n")));
      if (HttpContext.Current.Request.Url.AbsolutePath.EndsWith(url))
      {
        //Response.Write("Error on site");
      }else
      {
        //Response.Write(String.Format("<script>location.href='{0}'</script>", url));
        //Response.Write("Error on site");
      }
      Response.End();
    }


    private void FixUpConnectionString()
    {
      var cnString = ConfigurationManager.ConnectionStrings["MainConnection"];

      var fi = typeof (ConfigurationElement).GetField("_bReadOnly", BindingFlags.Instance | BindingFlags.NonPublic);
      fi.SetValue(cnString, false);

      cnString.ConnectionString = cnString.ConnectionString + ";MultipleActiveResultSets=True";
    }

    public static void RegisterGlobalFilters(GlobalFilterCollection filters)
    {
      filters.Add(new HandleSecurityAttribute(), 0);
      filters.Add(new HandleErrorAttribute());
    }

    public static void RegisterRoutes(RouteCollection routes)
    {
      routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

      routes.IgnoreRoute("{*favicon}", new { favicon = @"(.*/)?favicon.ico(/.*)?" });

      routes.MapRoute(
        "Default", // Route name
        "{controller}/{action}/{id}", // URL with parameters
        new
          {
            controller = "Public",
            action = "Index",
            id = UrlParameter.Optional
          } // Parameter defaults
        );
    }

    public override void Init()
    {
        base.Init();
        BeginRequest += OnBeginRequest;
    }

    private void OnBeginRequest(object sender, EventArgs e)
    {
        var urlAdjuster = new UrlAdjuster(Request.Url.AbsolutePath);

        var newUrl = urlAdjuster.AdjustedUrl;
        if (newUrl.HasContent())
        {
            Context.RewritePath(newUrl);
        }
    }

 
  }
}