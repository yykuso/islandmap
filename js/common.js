/**
 * 島データを非同期で読み込みする
 * @returns {*} JSON形式 島データ
 */
async function loadIslandData() {
	// 全JSONデータを並列で読み込む
    const [
		islandData01,
		islandData02,
		islandData03,
		islandData04,
		islandData05,
		islandData06,
		islandData07,
		islandData08
	] = await Promise.all([
        fetch("./data/islands/islandData01Hokkaido.json").then(res => { return res.json(); }),
        fetch("./data/islands/islandData02Tohoku.json"  ).then(res => { return res.json(); }),
        fetch("./data/islands/islandData03Kanto.json"   ).then(res => { return res.json(); }),
        fetch("./data/islands/islandData04Chubu.json"   ).then(res => { return res.json(); }),
        fetch("./data/islands/islandData05Kinki.json"   ).then(res => { return res.json(); }),
        fetch("./data/islands/islandData06Chugoku.json" ).then(res => { return res.json(); }),
        fetch("./data/islands/islandData07Shikoku.json" ).then(res => { return res.json(); }),
        fetch("./data/islands/islandData08Kyushu.json"  ).then(res => { return res.json(); })
    ]).catch(() => {
		// 例外処理
		console.log("Error：島データ読み込み失敗");
		return {};
	});
	
	return {
		"type": "FeatureCollection",
		features: islandData01.features.concat(
			islandData02.features,
			islandData03.features,
			islandData04.features,
			islandData05.features,
			islandData06.features,
			islandData07.features,
			islandData08.features
		)
	};
};

/**
 * 島ポリゴン選択時のポップアップ表示内でステータスを変更する
 * @param {number} id 島ID
 * @param {string} status ステータス情報 ('visited', 'passed', 'unreached')
 */
function changeStatusByPopup(id, status){
    if(!isNaN(id)){
        if(status == 'visited' || status == 'passed' || status == 'unreached'){
			// localStorageからデータを取得する
			let userData = JSON.parse(window.localStorage.getItem('userData'));
			let visitedData = userData.visited;
			let passedData = userData.passed;
			let unreachedData = userData.unreached;

			// 現在ステータスを取得し、データからIDを削除する
			let before;
			if(visitedData.indexOf(id) > -1) {
				before = 'visited';
				visitedData.splice(visitedData.indexOf(id), 1);
			}
			else if(passedData.indexOf(id) > -1) {
				before = 'passed';
				passedData.splice(passedData.indexOf(id), 1);
			}
			else if(unreachedData.indexOf(id) > -1) {
				before = 'unreached';
				unreachedData.splice(unreachedData.indexOf(id), 1);
			}
			else {
				before = 'nothing';
			}

			// ステータスを更新する
			if(status == 'visited') visitedData.push(id);
			else if(status == 'passed') passedData.push(id);
			else if(status == 'unreached') unreachedData.push(id);
			
			// localStorageに保存しておく
			window.localStorage.setItem('userData', JSON.stringify(userData));
        }
    }
}

/**
 * ユーザ名を変更する
 * @param {string} name 新しいユーザ名
 */
function changeUserName(name){
	// localStorageからデータを取得する
	let userData = JSON.parse(window.localStorage.getItem('userData'));

	// ユーザ名を更新する
	userData.name = name;

	// localStorageに保存しておく
	window.localStorage.setItem('userData', JSON.stringify(userData));
}

/**
 * インジゲータの表示
 */
function dispLoading(){
	if($(".loader-wrap").length == 0){
		$("body").append("<div class='loader-wrap'><div class='loader'>Loading...</div></div>");
	}
}

/**
 * インジゲータの削除
 */
function removeLoading(){
	$(".loader-wrap").remove();
}  
