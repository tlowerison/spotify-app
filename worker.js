var q = "tasks";

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require("amqplib").connect(url);
var spawn = require("child_process").spawn

// Consumer
open.then(function(conn) {
	var ok = conn.createChannel();
	ok = ok.then(function(ch) {
		ch.assertQueue(q);

		ch.consume(q, function(msg) {
			if (msg !== null) {
				console.log("CONSUMER");
				console.log("Consuming from queue");
				console.log(msg.content.toString("utf8"));
				py = spawn("python", ["worker.py"])
				py.stdin.write(msg.content.toString("utf8"))
				py.stdin.end();
				ch.ack(msg);
			}
		});
	});
	return ok;
}).then(null, console.warn);
