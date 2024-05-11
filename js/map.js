let userData = {};

let params = loadAnySearchParams(window.location.href);

// モード設定 (デフォルト：重量モード)
let mode = "heavy";

// LocalStorageにモード設定がある場合は上書きする
let currentMode = window.localStorage.getItem('mode');
if (currentMode == "heavy" || currentMode == "light") {
	mode = currentMode;
}

// クエリパラメータによってモード指定がある場合は上書きする
let loadMode = params.mode;
if (loadMode == "heavy" || loadMode == "light") {
	window.localStorage.setItem('mode', loadMode);
	mode = loadMode;
}
const url = new URL(window.location.href);
url.searchParams.delete('mode');
history.replaceState('', '', url.pathname);


// URLクエリパラメータからユーザデータを取得
if (window.location.search && params.user) {
	// ユーザ情報の読み込み
	let loadUserData = params.user;
	
	if(checkUserJson(loadUserData)){
		let checkUpdate = true;

		// localStorageにデータが有る場合は、上書きするか確認する。
		if (loadLocalStorage('userData')){
			checkUpdate = window.confirm("すでにユーザデータがあります。上書きしますか？");
			if (!checkUpdate) {
				window.alert("データの読み込みをキャンセルしました。");
			}
		}

		if (checkUpdate) {
			saveLocalStorage('userData', loadUserData);
			window.alert("データの読み込みが完了しました。");
			const url = new URL(window.location.href);
			url.searchParams.delete('user');
			history.replaceState('', '', url.pathname);
		}
	} else {
		// JSONフォーマットチェックが失敗した場合
		window.alert("JSONフォーマットがおかしいようです。");
	}
}

// localStorageからデータを取得
// TODO: 変なデータが入ってたときにnullが変えるがその例外処理を入れる
// TODO: このタイミングでデータクレンジングしたほうがいいかも
userData = loadLocalStorage('userData');

// マップデータの読み込み
let islandData; 
if (mode != "light") {
	dispLoading();
	islandData = await loadIslandData();
	removeLoading();
}

// 港湾データの読み込み
const portData = await (await fetch("./data/portData.json")).json();
const seaRouteData = await (await fetch("./data/seaRouteData.geojson")).json();


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
	"<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>"
];
var osmAttribution = [
	"© <a href='https://www.openstreetmap.org/copyright/' target='_blank'>OpenStreetMap</a> contributors"
];
var opmAttribution = [
	osmAttribution + ", <a href='http://viewfinderpanoramas.org/' target='_blank'>SRTM</a> | map style: © <a href='https://opentopomap.org/' target='_blank'>OpenTopoMap</a>"
];

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
});
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
	minZoom: 2,
	maxZoom: 18,
	attribution: osmAttribution
});
var otmLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{
	minZoom: 2,
	maxZoom: 18,
	attribution: opmAttribution
});
var baseMap = {
	"地理院 淡色地図": gsiPaleLayer.addTo(map),
	"地理院 標準地図": gsiStdLayer,
	"地理院 白地図": gsiBlankLayer,
	"地理院 オルソ": gsiOrtLayer,
	"OpenStreetMap": osmLayer,
	"OpenTopoMap": otmLayer
};

// 凡例の表示
const legend = L.control({position: 'bottomright'});
if (mode != "light") {
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
} else {
	legend.onAdd = function (map) {
		const div = L.DomUtil.create('div', 'info legend');
		const labels = [];
		labels.push("軽量モード" );
		div.innerHTML = labels.join('<br>');
		return div;
	};
}
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
		var islandInfo = {};

		// プロパティ設定
		switch (feature.properties.populatedFlag){
			case true:
				islandInfo['populated'] = "有人";
				break;
			case false:
				islandInfo['populated'] = "無人";
				break;
			default:
				islandInfo['populated'] = "不明";
		}
		switch (feature.properties.landFlag){
			case true:
				islandInfo['land'] = feature.properties.landName;
				break;
			case false:
				islandInfo['land'] = "-";
				break;
			default:
				islandInfo['land'] = "不明";
		}
		switch (feature.properties.bridgeFlag){
			case true:
				islandInfo['bridge'] = "橋繋がり";
				break;
			case false:
				islandInfo['bridge'] = "-";
				break;
			default:
				islandInfo['bridge'] = "不明";
		}
		switch (feature.properties.shipRoute){
			case true:
				islandInfo['ship'] = feature.properties.shipName;
				break;
			case false:
				islandInfo['ship'] = "-";
				break;
			default:
				islandInfo['ship'] = "不明";
		}
		switch (feature.properties.flightRoute){
			case true:
				islandInfo['flight'] = feature.properties.flightName;
				break;
			case false:
				islandInfo['flight'] = "-";
				break;
			default:
				islandInfo['flight'] = "不明";
		}

	var popupText= "<table>"
			+ "<tr><td>ＩＤ：</td><td>" + feature.properties.id + "</td></tr>"
			+ "<tr><td>島名：</td><td>" + feature.properties.islandName + "</td></tr>"
			+ "<tr><td>所属：</td><td>" + feature.properties.prefectures + " " + feature.properties.cities + "</td></tr>";
	if (islandInfo.populated != "不明") {
		popupText += "<tr><td>定住：</td><td>" + islandInfo.populated + "</td></tr>"
	}
	if (islandInfo.land != "不明" && islandInfo.land != "-") {
		popupText += "<tr><td>陸繋：</td><td>" + islandInfo.land + "</td></tr>"
	}
	if (islandInfo.bridge != "不明" && islandInfo.bridge != "-") {
		popupText += "<tr><td>橋繋：</td><td>" + islandInfo.bridge + "</td></tr>"
	}
	if (islandInfo.ship != "不明" && islandInfo.ship != "-") {
		popupText += "<tr><td>航路：</td><td>" + islandInfo.ship + "</td></tr>"
	}
	if (islandInfo.flight != "不明" && islandInfo.flight != "-") {
		popupText += "<tr><td>空路：</td><td>" + islandInfo.flight + "</td></tr>"
	}

	popupText += "</table>";

	if (userData.visited.includes(feature.properties.id)){
		islandInfo['visited'] = "checked=\"checked\"";
		islandInfo['passed'] = "";
		islandInfo['unreached'] = "";
	} else if (userData.passed.includes(feature.properties.id)){
		islandInfo['visited'] = "";
		islandInfo['passed'] = "checked=\"checked\"";
		islandInfo['unreached'] = "";
	} else {
		islandInfo['visited'] = "";
		islandInfo['passed'] = "";
		islandInfo['unreached'] = "checked=\"checked\"";
	}

	popupText += "<form name=\"status\">"
			+ "<label><input type=\"radio\" name=\"legend\" value=\"visited\" onchange=\"changeStatusByPopup(" + feature.properties.id + ",'visited');\"" + islandInfo.visited + ">上陸済み</label><br>"
			+ "<label><input type=\"radio\" name=\"legend\" value=\"passed\" onchange=\"changeStatusByPopup(" + feature.properties.id + ",'passed');\"" + islandInfo.passed + ">寄港・通過済み</label><br>"
			+ "<label><input type=\"radio\" name=\"legend\" value=\"unreached\" onchange=\"changeStatusByPopup(" + feature.properties.id + ",'unreached');\"" + islandInfo.unreached + ">未到達</label>"
			+ "</form>";
	layer.bindPopup(popupText);
	}
}}).addTo(map);


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
}})


// 航路データ
var seaRouteMap = L.geoJson(seaRouteData, {
// ラインの表示スタイル
style: function style(feature) {
	let colorCode = "#000000"

	if(feature.properties.routeId) {
		let seaRouteId = feature.properties.routeId;
		let sourceNumber = String(Math.floor(seaRouteId));
		let i32 = CRC32.str(sourceNumber);
		let colorR = (i32 & 0xFF000000) >>> 24;
		let colorG = (i32 & 0x00FF0000) >>> 16;
		let colorB = (i32 & 0x0000FF00) >>> 8;

		function toHex(b) {
			let str = b.toString(16);
			if (2 <= str.length) { return str; }
			else { return "0" + str; }
		}

		colorCode = "#" + toHex(colorR) + toHex(colorG) + toHex(colorB);

	} else if(feature.properties.lineId) {
		let seaRouteId = feature.properties.lineId;
		let sourceNumber = String(Math.floor(seaRouteId/10));
		let i32 = CRC32.str(sourceNumber);
		let colorR = (i32 & 0xFF000000) >>> 24;
		let colorG = (i32 & 0x00FF0000) >>> 16;
		let colorB = (i32 & 0x0000FF00) >>> 8;

		function toHex(b) {
			let str = b.toString(16);
			if (2 <= str.length) { return str; }
			else { return "0" + str; }
		}

		colorCode = "#" + toHex(colorR) + toHex(colorG) + toHex(colorB);

	}

	return {
		color: colorCode,
		weight: 3,
		opacity: 1.0
	}
},
// ポップアップ
onEachFeature: function onEachFeature(feature, layer) {
	if(feature.properties && feature.properties.businessName) {
		var popupText = feature.properties.businessName 

		if(feature.properties.routeName) {
			popupText += "<br/>" + feature.properties.routeName;
		}

		popupText += "<br/>（" + feature.properties.portName1 + "～" + feature.properties.portName2 + "）";

		if(feature.properties.information) {
			popupText += "<br/>" + feature.properties.information;
		}

		popupText += "<br/>" + "<a href=\"" + feature.properties.url + "\" target=\"_blank\">運航スケジュール</a>";
		layer.bindPopup(popupText);
	}
}})

if (mode == "light") {
	seaRouteMap.addTo(map);
}

// OpenSeaMap
var openSeaMap = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
	attribution: "Map style: <a href='https://www.openseamap.org' target='_blank'>OpenSeaMap</a> contributors"
});

// OpenRailwayMap
var openRailwayMap = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: "Map style: &copy; <a href='https://www.OpenRailwayMap.org' target='_blank'>OpenRailwayMap</a>"
});


var geojsonLayer;
if (mode != "light") {
	geojsonLayer = {
		"島到達情報": islandMap,
		"航路情報": seaRouteMap,
		"港湾情報": portMap,
		"OpenSeaMap": openSeaMap,
		"OpenRailwayMap": openRailwayMap
	}
} else {
	geojsonLayer = {
		"航路情報": seaRouteMap,
		"港湾情報": portMap,
		"OpenSeaMap": openSeaMap,
		"OpenRailwayMap": openRailwayMap
	}
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

	if (ev.id = 'home'){

		// TODO ここのコードは改めて整理する
		let userData = loadLocalStorage('userData');
		
		let userVisitedNum = userData.visited.length;
		let userPassedNum = userData.passed.length;
		let reachedLevel = userVisitedNum*5 + userPassedNum;

		document.getElementById("visited-number").innerText = "上陸済み　　　：" + userVisitedNum + " 島";
		document.getElementById("passed-number").innerText = "寄港・通過済み：" + userPassedNum + " 島";
		document.getElementById("reached-level").innerText = "到達レベル　　：Lv." + reachedLevel;
	}

	if (ev.id = 'setting'){
		
		// モード変更
		const checkChangeModeButton = document.getElementById('checkChangeModeButton');
		if (mode != "light") {
			checkChangeModeButton.value = "軽量モードに変更"
		} else {
			checkChangeModeButton.value = "重量モードに変更"
		}

		function changeModeButtonClick(){
			let checkUpdate = window.confirm("本当にモード変更しますか？");
			if (checkUpdate) {
				if (mode != "light") {
					window.localStorage.setItem('mode', "light");
					
				} else {
					window.localStorage.setItem('mode', "heavy");
				}
				alert('モード変更が完了しました。画面の再読み込みをします。');
				document.location.reload();
			}
		}
		checkChangeModeButton.addEventListener('click', changeModeButtonClick);
	}

	if (ev.id = 'user'){
		
		const userData = JSON.parse(window.localStorage.getItem('userData'));
		
		// TODO: 関数を別だしして整理もする

		// ユーザ名更新
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

		// インポートJSON
		function importUserJsonButtonClick(){
			let jsonData = parseUserJson(userImportJsonForm.value);
			let msg = document.getElementById('msg-input-user-name');

			if (!jsonData) {
				msg.innerText = 'インポートに失敗しました。JSONのフォーマットがおかしいようです。';
			} else if (!checkUserJson(jsonData)) {
				msg.innerText = 'インポートに失敗しました。データの中身がおかしいようです。';
			} else {
				saveLocalStorage('userData', jsonData);
				msg.innerText = 'インポートに成功しました。再読込してください。';
			}
		}
		document.getElementById('msg-input-user-name').innerText = '';
		let userImportJsonForm = document.getElementById('input-user-json');
		let checkImportUserJsonButton = document.getElementById('checkImportUserJsonButton');
		checkImportUserJsonButton.addEventListener('click', importUserJsonButtonClick);

		// エクスポートJSON
		let userJsonForm = document.getElementById('export-user-json');
		userJsonForm.value = JSON.stringify(userData);

		// エクスポートURL
		// TODO: JSONファイルのクレンジングもする
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

		// データ削除
		function userDeleteButtonClick(){
			let msg = document.getElementById('msg-delete-user');
			let checkUpdate = window.confirm("本当に削除しますか？");
			if (checkUpdate) {
				if (initializeLocalStorage('userData')) {
					msg.innerText = 'ユーザデータを削除しました。';
				} else {
					msg.innerText = 'ユーザデータの削除失敗しました。';
				}
			}
		}
		
		document.getElementById('msg-delete-user').innerText = '';
		let checkDeleteUserButton = document.getElementById('checkDeleteUserButton');
		checkDeleteUserButton.addEventListener('click', userDeleteButtonClick);
	}
});

export {islandData}