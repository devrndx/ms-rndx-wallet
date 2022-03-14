/* Replace with your SQL commands */
ALTER TABLE wallet ADD COLUMN `userId` varchar(100) NOT NULL DEFAULT '';
ALTER TABLE wallet ADD COLUMN `userPw` varchar(100) NOT NULL DEFAULT '';
ALTER TABLE wallet ADD COLUMN `walletAddr` varchar(100) NOT NULL DEFAULT '';
ALTER TABLE wallet ADD COLUMN `privateKey` varchar(100) NOT NULL DEFAULT '';