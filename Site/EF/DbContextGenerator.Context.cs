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
        public DbSet<Ballot> Ballots { get; set; }
        public DbSet<Computer> Computers { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Reason> Reasons { get; set; }
        public DbSet<Result> Results { get; set; }
        public DbSet<ResultSummary> ResultSummaries { get; set; }
        public DbSet<Teller> Tellers { get; set; }
        public DbSet<Vote> Votes { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Election> Elections { get; set; }
        public DbSet<Person> People { get; set; }
    }
}
