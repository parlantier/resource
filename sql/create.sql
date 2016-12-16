-- user
create table user(
userno int primary key
nickname varchar2(20)
password varchar2(20)
sex	char(1)
age	char(3)
mypoint	int default 0
);

-- mybook
create table mybook(
mybookno int primary key
title	
fileno	fk	N/A
userno	fk	N/A
category	N/A	N/A
hit	N/A	N/A
writtendate	N/A	N/A
updatedate	N/A	N/A
)

--tbl_attach
create table tbl_attach(
fileno int primary key,
filename varchar2(100) not null,
fileurl	varchar2(1000) not null
);

create sequence fileno_seq
increment by 1;

