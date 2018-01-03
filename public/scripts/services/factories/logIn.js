app.factory("logInFactory", function($location, $window, $http, localStorageService) {
		return {
			isLoggedIn: function() {
				return new Promise(function(resolve, reject) {
					if (localStorageService.keys().indexOf("spotifyHeaders") != -1) {
						spotifyHeaders = localStorageService.get("spotifyHeaders")
					}
					if (localStorageService.keys().indexOf("refresh_token") != -1) {
						refresh_token = localStorageService.get("refresh_token")
					}
					if (localStorageService.keys().indexOf("tmpsId") != -1) {
						tmpsId = localStorageService.get("tmpsId")
					}

					if (tokensInitialized && spotifyHeaders != null && refresh_token != null && tmpsId != null) {
						resolve();
					} else {
						reject();
					}
				});
			},
			refreshLogIn: function() {
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
							refreshSpotifyTokens(res.data, localStorageService);
							resolve();
						}
					})
				});
			}
		}
});

