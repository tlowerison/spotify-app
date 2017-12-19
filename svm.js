var spawn = require('child_process').spawn,
py = spawn('python', ['svm.py']),
result = null,
METHOD = '',
RESOLVE = null;

py.stdout.on('data', function(data) {
	console.log('data');
	data = data.toString();
});

py.stdout.on('end', function() {
	console.log('Python script ended');
	RESOLVE(result);
});

function promiseGenerator(method, writeDatas) {
	return new Promise(function(resolve) {
		RESOLVE = resolve;
		METHOD = method;
		writeDatas = writeDatas.map(function(d) {
			return JSON.stringify(d);
		})
		writeDatas.unshift(method);
		console.log('Sending data to python script');
		py.stdin.write(writeDatas.join('\n'));
		py.stdin.end();
		py = spawn('python', ['svm.py']);
	});
}

module.exports = {
	'train': function(samples) {
		return promiseGenerator('train', [samples]);
	},
	'test': function(samples) {
		return promiseGenerator('test', [samples]);
	},
	'unitTest': function() {
		return promiseGenerator('unitTest', [[]]);
	}
};
