/**
 * 島ポリゴン選択時のポップアップ表示内でステータスを変更する
 * @param {*} id 島ID
 * @param {*} status ステータス情報 ('visited', 'passed', 'unreached')
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
