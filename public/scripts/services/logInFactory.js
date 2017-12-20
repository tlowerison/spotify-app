app.factory("logInFactory", function($location, $window, $http) {
	
		function refreshLogIn() {
			return new Promise(function(resolve, reject) {
				$http({
					method: "GET",
					url: "/refresh"
				})
				.then(function(res) {
					if (res.data.accessToken) {
						set_spotify_tokens(res.data);
						setTimeout(refreshLogIn, res.data.expiresIn * 1000);
						resolve();
					}
				})
			});
		}
		function isLoggedIn() {
			return new Promise(function(resolve, reject) {
				$http.get("/tokens")
				.then(function(res) {
					if (res.data.accessToken && res.data.refreshToken) {
						set_spotify_tokens(res.data);
						setTimeout(function() {
							refreshLogIn();
						}, res.data.expiresIn * 1000);
						resolve();
					} else {
						$location.path("/");
						reject();
					}
				});
			});
		}
		return {
			isLoggedIn: isLoggedIn,
			refreshLogIn: refreshLogIn
		}
});

