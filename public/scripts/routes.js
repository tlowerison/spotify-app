var app = angular.module("MyApp", ["ngRoute", "cp.ngConfirm", "LocalStorageModule"])
.config(function($locationProvider, $routeProvider) {
	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix("");

	$routeProvider
	.when("/", {
		templateUrl: "views/home.html"
	})
	.when("/tokens/:access_token/:refresh_token", {
		templateUrl: "views/home.html"
	})
	.when("/_=_", {
		templateUrl: "views/home.html",
		redirectTo: "/"
	})
	.when("/library", {
		templateUrl: "views/library.html",
		controller: "Library",
		resolve: {
			loggedIn: isLoggedIn
		}
	})
	.when("/library/:type", {
		templateUrl: function(params) {
			return "views/library/" + params.type + ".html";
		},
		controller: "Library",
		resolve: {
			loggedIn: isLoggedIn
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
	.when("/:type/:id", {
		templateUrl: function(params) {
			return "views/objects/" + params.type + ".html";
		},
		controller: "Object",
		resolve: {
			loggedIn: isLoggedIn
		}
	})
	.when("/user/:user/playlist/:id", {
		templateUrl: "views/objects/playlist.html",
		controller: "Object",
		resolve: {
			loggedIn: isLoggedIn
		}
	})
	.otherwise({
		templateUrl: "views/404.html"
	});
});

function initializeSpotifyTokens(tokens, localStorageService) {
	spotifyHeaders = {
		"Accept": "application/json",
		"Authorization": "Bearer " + tokens.access_token,
		"Content-Type": "application/json"
	};
	refresh_token = tokens.refresh_token;
	tmpsId = tokens.refresh_token;

	localStorageService.set("spotifyHeaders", spotifyHeaders)
	localStorageService.set("refresh_token", refresh_token)
	localStorageService.set("tmpsId", tmpsId)
}

function refreshSpotifyTokens(tokens, localStorageService) {
	spotifyHeaders = {
		"Accept": "application/json",
		"Authorization": "Bearer " + tokens.access_token,
		"Content-Type": "application/json"
	};
	refresh_token = tokens.refresh_token;
	tmpsId = localStorageService.get("tmpsId")
	localStorageService.set("spotifyHeaders", spotifyHeaders)
	localStorageService.set("refresh_token", refresh_token)
}

function removeSpotifyTokens($http, localStorageService) {
	$http.post("/logout", { tmpsId: tmpsId })
	spotifyHeaders = null;
	refresh_token = null;
	tmpsId = null;
	localStorageService.clearAll();
}

function isLoggedIn(logInFactory) {
	return logInFactory.isLoggedIn();
}

var spotifyUrl = 'https://api.spotify.com/v1';
var spotifyHeaders = null;
var refresh_token = null;
var tmpsId = null;
