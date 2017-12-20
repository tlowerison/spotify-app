app.factory("logInFactory", function($location, $window, $http) {
	
		function refreshLogIn() {
			return new Promise(function(resolve, reject) {
				$http({
					method: "GET",
					url: "/refresh"
				})
				.then(function(res) {
					if (res.data.accessToken && res.data.refreshToken) {
						//console.log("refreshed!");
						//console.log("accessToken", res.data.accessToken);
						set_spotify_tokens(res.data);
						//setTimeout(this.refreshLogIn, 15);//res.data.expiresIn);
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
						console.log('setting timer');
						setTimeout(function() {
							console.log('plz refresh')
							this.refreshLogIn();
						}, 15);//res.data.expiresIn);
						resolve();
					} else {
						$location.path("/");
						reject();
					}
				});
			});
		}
		return {
			isLoggedIn: isLoggedIn
		}
});

