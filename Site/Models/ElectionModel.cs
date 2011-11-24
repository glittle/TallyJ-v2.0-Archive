using System;
using System.Linq;
using System.Web.Mvc;
using TallyJ.Code;
using TallyJ.Code.Session;
using TallyJ.EF;

namespace TallyJ.Models
{
  public class ElectionRules
  {
    public bool CanVoteLocked { get; set; }
    public bool CanReceiveLocked { get; set; }
    public bool NumLocked { get; set; }
    public bool ExtraLocked { get; set; }

    /// <summary>
    ///     Can Vote/Receive - All or Named people
    /// </summary>
    public string CanVote { get; set; }
    public string CanReceive { get; set; }

    public bool IsSingleNameElection { get; set; }

    public int Num { get; set; }
    public int Extra { get; set; }
  };

  public class ElectionModel : DataConnectedModel
  {
    /// <Summary>List of fields to allow edit from setup page</Summary>
    private readonly string[] _editableFields = new[]
                                                  {
                                                    "Name",
                                                    "DateOfElection",
                                                    "Convenor",
                                                    "ElectionType",
                                                    "ElectionMode",
                                                    "NumberToElect",
                                                    "NumberExtra",
                                                    "CanVote",
                                                    "CanReceive"
                                                  };

    /// <Summary>List of Locations</Summary>
    public IQueryable<Location> LocationsForCurrentElection
    {
      get
      {
        return
          Db.Locations
            .Where(l => l.ElectionGuid == UserSession.CurrentElectionGuid);
      }
    }

    public ElectionRules GetRules(string type, string mode)
    {
      var rules = new ElectionRules
                    {
                      Num = 0,
                      Extra = 0,
                      CanVote = "",
                      CanReceive = "",
                      IsSingleNameElection = false
                    };


      switch (type)
      {
        case "LSA":
          rules.CanVote = "A";
          rules.CanVoteLocked = true;

          rules.Extra = 0;
          rules.ExtraLocked = true;

          switch (mode)
          {
            case "N":
              rules.Num = 9;
              rules.NumLocked = true;
              rules.CanReceive = "A";
              break;
            case "T":
              rules.Num = 1;
              rules.NumLocked = false;
              rules.CanReceive = "N";
              break;
            case "B":
              rules.Num = 1;
              rules.NumLocked = false;
              rules.CanReceive = "A";
              break;
          }
          rules.CanReceiveLocked = true;

          break;

        case "NSA":
          rules.CanVote = "N"; // delegates
          rules.CanVoteLocked = true;

          rules.Extra = 0;
          rules.ExtraLocked = true;

          switch (mode)
          {
            case "N":
              rules.Num = 9;
              rules.NumLocked = true;
              rules.CanReceive = "A";
              break;
            case "T":
              rules.Num = 1;
              rules.NumLocked = false;
              rules.CanReceive = "N";
              break;
            case "B":
              rules.Num = 1;
              rules.NumLocked = false;
              rules.CanReceive = "A";
              break;
          }

          rules.CanReceiveLocked = true;

          break;

        case "Con":
          rules.CanVote = "A";
          rules.CanVoteLocked = true;

          switch (mode)
          {
            case "N":
              rules.Num = 5;
              rules.NumLocked = false;

              rules.Extra = 3;
              rules.ExtraLocked = false;

              rules.CanReceive = "A";
              break;

            case "T":
              rules.Num = 1;
              rules.NumLocked = false;

              rules.Extra = 0;
              rules.ExtraLocked = true;

              rules.CanReceive = "N";
              break;

            case "B":
              throw new ApplicationException("Unit Conventions cannot have by-elections");
          }
          rules.CanReceiveLocked = true;
          break;

        case "Reg":
          rules.CanVote = "N"; // LSA members
          rules.CanVoteLocked = false;

          switch (mode)
          {
            case "N":
              rules.Num = 9;
              rules.NumLocked = false;

              rules.Extra = 3;
              rules.ExtraLocked = false;

              rules.CanReceive = "A";
              break;

            case "T":
              rules.Num = 1;
              rules.NumLocked = false;

              rules.Extra = 0;
              rules.ExtraLocked = true;

              rules.CanReceive = "N";
              break;

            case "B":
              // Regional Councils often do not have by-elections, but some countries may allow it?

              rules.Num = 1;
              rules.NumLocked = false;

              rules.Extra = 0;
              rules.ExtraLocked = true;

              rules.CanReceive = "A";
              break;
          }
          rules.CanReceiveLocked = true;
          break;

        case "Oth":
          rules.CanVote = "A";

          rules.CanVoteLocked = false;
          rules.CanReceiveLocked = false;
          rules.NumLocked = false;
          rules.ExtraLocked = false;

          switch (mode)
          {
            case "N":
              rules.Num = 9;
              rules.Extra = 0;
              rules.CanReceive = "A";
              break;

            case "T":
              rules.Num = 1;
              rules.Extra = 0;
              rules.CanReceive = "N";
              break;

            case "B":
              rules.Num = 1;
              rules.Extra = 0;
              rules.CanReceive = "A";
              break;
          }
          break;
      }

      return rules;
    }


    /// <Summary>Saves changes to this electoin</Summary>
    public JsonResult SaveElection(Election election)
    {
      var savedElection = Db.Elections.SingleOrDefault(e => e.C_RowId == election.C_RowId);
      if (savedElection != null)
      {
        var changed = election.CopyPropertyValuesTo(savedElection, _editableFields);

        var isSingleNameElection = election.NumberToElect == 1;
        if (election.IsSingleNameElection != isSingleNameElection)
        {
          election.IsSingleNameElection = isSingleNameElection;
          changed = true;
        }

        if (changed)
        {
          Db.SaveChanges();
        }

        return new
                 {
                   Status = "Saved",
                   // TODO 2011-11-20 Glen Little: Return entire election?
                   Election = savedElection
                 }.AsJsonResult();
      }

      return new
               {
                 Status = "Unkown ID"
               }.AsJsonResult();
    }
  }
}