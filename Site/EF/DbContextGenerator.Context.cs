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
    
        public DbSet<User> Users { get; set; }
        public DbSet<C_Log> C_Log { get; set; }
        public DbSet<Ballot> Ballots { get; set; }
        public DbSet<Computer> Computers { get; set; }
        public DbSet<Election> Elections { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Person> People { get; set; }
        public DbSet<Result> Results { get; set; }
        public DbSet<ResultSummary> ResultSummaries { get; set; }
        public DbSet<Teller> Tellers { get; set; }
        public DbSet<vBallotInfo> vBallotInfoes { get; set; }
        public DbSet<vElectionListInfo> vElectionListInfoes { get; set; }
        public DbSet<vResultInfo> vResultInfoes { get; set; }
        public DbSet<JoinElectionUser> JoinElectionUsers { get; set; }
        public DbSet<Vote> Votes { get; set; }
        public DbSet<vLocationInfo> vLocationInfoes { get; set; }
        public DbSet<ImportFile> ImportFiles { get; set; }
        public DbSet<vImportFileInfo> vImportFileInfoes { get; set; }
        public DbSet<ResultTie> ResultTies { get; set; }
        public DbSet<vVoteInfo> vVoteInfoes { get; set; }
    
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
    
        public virtual ObjectResult<Nullable<long>> CurrentRowVersion()
        {
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction<Nullable<long>>("CurrentRowVersion");
        }
    
        public virtual int EraseElectionContents(Nullable<System.Guid> electionGuidToClear, Nullable<bool> eraseTallyContent, string byLoginId)
        {
            var electionGuidToClearParameter = electionGuidToClear.HasValue ?
                new ObjectParameter("ElectionGuidToClear", electionGuidToClear) :
                new ObjectParameter("ElectionGuidToClear", typeof(System.Guid));
    
            var eraseTallyContentParameter = eraseTallyContent.HasValue ?
                new ObjectParameter("EraseTallyContent", eraseTallyContent) :
                new ObjectParameter("EraseTallyContent", typeof(bool));
    
            var byLoginIdParameter = byLoginId != null ?
                new ObjectParameter("ByLoginId", byLoginId) :
                new ObjectParameter("ByLoginId", typeof(string));
    
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction("EraseElectionContents", electionGuidToClearParameter, eraseTallyContentParameter, byLoginIdParameter);
        }
    
        public virtual ObjectResult<SqlSearch_Result> SqlSearch(Nullable<System.Guid> election, string term1, string term2, string sound1, string sound2, Nullable<int> maxToReturn, ObjectParameter moreExactMatchesFound, Nullable<int> showDebugInfo)
        {
            ((IObjectContextAdapter)this).ObjectContext.MetadataWorkspace.LoadFromAssembly(typeof(SqlSearch_Result).Assembly);
    
            var electionParameter = election.HasValue ?
                new ObjectParameter("Election", election) :
                new ObjectParameter("Election", typeof(System.Guid));
    
            var term1Parameter = term1 != null ?
                new ObjectParameter("Term1", term1) :
                new ObjectParameter("Term1", typeof(string));
    
            var term2Parameter = term2 != null ?
                new ObjectParameter("Term2", term2) :
                new ObjectParameter("Term2", typeof(string));
    
            var sound1Parameter = sound1 != null ?
                new ObjectParameter("Sound1", sound1) :
                new ObjectParameter("Sound1", typeof(string));
    
            var sound2Parameter = sound2 != null ?
                new ObjectParameter("Sound2", sound2) :
                new ObjectParameter("Sound2", typeof(string));
    
            var maxToReturnParameter = maxToReturn.HasValue ?
                new ObjectParameter("MaxToReturn", maxToReturn) :
                new ObjectParameter("MaxToReturn", typeof(int));
    
            var showDebugInfoParameter = showDebugInfo.HasValue ?
                new ObjectParameter("ShowDebugInfo", showDebugInfo) :
                new ObjectParameter("ShowDebugInfo", typeof(int));
    
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction<SqlSearch_Result>("SqlSearch", electionParameter, term1Parameter, term2Parameter, sound1Parameter, sound2Parameter, maxToReturnParameter, moreExactMatchesFound, showDebugInfoParameter);
        }
    }
}
