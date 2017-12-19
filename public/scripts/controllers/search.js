app.controller("Search", function($http, $scope, apiFactory, dataFactory) {
	$scope.searchResults = dataFactory.searchResults;

	$scope.init = function() {
		displaySearchResults();
	}

	$("#search-input").bind("keypress", {}, function keypressInBox(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if (code == 13) { //Enter keycode
			e.preventDefault();
			$scope.onSearchButtonClick();
		}
	});

	$scope.onSearchButtonClick = function() {
		var query = $("#search-input").val();
		query = query.replace(/[ ]/g, "%20");
		apiFactory.call("Search", { q: query, type: dataFactory.queryType, limit: 20 })
		.then(function(res) {
			for (var key in res.data) {
				dataFactory.searchResults[key] = res.data[key].items;
			}
			displaySearchResults();
		})
	}

	$scope.onSearchItemClick = function(type, item) {
		$scope.searchItem = dataFactory.searchResults[type][item.$index];
		if (type == 'tracks') {
			apiFactory.call("Get Audio Features for a Track", { id: $scope.searchItem.id })
			.then(function(res) {
				var audio_features = res.data;
				for(var key in audio_features) {
					$scope.searchItem[key] = audio_features[key];
				}
				displaySearchItem(type);
			});
		} else if (type == 'artists') {
			apiFactory.call("Get an Artist's Related Artists", { id: $scope.searchItem.id })
			.then(function(res) {
				$scope.searchItem.relatedArtists = res.data.artists;
				displaySearchItem(type);
			});
		} else if (type == 'albums') {
			apiFactory.call("Get an Album", { id: $scope.searchItem.id })
			.then(function(res) {
				$scope.searchItem = res.data;
				displaySearchItem(type);
			});
		}
	}

	$scope.onPlotTrackClick = function(features) {
		features[2] /= dBNorm;
		features[8] /= bpmNorm;
		features[9] /= timeSignatureNorm;
		features[10] /= popularityNorm;
		$http.post('/tracks-svm', { method: "test", data: { samples: [features] }})
		.then(function(res) {
			$('body').append(res.plt);
		});
	}

	for (var key in dataFactory.searchResults) {
		$('#search-' + key).hide();
	}
	$('#search-item').hide();

	function displaySearchResults() {
		$scope.searchResults = dataFactory.searchResults;
		if ($scope.searchResults.tracks.length
			&& $scope.searchResults.albums.length
			&& $scope.searchResults.artists.length
			&& $scope.searchResults.playlists.length)
				for (var key in dataFactory.searchResults)
					$('#search-' + key).fadeIn();
	}

	function displaySearchItem(type) {
		console.log('sup')
		$('#search-item-track, #search-item-album, #search-item-artist, #search-item-playlist').hide();
		$('#search-results').fadeOut(600);
		setTimeout(function() {
			$('#search-item-' + type.slice(0, type.length - 1)).show();
			$('#search-item').fadeIn(600);
			$('#search-item-return').fadeIn(600);
		}, 800);
	}

	// Return Click
	$('#rel, #arrow').click(function() {
		$('#arrow').animate({'margin-left': '-800px', 'padding-right': '800px'}, 1200, 'easeInOutBack');
		setTimeout(function() {
			$('#search-item').fadeOut(function() {
				$('#search-results').fadeIn();
				$('#arrow').animate({'margin-left': '-36px', 'padding-right': '0px'});
			});
		}, 900);
	});

	var previousSearchType = null;
	var searchDisplays = {
		"tracks": false,
		"albums": false,
		"artists": false,
		"playlists": false
	};
});
