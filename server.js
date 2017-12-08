var ejs = require('ejs');
var svm = require('./svm.js');
var dotenv = require('dotenv');
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var app = express();
app.use(express.static(__dirname + '/public')).use(cookieParser());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.load();

var port = '5000';
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = 'http://localhost:'+ port + '/callback';
var scope = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-library-read user-library-modify user-read-private user-read-email user-read-birthdate user-follow-read user-follow-modify user-top-read user-read-playback-state user-read-recently-played user-read-currently-playing user-modify-playback-state';
var stateKey = 'spotify_auth_state';
var ACCESS_TOKEN = null;
var REFRESH_TOKEN = null;



var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

app.get('/login', function(req, res) {
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
				var access_token = body.access_token,
				refresh_token = body.refresh_token;
				var options = {
					url: 'https://api.spotify.com/v1/me',
					headers: { 'Authorization': 'Bearer ' + access_token },
					json: true
				};

				// use the access token to access the Spotify Web API
				request.get(options, function(error, response, body) {
					//console.log(body);
				});

				ACCESS_TOKEN = access_token;
				REFRESH_TOKEN = refresh_token;
				res.redirect('/home');
			} else {
				res.redirect('/#' + querystring.stringify({
					error: 'invalid_token'
				}));
			}
		});
	}
});

app.get('/home', function(req, res) {
	res.render('home', {
		access_token: ACCESS_TOKEN,
		refresh_token: REFRESH_TOKEN
	});
});

app.get('/refresh_token', function(req, res) {
	// requesting access token from refresh token
	var refresh_token = req.query.refresh_token;
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: {
			'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
		},
		form: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token
		},
		json: true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token;
			ACCESS_TOKEN = access_token;
			REFRESH_TOKEN = refresh_token;
			res.send({
				'access_token': access_token
			});
		}
	});
});

app.post('/tracks-svm', function(req, res) {
	console.log('tracks-svm: ' + req.body.method);
	svm[req.body.method](req.body.data)
	.then(function(result) {
		console.log('Sending resulting html element from server');
		res.send(result);
	});
});

console.log('Listening on ' + port);
app.listen(parseInt(port));
