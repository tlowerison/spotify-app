var tmp = require("tmp");
var dotenv = require("dotenv");
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");

var app = express();
app.use(express.static(__dirname + "/public")).use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.load();


var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;
var port = process.env.PORT || "8000";
var scope = "playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-library-read user-library-modify user-read-private user-read-email user-read-birthdate user-follow-read user-follow-modify user-top-read user-read-playback-state user-read-recently-played user-read-currently-playing user-modify-playback-state";
var stateKey = "spotify_auth_state";
var tmps = {};
var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require("amqplib").connect(url);

var generateRandomString = function(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

app.get("/login", function(req, res) {
	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	res.redirect("https://accounts.spotify.com/authorize?" + querystring.stringify({
		response_type: "code",
		client_id: client_id,
		scope: scope,
		redirect_uri: redirect_uri,
		state: state
	}));
});

app.get("/callback", function(req, res) {
	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect("/#" + querystring.stringify({
			error: "state_mismatch"
		}));
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: "https://accounts.spotify.com/api/token",
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: "authorization_code"
			},
			headers: {
				"Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString("base64"))
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				tmps[body.refresh_token] = {
					PCA: tmp.fileSync({postfix: ".pkl"}),
					CLF: tmp.fileSync({postfix: ".pkl"})
				}
				res.redirect("/tokens/" + body.access_token + "/" + body.refresh_token);
			} else {
				res.redirect("/#" + querystring.stringify({
					error: "invalid_token"
				}));
			}
		});
	}
});

app.post("/refresh", function(req, res) {
	// requesting access token from refresh token
	var authOptions = {
		url: "https://accounts.spotify.com/api/token",
		headers: {
			"Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString("base64"))
		},
		form: {
			grant_type: "refresh_token",
			refresh_token: req.body.refresh_token
		},
		json: true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			res.send({
				access_token: body.access_token,
				refresh_token: body.refresh_token || req.body.refresh_token
			});
		}
	});
});

function removeTmps(tmpsId) {
	tmps[tmpsId].PCA.removeCallback();
	tmps[tmpsId].CLF.removeCallback();
	delete tmps[tmpsId];
}

// All accessible pages use the basic html index file
// Individual pages are designed and provided using AngularJS routing
app.get("/((:page(browse|library|search))|(library/:type(playlists|savedalbums|savedtracks|recentlyplayed))|(:type(playlist|album|artist|track)/:id)|(user/:user/playlist/:id)|(login)|(tokens/:access_token/:refresh_token))", function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

// TASK PUBLISHER
app.post("/tracks-svm", function(req, res) {
	var workerReq = [
		req.body.tmpsId,
		req.body.method,
		tmps[req.body.tmpsId].PCA.name,
		tmps[req.body.tmpsId].CLF.name,
		JSON.stringify(req.body.samples)
	].join("\n");

	tmps[req.body.tmpsId].status = "loading";
	tmps[req.body.tmpsId].data = "";

	open.then(function(connection) {
		var options = {
			persistent: true,
			timestamp: Date.now(),
			contentEncoding: "utf-8",
			contentType: "text/plain"
		};
		var ok = connection.createChannel();
		ok = ok.then(function(channel) {
			channel.assertQueue("tasks");
			console.log("PUBLISHING TASK");
			channel.sendToQueue("tasks", new Buffer(workerReq), options);
		});
		return ok;
	}).then(null, console.warn);

	res.end();
});

// LOGOUT PUBLISHER
app.post("/logout", function(req, res) {
	var tmpsId = req.body.tmpsId;
	if (tmpsId in tmps) {
		open.then(function(connection) {
			var options = {
				persistent: true,
				timestamp: Date.now(),
				contentEncoding: "utf-8",
				contentType: "text/plain"
			};
			var ok = connection.createChannel();
			ok = ok.then(function(channel) {
				channel.assertQueue("logout");
				console.log("PUBLISHING LOGOUT");
				var data = [
					tmps[tmpsId].PCA.name,
					tmps[tmpsId].CLF.name
				].join("\n")
				channel.sendToQueue("logout", new Buffer(data), options);
				removeTmps(tmpsId);
			});
			return ok;
		}).then(null, console.warn);
	}
	res.sendFile(__dirname + '/public/index.html');
});

// STATUS CONSUMER
open.then(function(conn) {
	var ok = conn.createChannel();
	ok = ok.then(function(ch) {
		ch.assertQueue("status");

		ch.consume("status", function(msg) {
			console.log("CONSUMING STATUS");

			if (msg !== null) {
				try {
					var res = JSON.parse(msg.content.toString("utf8"));
					tmps[res.id].status = res.status;
					tmps[res.id].data = {
						decisionFunction: JSON.parse(res.decisionFunction),
						scatter: JSON.parse(res.scatter)
					}
				} catch(err) { }
				ch.ack(msg);
			}
			console.log("STATUS CONSUMED");
		});
	});
	return ok;
}).then(null, console.warn);

app.get("/img-status", function(req, res) {
	res.send({
		status: tmps[req.query.tmpsId].status,
		data: tmps[req.query.tmpsId].data
	});
});

app.listen(port, function(err) {
	if (err) console.log(err);
	else console.log("Listening on port " + port);
});
