app.controller("Sidebar", function($scope, $http, $location, $routeParams, logInFactory, localStorageService) {
	function loggedInSidebar() {
		$("#sidebar-browse").show()
		$("#sidebar-library").show()
		$("#sidebar-search").show()
		$("#sidebar-login").hide()
		$("#sidebar-logout").show()
	}

	$scope.loggedOutSidebar = function() {
		$("#sidebar-browse").hide()
		$("#sidebar-library").hide()
		$("#sidebar-search").hide()
		$("#sidebar-login").show()
		$("#sidebar-logout").hide()
		removeSpotifyTokens($http, localStorageService)
		$http.post("/logout", { tmpsId: tmpsId })
		$location.path("/");
	}

	if ($location.path().slice(0, 7) == "/tokens") {
		var url = $location.path().split('/');
		initializeSpotifyTokens({
			access_token: url[2],
			refresh_token: url[3]
		}, localStorageService)
		$location.path("/browse");
	}

	logInFactory.isLoggedIn()
	.then(loggedInSidebar)
	.catch($scope.loggedOutSidebar)
})
