var app = angular.module("MyApp", ["ngRoute", "cp.ngConfirm"])
.config(function($locationProvider, $routeProvider) {
	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix("");

	$routeProvider
	.when("/", {
		templateUrl: "views/home.html"
	})
	.when("/library", {
		templateUrl: "views/library.html",
		controller: "Library",
		resolve: {
			loggedIn: loggedIn
		}
	})
	.when("/library/:type", {
		templateUrl: function(params) {
			return "views/library/" + params.type + ".html";
		},
		controller: "Library",
		resolve: {
			loggedIn: loggedIn
		}
	})
	.when("/browse", {
		templateUrl: "views/browse.html",
		controller: "Browse"
	})
	.when("/search", {
		templateUrl: "views/search.html",
		controller: "Search"
	})
	.when("/login", {
		templateUrl: "views/login.html"
	})
	.when("/:type/:id", {
		templateUrl: function(params) {
			return "views/objects/" + params.type + ".html";
		},
		controller: "Object",
		resolve: {
			loggedIn: loggedIn
		}
	})
	.when("/user/:user/playlist/:id", {
		templateUrl: "views/objects/playlist.html",
		controller: "Object",
		resolve: {
			loggedIn: loggedIn
		}
	})
	.otherwise({
		templateUrl: "views/404.html"
	});
});

function set_spotify_tokens(tokens) {
	refresh_token = tokens.refreshToken;
	spotifyHeaders = {
		"Accept": "application/json",
		"Authorization": "Bearer " + tokens.accessToken,
		"Content-Type": "application/json"
	};
}

function loggedIn(loggedInFactory) {
	return loggedInFactory;
}

var spotifyUrl = 'https://api.spotify.com/v1';
var spotifyHeaders = {};
var refresh_token = '';
