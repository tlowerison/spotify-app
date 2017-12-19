var svm = require('./svm.js');
var dotenv = require('dotenv');
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var app = express();
app.use(express.static(__dirname + '/public')).use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.load();

var port = '5000';
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = 'http://localhost:'+ port + '/callback';
var scope = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-library-read user-library-modify user-read-private user-read-email user-read-birthdate user-follow-read user-follow-modify user-top-read user-read-playback-state user-read-recently-played user-read-currently-playing user-modify-playback-state';
var stateKey = 'spotify_auth_state';
var accessToken = null;
var refreshToken = null;


var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

app.get('/spotify-login', function(req, res) {
	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	res.redirect('https://accounts.spotify.com/authorize?' + querystring.stringify({
		response_type: 'code',
		client_id: client_id,
		scope: scope,
		redirect_uri: redirect_uri,
		state: state
	}));
});

app.get('/callback', function(req, res) {
	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect('/#' + querystring.stringify({
			error: 'state_mismatch'
		}));
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code'
			},
			headers: {
				'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				accessToken = body.access_token;
				refreshToken = body.refresh_token;
				res.redirect('/');
			} else {
				res.redirect('/#' + querystring.stringify({
					error: 'invalid_token'
				}));
			}
		});
	}
});

app.get('/tokens', function(req, res) {
	res.send({
		accessToken: accessToken,
		refreshToken: refreshToken
	})
});

app.get("/logout", function(req, res) {
	accessToken = null;
	refreshToken = null;
	res.sendFile(__dirname + "/public/index.html");
});

app.get('/refresh_token', function(req, res) {
	// requesting access token from refresh token
	var refreshToken = req.query.refreshToken;
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: {
			'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
		},
		form: {
			grant_type: 'refresh_token',
			refreshToken: refreshToken
		},
		json: true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			refreshToken = body.refresh_token;
			res.send({
				refreshToken: refreshToken
			});
		}
	});
});

// All accessible pages use the basic index
// Individual pages are designed and provided
// using AngularJS routing
app.get('/:page(browse|library|search)', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/library/:type(playlists|savedalbums|savedtracks|recentlyplayed)', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
})

app.get('/:type(playlist|album|artist|track)/:id', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get("/user/:user/playlist/:id", function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
})

app.get("/login", function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.post('/tracks-svm', function(req, res) {
	console.log('tracks-svm: ' + req.body.method);
	svm[req.body.method](req.body.samples)
	.then(function(result) {
		res.send(result);
	});
});

console.log('Listening on ' + port);
app.listen(parseInt(port));
