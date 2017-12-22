var spawn = require("child_process").spawn

module.exports = function (method, pcaPath, clfPath, pngPath, samples) {
	var write = [method, pcaPath, clfPath, pngPath, JSON.stringify(samples)]
	py = spawn("python", ["svm.py"])
	py.stdin.write(write.join('\n'))
	py.stdin.end()
}
