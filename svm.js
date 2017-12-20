var spawn = require('child_process').spawn,
py = spawn('python', ['svm.py']),
result = null;
var DATA = "";

py.stdout.on('data', function(data) {
	console.log('data');
	DATA = data.toString();
});

py.stdout.on('end', function() {
	console.log('Python script output:');
	console.log(DATA);
});

function promiseGenerator(method, writeDatas) {
	writeDatas = writeDatas.map(function(d) {
		return JSON.stringify(d);
	})
	writeDatas.unshift(method);
	py.stdin.write(writeDatas.join('\n'));
	py.stdin.end();
	py = spawn('python', ['svm.py']);
}

module.exports = {
	'train': function(samples) {
		promiseGenerator('train', [samples]);
	},
	'test': function(samples) {
		promiseGenerator('test', [samples]);
	},
	'unitTest': function() {
		promiseGenerator('unitTest', [[]]);
	}
};
