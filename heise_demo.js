var page = require('webpage').create();
page.open('http://www.heise.de/', function(status) {
	if (status !== 'success') {
		console.log('Netzwerkproblem: ' + status);
		phantom.exit();
	}
	console.log(page.plainText);
	phantom.exit();
});