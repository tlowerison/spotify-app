var q = "tasks";

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require("amqplib").connect(url);
var spawn = require("child_process").spawn

// Consumer
open.then(function(conn) {
	var ok = conn.createChannel();
	ok = ok.then(function(ch) {
		ch.assertQueue(q);
		console.log("CHANNEL EXISTS");

		ch.consume(q, function(msg) {
			console.log("consuming");
			if (msg !== null) {
				console.log("CONSUMER");
				console.log("Consuming from queue");
				console.log(msg.content.toString("utf8"));
				if (fs.existsSync("worker.py")) {
					console.log("worker.py exists")
				}
				py = spawn("python", ["worker.py"])
				py.stdout.on("data", function(data) {
					console.log(data.toString());
				})
				py.stdout.on("end", function() {
					console.log("ended")
				})
				py.stdin.write(msg.content.toString("utf8"))
				py.stdin.end();
				ch.ack(msg);
			}
		});
	});
	return ok;
}).then(null, console.warn);
