﻿//------------------------------------------------------------------------------
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
    using System.Data.Entity;
    using System.Data.Entity.Infrastructure;
    using System.Data.Objects;
    
    public partial class TallyJ2Entities : DbContext
    {
        public TallyJ2Entities()
            : base("name=TallyJ2Entities")
        {
        }
    
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            throw new UnintentionalCodeFirstException();
        }
    
        public DbSet<C_Log> C_Log { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Reason> Reasons { get; set; }
        public DbSet<ResultSummary> ResultSummaries { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<JoinElectionUser> JoinElectionUsers { get; set; }
        public DbSet<Computer> Computers { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Teller> Tellers { get; set; }
        public DbSet<Election> Elections { get; set; }
        public DbSet<Person> People { get; set; }
        public DbSet<Result> Results { get; set; }
        public DbSet<Ballot> Ballots { get; set; }
        public DbSet<vBallot> vBallots { get; set; }
        public DbSet<vResultInfo> vResultInfoes { get; set; }
        public DbSet<Vote> Votes { get; set; }
        public DbSet<vVoteInfo> vVoteInfoes { get; set; }
        public DbSet<vLocationInfo> vLocationInfoes { get; set; }
    
        public virtual ObjectResult<CloneElection_Result> CloneElection(Nullable<System.Guid> sourceElection, string byLoginId)
        {
            ((IObjectContextAdapter)this).ObjectContext.MetadataWorkspace.LoadFromAssembly(typeof(CloneElection_Result).Assembly);
    
            var sourceElectionParameter = sourceElection.HasValue ?
                new ObjectParameter("SourceElection", sourceElection) :
                new ObjectParameter("SourceElection", typeof(System.Guid));
    
            var byLoginIdParameter = byLoginId != null ?
                new ObjectParameter("ByLoginId", byLoginId) :
                new ObjectParameter("ByLoginId", typeof(string));
    
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction<CloneElection_Result>("CloneElection", sourceElectionParameter, byLoginIdParameter);
        }
    }
}
