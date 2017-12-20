app.controller("Object", function($scope, $http, $location, apiFactory, dataFactory) {
	$("#page-content-wrapper").hide();
	$scope.analysisPopUp = dataFactory.analysisPopUp;

	$(document).ready(function() {
		if (dataFactory.currentObject.promise) {
			dataFactory.currentObject.promise
			.then(function() {
				$scope.$apply(function() {
					$scope.currentObject = dataFactory.currentObject;
					$scope.library = dataFactory.library;
					$scope.playlists = dataFactory.savedPlaylists;
					$scope.savedAlbums = dataFactory.savedAlbums;
					$scope.savedTracks = dataFactory.savedTracks;
					$scope.recentTracks = dataFactory.recentTracks;
					$scope.allFeatureSamples = dataFactory.allFeatureSamples;
					$("#page-content-wrapper").fadeIn("slow");
				});
			});
		} else {
			var path = $location.path()
			path = path.slice(1, path.length);
			var user = "";
			if (path.slice(0, 4) == "user") {
				path = path.slice(path.indexOf("/") + 1, path.length);
				user = path.slice(0, path.indexOf("/"));
				path = path.slice(path.indexOf("/") + 1, path.length);
			}
			var type = path.slice(0, path.indexOf("/"));
			var id = path.slice(path.indexOf("/") + 1, path.length);
			dataFactory.currentObject["type"] = type;
			dataFactory.currentObject["id"] = id;


			switch (type) {
				case "playlist":
					apiFactory.call("Get a Playlist", {
						user_id: user,
						playlist_id: id
					})
					.then(function(res) {
						dataFactory.currentObject.object = res.data;
						dataFactory.currentObject.object.tracks = [];
						dataFactory.getOverview([], dataFactory.currentObject.object, false, dataFactory.loadPlaylistTracks(id, user, false), id)
						.then(function() {
							$scope.$apply(function() {
								$scope.currentObject = dataFactory.currentObject;
								$("#page-content-wrapper").fadeIn("slow");
							});
						})
					})
					break;
				case "album":
					apiFactory.call("Get an Album", {
						id: id
					})
					.then(function(res) {
						dataFactory.currentObject.object = res.data;
						dataFactory.currentObject.object.tracks = res.data.tracks.items;
						dataFactory.getOverview(dataFactory.currentObject.object.tracks, dataFactory.currentObject.object, false)
						.then(function() {
							$scope.$apply(function() {
								$scope.currentObject = dataFactory.currentObject;
								$scope.currentObject.object.overview.avgFeatures.Popularity = $scope.currentObject.object.popularity;
								$("#page-content-wrapper").fadeIn("slow");
							});
						})
					})
					break;
				case "artist":
					break;
				case "track":
					break;
			}
		}
	});
});
