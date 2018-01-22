app.controller("Object", function($scope, $http, $location, apiFactory, dataFactory) {
	// Hide page on initial load. MAKE SURE to fade in page for object types
	$("#page-content-wrapper").hide();

	$scope.analysisPopUp = dataFactory.analysisPopUp;

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
			$scope.currentObject = dataFactory.objectCache[type][id];
			$("#page-content-wrapper").fadeIn();
	} else {
		$scope.currentObject = {};
		switch (type) {
			case "playlist":
				apiFactory.call("Get a Playlist", { user_id: user, playlist_id: id })
				.then(function(res) {
					$scope.currentObject = res.data;
					dataFactory.getOverview([], $scope.currentObject, false, dataFactory.loadPlaylistTracks(id, user, false), id)
					.then(function() { 
						$scope.$apply(function() {
							$("#page-content-wrapper").fadeIn();
						});
					})
				})
				break;
			case "album":
				apiFactory.call("Get an Album", { id: id })
				.then(function(res) {
					$scope.currentObject = res.data;
					$scope.currentObject.tracks = res.data.tracks.items;
					dataFactory.getOverview($scope.currentObject.tracks, $scope.currentObject, false)
					.then(function() {
						$scope.$apply(function() {
							$scope.currentObject.overview.avgSample.Popularity = $scope.currentObject.popularity;
							$("#page-content-wrapper").fadeIn();
						});
					})
				})
				break;
			case "artist":
				apiFactory.call("Get an Artist", { id: id })
				.then(function(res) {
					$scope.currentObject.followers = res.data.followers;
					$scope.currentObject.genres = res.data.genres;
					$scope.currentObject.images = res.data.images;
					$scope.currentObject.name = res.data.name;
					$scope.currentObject.popularity = res.data.popularity;
					$("#page-content-wrapper").fadeIn();
				});
				apiFactory.call("Get an Artist's Top Tracks", { id: id, country: "US" })
				.then(function(res) {
					$scope.currentObject.topTracks = res.data.tracks;
				});
				apiFactory.call("Get an Artist's Albums", { id: id, album_type: "album" })
				.then(function(res) {
					$scope.currentObject.albums = res.data.items;
				});
				apiFactory.call("Get an Artist's Albums", { id: id, album_type: "single" })
				.then(function(res) {
					$scope.currentObject.singles = res.data.items;
				});
				apiFactory.call("Get an Artist's Related Artists", { id: id })
				.then(function(res) {
					$scope.currentObject.relatedArtists = res.data.artists.slice(0, 10);
				})
				break;
			case "track":
				$scope.currentObject.audioFeatures = {};
				$scope.currentObject.audioAnalysis = {};
				apiFactory.call("Get a Track", { id: id })
				.then(function(res) {
					$scope.currentObject.name = res.data.name;
					$scope.currentObject.album = res.data.album;
					$scope.currentObject.artists = res.data.artists;
					$scope.currentObject.popularity = res.data.popularity;
					$("#page-content-wrapper").fadeIn();
				});
				apiFactory.call("Get Audio Features for a Track", { id: id })
				.then(function(res) {
					for (var j in removedFeatures) {
						var key = removedFeatures[j];
						delete res.data[key];
					}
					$scope.currentObject.audioFeatures = Object.entries(res.data).map(function(e) {
						return { axis: toTitleCase(e[0]), value: e[1] };
					});
					var plotData = [Object.entries(res.data).map(function(e, i) {
						var d = { axis: toTitleCase(e[0]), index: i };
						
						if (i == 2) d.value = (1 - e[1] / featureNorms[2])
						else if (i == 9) d.value = e[1] / featureNorms[i] / 2
						else d.value = e[1] / featureNorms[i];

						return d;
					})];
					var color = d3v3.scale.ordinal()
						.range([randomColor({ luminosity: "light" }).toUpperCase()]);
					var radarChartOptions = {
						levels: 5,
						roundStrokes: true,
						color: color
					};
					RadarChart(".radarChart", plotData, radarChartOptions);
				});
				apiFactory.call("Get Audio Analysis for a Track", { id: id })
				.then(function(res) {
					for (var key in res.data) $scope.currentObject.audioAnalysis[key] = res.data[key];
				});

				break;
			default:
				break;
		}
	}
});
