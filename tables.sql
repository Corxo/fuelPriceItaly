--DB STRUCTURE FOR STORING PRICES FROM OPEN DATA
CREATE TABLE IF NOT EXISTS 'prices'(
    idStation int NOT NULL,
    fuel varchar(100) NOT NULL,
    price float NOT NULL,
    isSelf int(1) NOT NULL,
    tsCattura timestamp NOT NULL
);
CREATE TABLE stations(
    idStation int NOT NULL PRIMARY KEY,
    company varchar(500),
    flag varchar(50),
    'type' varchar(500),
    name varchar(500),
    address varchar(1000) NOT NULL,
    municipality varchar(1000) NOT NULL,
    province varchar(2),
    lat varchar(100),
    log varchar(100)
);

--USERS DATA
CREATE TABLE IF NOT EXISTS users(
    us_id BIGINT NOT NULL,
    us_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    us_preferences JSON
);

CREATE TABLE `flags` (
  `stl_id` int(11) NOT NULL AUTO_INCREMENT,
  `stl_label` varchar(512) NOT NULL,
  PRIMARY KEY (`stl_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4