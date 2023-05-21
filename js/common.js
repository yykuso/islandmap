let DEFAULT_USER_JSON = {"version":1,"name":"","visited":[],"passed":[],"unreached":[]};

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

/*================================
		LocalStoarge
==================================*/
/**
 * localStorageのユーザ情報を初期化する
 * @param {string} key localStorageのkey
 * @returns {boolean} 初期化の実行結果
 */
function initializeLocalStorage(key) {
	if (!window.localStorage || key.length == 0) return false;

	try {
		let initData;

		if (key = 'userData') initData = DEFAULT_USER_JSON;
		else return false;
		
		window.localStorage.setItem(key, JSON.stringify(initData));

		return true;

	} catch (error) {
		console.log("error: localStorageの初期化に失敗(" + key + ")");
		return false;
	}
}

/**
 * localStorageからデータを読み込む
 * @param {string} key localStorageのkey
 * @returns {object} 読み込みしたデータ(パース済みJSON)を返す。失敗した場合はnull
 */
function loadLocalStorage(key) {
	if (!window.localStorage || key.length == 0) return null;

	try {
		let value = window.localStorage.getItem(key);

		// 該当のkeyがlocalStorageにないときは初期化する
		if (!value) {
			// 初期化 失敗
			if (!initializeLocalStorage(key)) return null;
			// 初期化 成功 > 再読み込み
			else value = window.localStorage.getItem(key);
		}

		return JSON.parse(value);

	} catch (error) {
		console.log("error: localStorageの読み込みに失敗(" + key + ")");
		return null;
	}
}

/**
 * localStorageに保存する
 * @param {string} key localStorageのkey
 * @param {object} data 保存データ(パース済みJSON)
 * @returns {boolean} 初期化の実行結果
 */
function saveLocalStorage(key, data) {
	if (!window.localStorage || key.length == 0) return false;

	try {
		let value = JSON.stringify(data);
		window.localStorage.setItem(key, value);

		return true;

	} catch (error) {
		console.log("error: localStorageへの保存に失敗(" + key + ","+ data + ")");
		return false;
	}
}

/**
 * 島ポリゴン選択時のポップアップ表示内でステータスを変更する
 * @param {number} id 島ID
 * @param {string} status ステータス情報 ('visited', 'passed', 'unreached')
 */
function changeStatusByPopup(id, status) {
    if(!isNaN(id)){
        if(status == 'visited' || status == 'passed' || status == 'unreached'){
			// localStorageからデータを取得する
			let userData = loadLocalStorage('userData');
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

			// データにIDを追加する
			if(status == 'visited') visitedData.push(id);
			else if(status == 'passed') passedData.push(id);
			else if(status == 'unreached') unreachedData.push(id);
			
			// localStorageに保存しておく
			saveLocalStorage('userData', userData);
        }
    }
}

/**
 * ユーザ名を変更する
 * @param {string} name 新しいユーザ名
 * @returns {boolean} 変更の実行結果
 */
function changeUserName(name) {
	try {
		// localStorageからデータを取得する
		let userData = loadLocalStorage('userData');
		// ユーザ名を更新する
		userData.name = name;
		// localStorageに保存しておく
		saveLocalStorage('userData', userData);

		return true;

	} catch (error) {
		console.log("error: ユーザ名の更新に失敗(" + name + ")");
		return false;
	}

}

/**
 * URLから指定したパラメータの値を取得する
 * @param {string} url 対象URL (URL型ではない)
 * @param {string} key パラメータ名
 * @returns {*} 読み込みしたデータ(パース済みJSON)を返す。失敗した場合とパラメータがない場合はnull
 */
function loadSearchParam(url, param) {
	if (url.length == 0 || key.length == 0) return null;

	try {
		let u = new URL(window.location.href);
		let p = u.searchParams.get(key);
		let o = decodeURIComponent(p);
		return JSON.parse(o);
		
	} catch (error) {
		console.log("error: URLパラメータの解析に失敗(" + url + "," + key + ")");
		return null;
	}
}

/**
 * URLから複数パラメータを取得する
 * @param {string} url 対象URL (URL型ではない)
 * @returns {object} 読み込みしたデータ(パース済みJSON)を返す。空の場合は{}、失敗した場合はnull
 */
function loadAnySearchParams(url) {
	if (url.length == 0) return null;

	try {
		let u = new URL(window.location.href);
		let p = u.searchParams;
		let params = new URLSearchParams(p);
		let obj = Object.fromEntries(params);

		Object.keys(obj).forEach(function(key) {
			try {
				let o = obj[key];
				obj[key] = JSON.parse(o);
			} catch {
				// JSONパース失敗したときは何もせずに返す
			}
		});

		return obj;

	} catch (error) {
		console.log("error: URLパラメータの解析に失敗(" + url + ")");
		return null;
	} 
}

/**
 * ユーザ設定JSONのフォーマットをチェックする
 * @param {object} data 確認対象のデータ(パース済みJSON)
 * @returns {boolean} 結果
 */
function checkUserJson(data) {
	try {
		let check = true;

		// version 1 のとき
		if (data['version'] == 1) {
			// name：string型で中身は空でも良い
			if (typeof data['name'] != "string") {
				check = false;
			}
			
			// TODO: 同じ数字が同じステータスor別ステータスにあるときは削除入れるべき
			// visited：数字の入ったオブジェクトが格納されていること
			if (typeof data['visited'] == "object"){
				let obj = data['visited'];
				Object.keys(obj).forEach(function(key) {
					if (typeof obj[key] != "number") check = false;
				});
			} else {
				check = false;
			}

			// passed：数字の入ったオブジェクトが格納されていること
			if (typeof data['passed'] == "object"){
				let obj = data['passed'];
				Object.keys(obj).forEach(function(key) {
					if (typeof obj[key] != "number") check = false;
				});
			} else {
				check = false;
			}

			// unreached：数字の入ったオブジェクトが格納されていること
			if (typeof data['unreached'] == "object"){
				let obj = data['unreached'];
				Object.keys(obj).forEach(function(key) {
					if (typeof obj[key] != "number") check = false;
				});
			} else {
				check = false;
			}
			
		} else {  // version情報がおかしいとき
			check = false;
		}
		
		return check;

	} catch (error) {
		console.log("error:フォーマットチェック失敗(" + data + ")");
		return false;
	}

}

/**
 * ユーザ情報JSONをパースする
 * @param {string} data パース対象のデータ(パース前JSON)
 * @returns {object} パース済みJSON
 */
function parseUserJson(data) {
	if (data.length == 0) return null;

	try {
		return JSON.parse(data);
	} catch (error) {
		console.log("error:パース失敗(" + data + ")");
		return null;
	}
}

/**
 * インジゲータの表示
 */
function dispLoading() {
	if($(".loader-wrap").length == 0){
		$("body").append("<div class='loader-wrap'><div class='loader'>Loading...</div></div>");
	}
}

/**
 * インジゲータの削除
 */
function removeLoading() {
	$(".loader-wrap").remove();
} 
