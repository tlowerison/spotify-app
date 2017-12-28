app.factory("logInFactory", function($location, $window, $http) {
	
		function refreshLogIn() {
			return new Promise(function(resolve, reject) {
				$http({
					method: "POST",
					url: "/refresh",
					data: {
						refresh_token: refresh_token
					}
				})
				.then(function(res) {
					if (res.data.access_token) {
						setSpotifyTokens(res.data);
						resolve();
					}
				})
			});
		}
		function isLoggedIn() {
			return new Promise(function(resolve, reject) {
				console.log(spotifyHeaders)
				if (spotifyHeaders != null) {
					resolve();
				} else {
					$location.path("/");
					reject();
				}
			});
		}
		return {
			isLoggedIn: isLoggedIn,
			refreshLogIn: refreshLogIn
		}
});

