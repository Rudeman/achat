INSERT OR REPLACE INTO User VALUES (1,"Jan Kowalski","jan.kowalski","kowalski",0,2,"/assets/images/avatars/ashamed-woman.jpg",0,1,null);
INSERT OR REPLACE INTO User VALUES (2,"Michał Nowak","michal.nowak","nowak",0,3,"/assets/images/avatars/blackandwhite.jpg",1,1,null);
INSERT OR REPLACE INTO User VALUES (3,"Adam Kwiatkowski","adam.kwiatkowski","kwiatkowski",0,5,"/assets/images/avatars/ashamed-woman.jpg",0,1,null);

INSERT OR REPLACE INTO Contact VALUES (1,2,0,1);
INSERT OR REPLACE INTO Contact VALUES (1,3,1,1);
INSERT OR REPLACE INTO Contact VALUES (1,4,3,1);
INSERT OR REPLACE INTO Contact VALUES (1,5,4,1);

INSERT OR REPLACE INTO Contact VALUES (2,1,3,1);
INSERT OR REPLACE INTO Contact VALUES (2,4,5,1);

INSERT OR REPLACE INTO Contact VALUES (3,1,6,1);

INSERT OR REPLACE INTO Contact VALUES (4,1,6,1);
INSERT OR REPLACE INTO Contact VALUES (4,2,6,1);
INSERT OR REPLACE INTO Contact VALUES (4,5,5,1);

INSERT OR REPLACE INTO Contact VALUES (5,1,9,1);
INSERT OR REPLACE INTO Contact VALUES (5,4,8,1);
INSERT OR REPLACE INTO Contact VALUES (5,2,8,0);

INSERT OR REPLACE INTO Room VALUES (1,"uklady cyfrowe",1000684115965,1159684115965,640,960);
INSERT OR REPLACE INTO Room VALUES (2,"roboty domowe",1009684115965,1259684115965,640,960);
INSERT OR REPLACE INTO Room VALUES (3,"zoo",1059684115965,1309684115965,640,960);

INSERT OR REPLACE INTO UserRoom VALUES (1,1,0,1,1,1);
INSERT OR REPLACE INTO UserRoom VALUES (2,1,0,1,1,0);

INSERT OR REPLACE INTO UserRoom VALUES (1,2,0,1,1,1);
INSERT OR REPLACE INTO UserRoom VALUES (3,2,0,0,0,0);

INSERT OR REPLACE INTO UserRoom VALUES (2,3,0,1,0,0);
INSERT OR REPLACE INTO UserRoom VALUES (3,3,0,1,1,1);


INSERT OR REPLACE INTO Consumer VALUES (1,"ab","cd","Android",1,"rw","MobDroid","MobSharing on Andorid","","");
INSERT OR REPLACE INTO Consumer VALUES (2,"as","df","iPhone",2,"rw","iMob","MobSharing on iPhone","","");
INSERT OR REPLACE INTO Consumer VALUES (3,"qw","er","Windows Phone",3,"rw","MobWP","MobSharing on WP","","");

INSERT OR REPLACE INTO AccessToken VALUES (1,"zx","xc",1,2,2,"Android","rw");
INSERT OR REPLACE INTO AccessToken VALUES (2,"cv","vb",2,3,3,"iPhone","rw");
INSERT OR REPLACE INTO AccessToken VALUES (3,"bn","nm",3,4,5,"Windows Phone","rw")
