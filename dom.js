var fs = require('fs'),
	page = require('webpage').create(),
	baseUrl = 'https://www.gruender-garage.de/ideenwettbewerb',
	myId = '/2/845',
	filterList = '/?filter[19]=&order=factor_desc&filter-submit=Filter',
	itemsSel = '#ideas-overview > div',
	linkSel = '.activity-header > h2 > a',
	barSel = '.votes-bar .filled-bar',
	myFile = './dump.txt',
	urls;

var now = function() {
	var _now = new Date();
	var datestring = _now.getDate() + '.' + (_now.getMonth() + 1) + '.' + _now.getFullYear() + ', ' + _now.getHours() + ':';
	var _min = _now.getMinutes();
	datestring += (_min > 9)? '' : '0';
	datestring += _min;
	return datestring;
};

/*page.onConsoleMessage = function(msg) {
	console.log(msg);
};*/

page.open(baseUrl + filterList, function(status) {
	if (status !== 'success') {
		console.log('Netzwerkproblem: ' + status);
		phantom.exit();
	}
	var parsed = page.evaluate(function(_myId, _itemsSel, _linkSel) {
		var _ret = {};
		var items = document.querySelectorAll(_itemsSel);
		//console.log(items.length + ' Einträge ...');
		for (var count = 0; count < items.length; ++count) {
			if (items[count].querySelector(_linkSel).href.match(_myId)) {
				_ret.count = count;
				_ret.url = [];
				_ret.url.push(items[count - 1].querySelector(_linkSel).href);
				_ret.url.push(items[count].querySelector(_linkSel).href);
				_ret.url.push(items[count + 1].querySelector(_linkSel).href);
				return _ret;
			}
		}
	}, myId, itemsSel, linkSel);
	urls = JSON.parse(JSON.stringify(parsed)); // sonst gibt's bei Shift einen Range-Error
	var output = '\nPlatz ' + (urls.count + 1) + ' - ' + now();
	console.log(output);
	fs.write(myFile, output + '\n', 'a');
	setTimeout(openTextatisch, 500);
});

var openTextatisch = function() {
	//page.close(); // funzt nicht
	if (!urls.url.length) phantom.exit();
	var nr = urls.url.length * -1 + 4;
	console.log('Öffne Detail-Seite ' + nr);
	var _url = urls.url.shift();
	if (!_url.match(/^http/)) _url = baseUrl + _url;
	page.open(_url, function(status) {
		if (status !== 'success') {
			console.log('Netzwerkproblem: ' + status);
			urls.url.unshift(_url);
			setTimeout(openTextatisch, 200)
		} else {
			var ret = page.evaluate(function(_barSel) {
				var bar = document.querySelector(_barSel);
				return bar.style.width;
			}, barSel);
			var output = 'Score ';
			output += ((nr === 2)? 'Textatisch' : _url.replace(baseUrl, '')) + ': ';
			output += ret + ' - ' + now();
			console.log(output);
			fs.write(myFile, output + '\n', 'a');
			setTimeout(openTextatisch, 500);
		}
	});
}