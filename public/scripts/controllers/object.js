app.controller("Object", function($scope, $http, $location, apiFactory, dataFactory) {
	$("#page-content-wrapper").hide();
	$scope.analysisPopUp = dataFactory.analysisPopUp;

	$(document).ready(function() {
		var path = $location.path();
		$scope.currentObject = {};
		path = path.slice(1, path.length);
		var user = "";
		if (path.slice(0, 4) == "user") {
			path = path.slice(path.indexOf("/") + 1, path.length);
			user = path.slice(0, path.indexOf("/"));
			path = path.slice(path.indexOf("/") + 1, path.length);
		}
		var type = path.slice(0, path.indexOf("/"));
		var id = path.slice(path.indexOf("/") + 1, path.length);
		$scope.currentObject["type"] = type;
		$scope.currentObject["id"] = id;

		if (id in dataFactory.objectCache[type]) {
			$scope.$apply(function() {
				$scope.currentObject.object = dataFactory.objectCache[type][id];
				$("#page-content-wrapper").fadeIn("slow");
			});
		} else {
			switch (type) {
				case "playlist":
					apiFactory.call("Get a Playlist", { user_id: user, playlist_id: id })
					.then(function(res) {
						$scope.currentObject.object = res.data;
						dataFactory.getOverview([], $scope.currentObject.object, false, dataFactory.loadPlaylistTracks(id, user, false), id)
						.then(function() { 
							$scope.$apply(function() {
								$("#page-content-wrapper").fadeIn("slow");
							});
						})
					})
					break;
				case "album":
					apiFactory.call("Get an Album", { id: id })
					.then(function(res) {
						$scope.currentObject.object = res.data;
						$scope.currentObject.object.tracks = res.data.tracks.items;
						dataFactory.getOverview($scope.currentObject.object.tracks, $scope.currentObject.object, false)
						.then(function() {
							$scope.$apply(function() {
								$scope.currentObject.object.overview.avgSample.Popularity = $scope.currentObject.object.popularity;
								$("#page-content-wrapper").fadeIn("slow");
							});
						})
					})
					break;
				case "artist":
					break;
			}
		}
	});
});
