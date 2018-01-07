app.controller("Browse", function($scope, $http, $location, apiFactory, dataFactory) {

	$scope.init = function(type, id) {
		var width = $("#page-content-wrapper").width();
		var colSize = width >= 1200 ? "xl" : (width >= 992 ? "lg" : (width >= 768 ? "md" : (width >= 576 ? "sm" : "xs")));
		var numItemsPerRow = colSize == "xs" ? 2 : (colSize == "sm" ? 3 : (colSize == "md" ? 4 : 6));
		var now = new Date()
		var timestamps = [
			now.toISOString(),
			new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
			new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
			new Date(now.getTime() - 1000 * 60 * 60 * 9).toISOString()
		];

		$scope.featuredPlaylists = [];

		if (type == "featured") {
			for (var j in timestamps) {
				function foo(i) {
					apiFactory.call("Get a List of Featured Playlists", {
						limit: numItemsPerRow,
						timestamp: timestamps[i]
					})
					.then(function(res) {
						$scope.featuredPlaylists.push({
							message: res.data.message,
							playlists: res.data.playlists.items
						});
					})
				}
				foo(j)
			}
		}
	}

	$scope.onObjectClick = function(type, id) {
		if (type == "playlist") {
			dataFactory.currentObject = {
				type: "playlist",
				id: id
			}
		} else if (type == "album") {
			dataFactory.currentObject = {
				type: "album",
				id: id
			}
		}
	}
});
