var app = angular.module("MyApp", ["ngRoute", "ngTouch", "cp.ngConfirm", "LocalStorageModule"])
.config(function($locationProvider, $routeProvider) {
	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix("");

	$routeProvider
	.when("/", {
		templateUrl: "views/home.html"
	})
	.when("/recommendations", {
		templateUrl: "views/recommendations.html",
		controller: "Recommendations"
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
		templateUrl: "views/browse/featured.html",
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
	.when("/inject-noise", {
		templateUrl: "views/noise.html",
		controller: "Noise",
		resolve: {
			loggedIn: isLoggedIn
		}
	})
	.otherwise({
		templateUrl: "views/404.html"
	});
});
