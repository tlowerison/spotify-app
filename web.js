var tmp = require("tmp");
var dotenv = require("dotenv");
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var fs = require("fs");

var app = express();
app.use(express.static(__dirname + "/public")).use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.load();

var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;
var scope = "playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-library-read user-library-modify user-read-private user-read-email user-read-birthdate user-follow-read user-follow-modify user-top-read user-read-playback-state user-read-recently-played user-read-currently-playing user-modify-playback-state";
var stateKey = "spotify_auth_state";
var tmps = {};
var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require("amqplib").connect(url);
var worker = require("./worker.js");

var generateRandomString = function(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

app.get("/spotify-login", function(req, res) {
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
					CLF: tmp.fileSync({postfix: ".pkl"}),
					PNG: tmp.fileSync({postfix: ".png"})
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
	tmps[tmpsId].PNG.removeCallback();
	delete tmps[tmpsId];
}

app.delete("/tmps", function(req, res) {
	var tmpsId = req.query.tmpsId;
	removeTmps(tmpsId);
});

// All accessible pages use the basic html index file
// Individual pages are designed and provided using AngularJS routing
app.get("/((:page(browse|library|search))|(library/:type(playlists|savedalbums|savedtracks|recentlyplayed))|(:type(playlist|album|artist|track)/:id)|(user/:user/playlist/:id)|(login)|(tokens/:access_token/:refresh_token))", function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get("/img.png", function(req, res) {
	var tmpsId = req.query.tmpsId;
	var stats = fs.statSync(tmps[tmpsId].PNG.name)
	var fileSizeInBytes = stats["size"]
	console.log("Retrieving image at " + tmps[tmpsId].PNG.name + " with file size " + fileSizeInBytes.toString());
	res.sendFile(tmps[tmpsId].PNG.name);
})

// Publisher
var q = "tasks";
app.post("/tracks-svm", function(req, res) {
	var workerReq = [
		req.body.method,
		tmps[req.body.tmpsId].PCA.name,
		tmps[req.body.tmpsId].CLF.name,
		tmps[req.body.tmpsId].PNG.name,
		JSON.stringify(req.body.samples)
	].join("\n");

	open.then(function(conn) {
		var ok = conn.createChannel();
		ok = ok.then(function(channel) {
			channel.assertQueue(q);
			console.log("PUBLISHER")
			console.log("Sending to Queue");
			console.log(workerReq);
			channel.sendToQueue(q, new Buffer(workerReq));
		});
		return ok;
	}).then(null, console.warn);

	res.end();
});

app.listen(process.env.PORT);

process.on("exit", function() {
	for (var tmpsId in tmps) {
		removeTmps(tmpsId);
	}
});
