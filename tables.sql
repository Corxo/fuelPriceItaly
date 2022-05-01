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
)
