var webpage = require('webpage'),
	page = webpage.create(),
	fs = require('fs'),
	myFile = './heisedump.txt',
	startUrl = 'http://www.heise.de/',
	teaserQuery = '#mitte_news .multiple',
	linkQuery = 'a.the_content_url',
	headlineQuery = 'h2',
	commentsQuery = 'div.kommentare',
	dateQuery = '#mitte_news .news_datum';

var now = function() {
	var _now = new Date(),
		datestring = _now.getDate() + '.' + (_now.getMonth() + 1) + '.' + _now.getFullYear() + ', ' + _now.getHours() + ':',
		_min = _now.getMinutes();
	datestring += (_min > 9)? '' : '0';
	datestring += _min;
	return datestring;
};

page.onConsoleMessage = function(msg) {
	console.log('//' + msg);
};

page.open(startUrl, function(status) {
	if (status !== 'success') {
		console.log('Netzwerkproblem: ' + status);
		phantom.exit();
	}
	page.render('heise_' + Date.now() + '.jpg', {format: 'jpeg', quality: 80});
	console.log('Screenshot gespeichert');
	var pageData = page.evaluate(function(q1, q2, q3, q4) {
		console.log('Startseite eingelesen');
		var ret = [],
			teasers = $(q1);
		for (var i = 0; i < teasers.length; i++) {
			ret.push({
				url: teasers[i].querySelector(q2).href,
				headline: teasers[i].querySelector(q3).textContent.trim(),
				comments: teasers[i].querySelector(q4).textContent.trim()
			});
		}
		return ret;
	}, teaserQuery, linkQuery, headlineQuery, commentsQuery);

	var subpages = [],
		scrapedData = [],
		pagesOpen = 0;
	pageData.forEach(function(el, i) {
		subpages.push(webpage.create());
		subpages[i].open(el.url, function() {
			window.setTimeout(function() {
				console.log('Lese Seite ' + (i + 1) + ' ' + el.url);
				var date = subpages[i].evaluate(function(q) {
					return $(q).text().trim();
				}, dateQuery);
				el.date = date;
				el.pageLength = subpages[i].plainText.length;
				scrapedData[i] = el;
				if (++pagesOpen === subpages.length) writeFile(scrapedData);
			}, pageData.length * 2000);
		});
	});
});

var writeFile = function(data) {
	var output = now() + '\n';
	data.forEach(function(el, i) {
		output += (i + 1) + '\t' + el.headline + '\t' + el.url + '\t' + el.pageLength + ' Zeichen\t' + el.comments + ' Kommentare\t' + el.date + '\n';
	});
	fs.write(myFile, output + '\n', 'a');
	console.log('Log geschrieben - Ende');
	phantom.exit();
}