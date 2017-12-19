app.controller("Library", function($scope, $http, $location, apiFactory, dataFactory) {
	$(document).ready(function() {
		Promise.all(dataFactory.libraryPromises).then(function() {
			$scope.$apply(function() {
				$scope.playlists = dataFactory.playlists;
				$scope.savedAlbums = dataFactory.savedAlbums;
				$scope.savedTracks = dataFactory.savedTracks;
				$scope.recentlyPlayed = dataFactory.recentlyPlayed;
				$scope.libraryUrl = dataFactory.libraryUrl;
				$scope.analysisPopUp = dataFactory.analysisPopUp;
			})
		});
	});

	$scope.onObjectClick = function(type, id) {
		if (type == "savedPlaylists") {
			dataFactory.currentObject = {
				type: "playlist",
				object: dataFactory[type][id],
				id: id,
				promise: dataFactory.overview(type, id)
			};
		} else if (type == "savedAlbums") {
			var dest = dataFactory[type].albums[id];
			dataFactory.currentObject = {
				type: "album",
				object: dest,
				id: id,
				promise: dataFactory.getOverview(dest.tracks, dest, false)
			};
		} else if (type == "savedTracks") {
			dataFactory.currentObject = {
				type: "track",
				object: dataFactory[type].tracks[id],
				id: id,
				promise: new Promise(function(r) {r();})
			}
		}
	}

	$scope.init = function(type) {
		$scope.onUserModelClick();
		Promise.all(dataFactory.libraryPromises).then(function() {
			if (type) dataFactory.overview(type);
		})
	}

	$scope.onUserModelClick = function() {
		if (!dataFactory.userModelLoaded) {
			$('.spinner').fadeIn();
			dataFactory.loadFullLibrary()
			.then(function() {
				$scope.allFeatureSamples = dataFactory.allFeatureSamples;
				modelStatus("loaded");
			})
		} else {
			$('#library-analysis').show();
		}
	}

	$scope.onUserModelTrainButtonClick = function() {
		$http.post('/tracks-svm', { method: "train", samples: dataFactory.allFeatureSamples})
		.then(function(res) {
			$('body').append(res.plt);
		});
		modelStatus("trained");
	}

	$scope.onUserModelUnitTestButtonClick = function() {
		$http.post('/tracks-svm', { method: "unitTest" })
		.then(function(res) {
			$('body').append(res.plt);
		});
	}
	
	function modelStatus(status) {
		if (status == "loaded") {
			dataFactory.userModelLoaded = true;
			$('.spinner').fadeOut(function() {
				$('#library-analysis').fadeIn();
				$('#spinner').remove();
			});
		}
	}
	$('.spinner').hide();
	$('#library-analysis').hide();
});
