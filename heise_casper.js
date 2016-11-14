var casper = require('casper').create(),
	fs = require('fs'),
	colorizer = require('colorizer').create('Colorizer'),
	myFile = './heisedump.txt',
	startUrl = 'http://www.heise.de/',
	teaserQuery = '#mitte_news .multiple',
	linkQuery = 'a.the_content_url',
	headlineQuery = 'h2',
	commentsQuery = 'div.kommentare',
	dateQuery = '#mitte_news .news_datum',
	scrapedData = [];

var now = function() {
	var _now = new Date(),
		datestring = _now.getDate() + '.' + (_now.getMonth() + 1) + '.' + _now.getFullYear() + ', ' + _now.getHours() + ':',
		_min = _now.getMinutes();
	datestring += (_min > 9)? '' : '0';
	datestring += _min;
	return datestring;
};

casper.start(startUrl, function() {
	this.capture('heise_' + Date.now() + '.jpg', undefined, {format: 'jpg', quality: 80});
	casper.echo('Screenshot gespeichert');
	scrapedData = this.evaluate(function(q1, q2, q3, q4) {
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
	casper.echo('Startseite eingelesen');
});

casper.then(function() {
	scrapedData.forEach(function(el, i) {
		casper.thenOpen(el.url, function() {
			casper.echo('Lese Seite ' + (i + 1) + ' ' + el.url);
			var date = this.evaluate(function(q) {
				return $(q).text().trim();
			}, dateQuery);
			scrapedData[i].date = date;
			scrapedData[i].pageLength = this.fetchText('body').length;
		});
	});
});

casper.then(function() {
	var output = now() + '\n';
	scrapedData.forEach(function(el, i) {
		output += (i + 1) + '\t' + el.headline + '\t' + el.url + '\t' + el.pageLength + ' Zeichen\t' + el.comments + ' Kommentare\t' + el.date + '\n';
	});
	fs.write(myFile, output + '\n', 'a');
	casper.echo('Log geschrieben - Ende');
});

casper.run();
