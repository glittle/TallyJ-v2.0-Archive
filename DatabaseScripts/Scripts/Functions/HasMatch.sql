﻿if exists (select * from sysobjects where id = object_id('tj.HasMatch'))
drop function tj.HasMatch
GO

CREATE
/*

Name: HasMatch

Purpose: Check to see if terms are in a string

Note: 


*/
Function [tj].[HasMatch] (
    @AllTerms varchar(max)
  , @Term1 varchar(50)
  , @Term2 varchar(50)
  )
returns bit
AS
BEGIN
  if @Term2 is null
    begin
	  return case when charindex(@Term1, @AllTerms) > 0 then 1 else 0 end
	end

  -- need to see if both terms are in AllTerms, but if Term1 and Term2 are the same, can't match the same term...
  declare @i1 int, @i2 int

  set @i1 = CHARINDEX(@Term1, @AllTerms)
  set @i2 = CHARINDEX(@Term2, @AllTerms)

  if @i1 = 0 or @i2 = 0
    return 0 -- both are not matched

  if @i1 <> @i2 
    return 1 -- they match in different places

  -- they match in the same place... see if either match somewhere else
  declare @i3 int, @i4 int
  set @i3 = CHARINDEX(@Term1, @AllTerms, @i2 + 1)
  set @i4 = CHARINDEX(@Term2, @AllTerms, @i1 + 1)

  if @i3 > 0 or @i4 > 0
    return 1 -- one of them matches somewhere else

  return 0
END
GO

GRANT execute ON [tj].[HasMatch] TO [TallyJSite]
GO

-- Testing code
-- / *
select 1, tj.HasMatch('John Doe', 'Jo', 'D')
union all
select 0, tj.HasMatch('John John', 'Jo', 'D')
union all
select 1, tj.HasMatch('John John', 'Jo', 'Jo')
union all
select 1, tj.HasMatch('John John', 'Jo', null)
union all
select 0, tj.HasMatch('xyz abc xyz', 'abc', 'abc')
union all
select 1, tj.HasMatch('Glen Little', 'gl', 'li')
union all
select 1, tj.HasMatch('abc abc abc', 'abc', null)
union all
select 0, tj.HasMatch('abc abc abc', 'xyz', 'xzy')
union all
select 0, tj.HasMatch('abcdef', 'xyz', 'xzy')


-- * /