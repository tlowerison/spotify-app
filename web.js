var tmp = require("tmp");
var dotenv = require("dotenv");
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var open = require("amqplib").connect("amqp://localhost");

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
			expiresIn = body.expires_in;
			res.send({
				access_token: body.access_token,
				refresh_token: body.refresh_token
			});
		}
	});
});

// All accessible pages use the basic html index file
// Individual pages are designed and provided using AngularJS routing
app.get("/((:page(browse|library|search))|(library/:type(playlists|savedalbums|savedtracks|recentlyplayed))|(:type(playlist|album|artist|track)/:id)|(user/:user/playlist/:id)|(login)|(tokens/:access_token/:refresh_token))", function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get("/img.png", function(req, res) {
	res.sendFile(req.body.tmpPNG.name);
})

app.listen(process.env.PORT);

// Publisher
var q = "tasks";
var channel = null;
open.then(function(conn) {
	var ok = conn.createChannel();
	ok = ok.then(function(ch) {
		channel = ch;
	});
	return ok;
}).then(null, console.warn);


app.post("/tracks-svm", function(req, res) {
	if (req.body.method == "train" && (tmpPCA == null || tmpCLF == null)) {
		tmpPCA = tmp.fileSync({postfix: ".pkl"});
		tmpCLF = tmp.fileSync({postfix: ".pkl"});
		tmpPNG = tmp.fileSync({postfix: ".png"});
	}
	var workerReq = [
		req.body.method,
		tmpPCA.name,
		tmpCLF.name,
		tmpPNG.name,
		JSON.stringify(req.body.samples)
	].join("\n");

	channel.assertQueue(q);
	channel.sendToQueue(q, new Buffer(workerReq));

	res.end();
});

process.on("exit", function() {
	tmpPCA.removeCallback();
	tmpCLF.removeCallback();
	tmpPNG.removeCallback();
});
