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
        public System.Guid ElectionGuid { get; set; }
        public System.Guid LocationGuid { get; set; }
        public string ComputerCode { get; set; }
        public Nullable<int> ComputerInternalCode { get; set; }
        public Nullable<int> LastBallotNum { get; set; }
        public Nullable<System.DateTime> C_LastContact { get; set; }
    }
}