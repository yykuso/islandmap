# 島マップ

## サイトURL
https://yykuso.github.io/islandmap/

### ユーザーデータJSON
```
{
    "version": 1,
    "name": "名前",
    "visited": [1,2,3, ...],
    "passed": [4,5,6, ...],
    "unreached": [7,8,9, ...]
}
```

URLの後ろに`?user=`をつけてJSONデータを貼り付けることでユーザデータの読み込みができる。
なお、JSONデータは、空白を削除しておくこと。

[https://yykuso.github.io/islandmap/index.html?user={"version":1,"name":"waiwai","visited":[1,2,3], ...略}](https://yykuso.github.io/islandmap/?user=%7B%22version%22%3A1,%22name%22%3A%22waiwai%22,%22visited%22%3A%5B4012,13001,14001,14003,14004,23002,32001,32002,32003,34001,34005,34006,34015,34030,35001,35011,35022,35026,36001,38001,38002,38021,38031,38032,38033,42001,42004,42005,42007,42029,42044,42049,42050,42056,44009,45005,46039,47002,36003,44015,44016%5D,%22passed%22%3A%5B28001,32004,32005,32006,34010,38004,42082,44007,35013,42055%5D,%22unreached%22%3A%5B1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,4001,4002,4003,4004,4005,4006,4007,4008,4009,4010,4011,4013,4014,6001,6002,12001,12002,12003,12004,13002,13003,13004,13005,13006,13007,13008,13009,13010,13011,13012,13013,13014,13015,13016,13017,13018,13019,13020,13021,13022,13023,13024,13025,14002,15001,15002,17001,17002,18001,18002,18003,19001,20001,22001,22002,22003,23001,23003,23004,23005,24001,24002,24003,24004,24005,24006,24007,24008,24009,24010,24011,24012,25001,25002,25003,28002,28003,28004,28005,28006,28007,28008,30001,30002,30003,30004,30005,30006,30007,30008,31001,32007,33001,33002,33003,33004,33005,33006,33007,33008,33009,33010,33011,33012,33013,33014,33015,33016,33017,33018,33019,33020,34002,34003,34004,34007,34008,34009,34011,34012,34013,34014,34016,34017,34018,34019,34020,34021,34022,34023,34024,34025,34026,34027,34028,34029,34031,34032,34033,34034,34035,34036,34037,34038,34039,34040,34041,35002,35003,35004,35005,35006,35007,35008,35009,35010,35012,35014,35015,35016,35017,35018,35019,35020,35021,35023,35024,35025,35027,35028,35029,35030,35031,35032,35033,35034,35035,35036,36002,36004,36005,36006,36007,36008,36009,37001,37002,37003,37004,37005,37006,37007,37008,37009,37010,37011,37013,37014,37015,37016,37017,37018,37019,37020,37021,37022,37023,37026,37027,37028,37029,37030,37031,37032,38003,38005,38006,38007,38008,38009,38010,38011,38012,38013,38014,38015,38016,38017,38018,38019,38020,38022,38023,38024,38025,38026,38027,38028,38029,38030,38034,38035,38036,38037,38038,38039,38040,38041,38042,38043,38044,38045,38046,38047,39001,39002,39003,39004,39005,39006,39007,39008,39009,39010,39011,39012,40001,40002,40003,40004,40005,40006,40007,40008,40009,40010,40011,41001,41002,41003,41004,41005,41006,41007,41008,41009,41010,41011,42002,42003,42006,42008,42009,42010,42011,42012,42013,42014,42015,42016,42017,42018,42019,42020,42021,42022,42023,42024,42025,42026,42027,42028,42030,42031,42032,42033,42034,42035,42036,42037,42038,42039,42040,42041,42042,42043,42045,42046,42047,42048,42051,42052,42053,42054,42057,42058,42059,42060,42061,42062,42063,42064,42065,42066,42067,42068,42069,42070,42071,42072,42073,42074,42075,42076,42077,42078,42079,42080,42081,42082,42083,42084,42085,42086,42087,42088,42089,42090,42091,42092,42093,42094,42095,42096,42097,42098,42099,42100,42101,42102,42103,42104,42105,42106,43001,43002,43003,43004,43005,43006,43007,43008,43009,43010,43011,43012,43013,43014,43015,43016,43017,43018,43019,43020,43021,43022,43023,43024,43025,43026,43027,43028,43029,43030,44001,44002,44003,44004,44005,44006,44008,44010,44011,44012,44013,44014,45001,45002,45003,45004,45006,45007,45008,45009,46001,46002,46003,46004,46005,46006,46007,46008,46009,46010,46011,46012,46013,46014,46015,46016,46017,46018,46019,46020,46021,46022,46023,46024,46025,46026,46027,46028,46029,46030,46031,46032,46033,46034,46035,46036,46037,46038,46040,47001,47003,47004,47005,47006,47007,47008,47009,47010,47011,47012,47013,47014,47015,47016,47017,47018,47019,47020,47021,47022,47023,47024,47025,47026,47027,47028,47029,47030,47031,47032,47033,47034,47035,47036,47037,47038,47039,47040,47041,47042,47043,47044,47045,47046,47047,47048,47049,47050,47051,47052,47053,47054,47055,47056,47057,47058,47059,47060,47061,47062,47063,47064,47065,47066,47067,47068,47069,37012,37024,37025%5D%7D)

