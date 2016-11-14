var urls = [
		'http://www.heise.de/',
		'http://www.ct.de/'
	],
	webpage = require('webpage'),
	page = webpage.create(),
	nr = 0;
page.viewportSize = {width: 1000, height: 5000};

var screenshot = function() {
	if (!urls.length) phantom.exit();
	var _url = urls.shift();
	console.log('Öffne Seite ' + (nr+1) + ': ' + _url);
	page.open(_url, function(status) {
		if (status !== 'success') {
			console.log('Netzwerkproblem: ' + status);
			urls.unshift(_url);
			setTimeout(screenshot, 1000);
		} else {
			++nr;
			page.evaluate(function() {
				var style = document.createElement('style'),
					bg = document.createTextNode('body {background: #fff}; html {width: 1000px};');
				style.setAttribute('type', 'text/css');
				style.appendChild(bg);
				document.head.insertBefore(style, document.head.firstChild);
			});
			page.render('screenshot_' + nr + '_' + Date.now() + '.jpg', {format: 'jpeg', quality: 80});
			setTimeout(screenshot, 2000);
		}
	});
}

screenshot();