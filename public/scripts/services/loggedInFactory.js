app.factory("loggedInFactory", function($location, $window, $http) {
	return new Promise(function(resolve, reject) {
		$http.get('/tokens')
		.then(function(res) {
			if (res.data.accessToken && res.data.refreshToken) {
				set_spotify_tokens(res.data);
				resolve();
			} else {
				$location.path("/");
				reject();
			}
		});
	});
});
