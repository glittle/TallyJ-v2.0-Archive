//------------------------------------------------------------------------------
// <auto-generated>
//    This code was generated from a template.
//
//    Manual changes to this file may cause unexpected behavior in your application.
//    Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace TallyJ.EF
{
    using System;
    using System.Collections.Generic;
    
    public partial class Computer
    {
        public int C_RowId { get; set; }
        public Nullable<System.DateTime> LastContact { get; set; }
        public Nullable<System.Guid> ElectionGuid { get; set; }
        public Nullable<System.Guid> LocationGuid { get; set; }
        public string ComputerCode { get; set; }
        public Nullable<int> ComputerInternalCode { get; set; }
        public Nullable<int> LastBallotNum { get; set; }
        public Nullable<System.Guid> Teller1 { get; set; }
        public Nullable<System.Guid> Teller2 { get; set; }
        public Nullable<System.Guid> ShadowElectionGuid { get; set; }
        public string BrowserInfo { get; set; }
    }
}
