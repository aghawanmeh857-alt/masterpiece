USE [master];
GO
IF DB_ID(N'Masterpiece') IS NULL
BEGIN
    CREATE DATABASE [Masterpiece] COLLATE Arabic_100_CI_AS_SC;
END;
GO
