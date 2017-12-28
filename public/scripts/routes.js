var app = angular.module("MyApp", ["ngRoute", "cp.ngConfirm"])
.config(function($locationProvider, $routeProvider) {
	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix("");

	$routeProvider
	.when("/", {
		templateUrl: "views/home.html"
	})
	.when("/tokens/:access_token/:refresh_token", {
		templateUrl: "views/home.html",
		redirectTo: function(params) {
			setSpotifyTokens(params);
			return "/";
		}
	})
	.when("/_=_", {
		templateUrl: "views/home.html",
		redirectTo: "/"
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
	.when("/logout", {
		templateUrl: "",
		redirectTo: function(params) {
			removeSpotifyTokens(params);
			return "/";
		},
		resolve: {
			removeTmps: function($http) {
				$http.get("/logout/")
			}
		}
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

function setSpotifyTokens(tokens) {
	spotifyHeaders = {
		"Accept": "application/json",
		"Authorization": "Bearer " + tokens.access_token,
		"Content-Type": "application/json"
	};
	refresh_token = tokens.refresh_token;
	tmpsId = tokens.refresh_token;
}

function removeSpotifyTokens() {
	spotifyHeaders = null;
	refresh_token = null;
	tmpsId = null;
}

function loggedIn(logInFactory) {
	return logInFactory.isLoggedIn();
}

var spotifyUrl = 'https://api.spotify.com/v1';
var spotifyHeaders = null;
var refresh_token = null;
var tmpsId = null;
