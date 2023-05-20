let userData = {};

// URLクエリパラメータからユーザデータを取得
// TODO 例外処理を書く
if (window.location.search) {
	const url = new URL(window.location.href);
	const userParam = url.searchParams.get('user');
	const obj = decodeURIComponent(userParam);
	const loadUserData = JSON.parse(obj);

	// localStorageにデータが有る場合は、上書きするか確認する。
	let s = JSON.parse(window.localStorage.getItem('userData'));
	if (s){
		let checkUpdate = window.confirm("すでにユーザデータがあります。上書きしますか？");
		if (checkUpdate) {
		window.localStorage.setItem('userData', JSON.stringify(loadUserData));
		window.alert("データの読み込みが完了しました。");
		url.searchParams.delete('user');
		history.replaceState('', '', url.pathname);
		} else {
		window.alert("データの読み込みをキャンセルしました。");
		}
	} else {
		window.localStorage.setItem('userData', JSON.stringify(loadUserData));
		window.alert("データの読み込みが完了しました。");
		url.searchParams.delete('user');
		history.replaceState('', '', url.pathname);
	}
}

// localStorageからデータを取得
userData = loadLocalStorage('userData');

// マップデータの読み込み
dispLoading();
const islandData = await loadIslandData();
removeLoading();


// 港湾データの読み込み
const portData = await (await fetch("./data/portData.json")).json();
const seaRouteData = await (await fetch("./data/seaRouteData.json")).json();


// マップの表示
var map = L.map('map',{
	center: [35.3622222, 138.7313889],
	zoom: 5
});
// マップにハッシュを追加
L.hash(map);

var visitedColor = "#FF0000";
var passedColor = "#0000FF";
var unreachedColor = "#000000";
var notFoundColor = "#00FF00";

// タイル選択
var gsiAttribution = [
"<a href='https://maps.gsi.go.jp/development/ichiran.html'>国土地理院</a>"
]
var nlftpIslandAttribution = [];
// [
// 	"<a href='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C23.html' target='_blank'>「国土数値情報（海岸線データ）」</a>、<a href='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-W09-v2_2.html' target='_blank'>「国土数値情報（湖沼データ）」</a>を加工して作成"
// ]
var nlftpPortAttribution = [];
// [
// 	"<a href='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C02-v3_2.html' target='_blank'>「国土数値情報（港湾データ）」</a>を加工して作成"
// ]

var gsiPaleLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',{
	minZoom: 2,
	maxZoom: 18,
	attribution: gsiAttribution,
});
var gsiStdLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',{
	minZoom: 2,
	maxZoom: 18,
	attribution: gsiAttribution,
});
var gsiBlankLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png',{
	minZoom: 5,
	maxZoom: 18,
	attribution: gsiAttribution,
});
var gsiOrtLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',{
	minZoom: 2,
	maxZoom: 18,
	opacity: 0.7,
	attribution: gsiAttribution
						// + ",「データソース：Landsat8画像（GSI,TSIC,GEO Grid/AIST）, Landsat8画像（courtesy of the U.S. Geological Survey）, 海底地形（GEBCO）」"
						// + ",「Images on 世界衛星モザイク画像 obtained from site https://lpdaac.usgs.gov/data_access maintained by the NASA Land Processes Distributed Active Archive Center (LP DAAC), USGS/Earth Resources Observation and Science (EROS) Center, Sioux Falls, South Dakota, (Year). Source of image data product.」",
});
var baseMap = {
	"地理院 淡色地図": gsiPaleLayer.addTo(map),
	"地理院 標準地図": gsiStdLayer,
	"地理院 白地図": gsiBlankLayer,
	"地理院 オルソ": gsiOrtLayer,
};

// 凡例の表示
const legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
const div = L.DomUtil.create('div', 'info legend');
const labels = [];

// ユーザーデータが読み込めていた場合、名前を表示する
if (userData && userData.name) {
	labels.push(`<i style="background:` + '#FFFFFF'   + `"></i> ` + userData.name );
}

labels.push(`<i style="background:` + visitedColor   + `"></i> 上陸済み`);
labels.push(`<i style="background:` + passedColor    + `"></i> 寄港・通過済み`);
labels.push(`<i style="background:` + unreachedColor + `"></i> 未到達`);

div.innerHTML = labels.join('<br>');
return div;
};
legend.addTo(map);

// カラー選択
function getColor(id) {
// userDataの指定がない場合は全部未到達で返す
if (!userData) return unreachedColor;

return userData.visited.includes(id)   ? visitedColor : // 上陸済み
		userData.passed.includes(id)    ? passedColor : // 寄港済み
											unreachedColor // 未到達
		//   userData.unreached.includes(id) ? unreachedColor : // 未到達
		//                                     notFoundColor ; // 情報なし
}


// 島データ
var islandMap = L.geoJson(islandData, {
// ポリゴン表示スタイル
style: function(feature){
	return {
	color: getColor(feature.properties.id),
	fillColor: getColor(feature.properties.id),
	fillOpacity: 0.3,
	weight: 2.5,
	opacity: 1,
	}
},
// ポップアップ
onEachFeature: function (feature, layer) {
	if(feature.properties && feature.properties.islandName){
	var popupText= "<table>"
			+ "<tr><td>ＩＤ：</td><td>" + feature.properties.id + "</td></tr>"
			+ "<tr><td>島名：</td><td>" + feature.properties.islandName + "</td></tr>"
			+ "<tr><td>所属：</td><td>" + feature.properties.prefectures + " " + feature.properties.cities + "</td></tr>"
			+ "</table>";
	popupText += "<form name=\"status\">"
			+ "<label><input type=\"radio\" name=\"legend\" value=\"visited\" onchange=\"changeStatusByPopup(" + feature.properties.id + ",'visited');\">上陸済み</label><br>"
			+ "<label><input type=\"radio\" name=\"legend\" value=\"passed\" onchange=\"changeStatusByPopup(" + feature.properties.id + ",'passed');\">寄港・通過済み</label><br>"
			+ "<label><input type=\"radio\" name=\"legend\" value=\"unreached\" onchange=\"changeStatusByPopup(" + feature.properties.id + ",'unreached');\">未到達</label>"
			+ "</form>";
	layer.bindPopup(popupText);
	}
},
// 引用情報
attribution: nlftpIslandAttribution
}).addTo(map);


// 港湾データ
var portMap = L.geoJson(portData, {
// アイコン表示（FontAwesome）
pointToLayer: function (feature, latlng) {
	return L.marker(latlng, {
	icon: L.divIcon(
		{
		html:'<i class="fa-solid fa-anchor"></i>', 
		className:'color_palette solid_icon', 
		iconSize: [0, 0]
		}
	),
	});
},
// ポップアップ
onEachFeature: function onEachFeature(feature, layer) {
	if(feature.properties && feature.properties.N09_004) {
	layer.bindPopup(feature.properties.N09_004);
	}
},
// 引用情報
attribution: nlftpPortAttribution
})


// 航路データ
var seaRouteMap = L.geoJson(seaRouteData, {
// ラインの表示スタイル
style: {
	color: '#FC9000',
	weight: 3,
	opacity: 0.5,
},
// ポップアップ
onEachFeature: function onEachFeature(feature, layer) {
	if(feature.properties && feature.properties.N09_006) {
	layer.bindPopup(feature.properties.N09_006);
	}
},
// 引用情報
attribution: nlftpPortAttribution
})



var geojsonLayer = {
"島到達情報": islandMap,
"港湾情報": portMap,
"航路情報": seaRouteMap,
}

// レイヤーコントロールを追加
if (L.Browser.mobile) {
L.control.layers(
	baseMap,
	geojsonLayer,
	// モバイルでは折りたたむ
	{ collapsed: true }
).addTo(map);
} else {
L.control.layers(
	baseMap,
	geojsonLayer,
	{ collapsed: false }
).addTo(map);
}

// サイドバー
var sidebar = L.control.sidebar({
	autopan: false,
	closeButton: true,
	container: 'sidebar',
	position: 'left',
}).addTo(map)

sidebar.on('content', function(ev) {

	if (ev.id = 'user'){
		
		const userData = JSON.parse(window.localStorage.getItem('userData'));
		
		function userNameButtonClick(){
			let text = userNameTextForm.value;
			let check = changeUserName(text);

			let msg = document.getElementById('msg-user-name');
			if (check) msg.innerText = 'ユーザ名「' + text + '」で更新しました。';
			else msg.innerText = 'ユーザ名の更新に失敗しました。';
		}
		
		document.getElementById('msg-user-name').innerText = '';
		let userNameTextForm = document.getElementById('user-name');
		userNameTextForm.value = userData.name;
		let checkUserNameButton = document.getElementById('checkUserNameButton');
		checkUserNameButton.addEventListener('click', userNameButtonClick);


		function importUserJsonButtonClick(){
			let msg = document.getElementById('msg-input-user-name');
			msg.innerText = '実装前です。';
		}

		document.getElementById('msg-input-user-name').innerText = '';
		let userJsonForm = document.getElementById('export-user-json');
		userJsonForm.value = JSON.stringify(userData);
		let checkImportUserJsonButton = document.getElementById('checkImportUserJsonButton');
		checkImportUserJsonButton.addEventListener('click', importUserJsonButtonClick);


		function copyUserUrlButtonClick(){
			let text = userUrlForm.value;
			navigator.clipboard.writeText(text);

			let msg = document.getElementById('msg-export-user-url');
			msg.innerText = 'コピーしました。';
		}

		document.getElementById('msg-export-user-url').innerText = '';
		const exportUrl = new URL(window.location.href);
		exportUrl.hash = '';
		exportUrl.searchParams.set('user', JSON.stringify(userData));
		let userUrlForm = document.getElementById('export-user-url');
		userUrlForm.value = exportUrl.href.replace(/%2C/g, ',');
		let checkCopyUserUrlButton = document.getElementById('checkCopyUserUrlButton');
		checkCopyUserUrlButton.addEventListener('click', copyUserUrlButtonClick);
	}
});

export {islandData}