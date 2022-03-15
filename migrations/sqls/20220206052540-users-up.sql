/* Replace with your SQL commands */
CREATE TABLE `users` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(36) NOT NULL DEFAULT '',
    `phonenumer` varchar(36) NOT NULL DEFAULT '',
    `email` varchar(1000) NOT NULL DEFAULT '',
    `password` varchar(1000) NOT NULL DEFAULT '',
    `wallet_address` varchar(1000) NOT NULL DEFAULT '',
    `balance` int(11) unsigned NOT NULL DEFAULT 0,
    `withdraw_limit` int(11) unsigned NOT NULL DEFAULT 100,
    `mnemonic` varchar(1000) NOT NULL DEFAULT '',
    `privateKey` varchar(1000) NOT NULL DEFAULT '',
    `isAuth` int(11) unsigned NOT NULL DEFAULT 0,
    `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
