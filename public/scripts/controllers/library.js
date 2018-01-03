app.controller("Library", function($scope, $http, $location, apiFactory, dataFactory) {
	$scope.init = function(type) {
		$('.spinner').hide();
		if (dataFactory.libraryPromises == undefined) {
			$('#library-analysis').hide();
			$('.spinner').fadeIn();

			var overviewPromise = dataFactory.loadFullLibrary();
			overviewPromise.then(function() {
				$scope.$apply(function() {
					$scope.analysisPopUp = dataFactory.analysisPopUp;
					if (type) dataFactory.overview(type);
				});
				spinnerClose();
			});
			dataFactory.libraryPromises[0].then(function() {
				$scope.$apply(function() {
					$scope.playlists = dataFactory.savedPlaylists;
				});
			})
			dataFactory.libraryPromises[1].then(function() {
				$scope.$apply(function() {
					$scope.savedAlbums = dataFactory.savedAlbums;
				});
			})
			dataFactory.libraryPromises[2].then(function() {
				$scope.$apply(function() {
					$scope.savedTracks = dataFactory.savedTracks;
				});
			})
			dataFactory.libraryPromises[3].then(function() {
				$scope.$apply(function() {
					$scope.recentlyPlayed = dataFactory.recentlyPlayed;
				});
			})
		} else {
			$scope.playlists = dataFactory.savedPlaylists;
			$scope.savedAlbums = dataFactory.savedAlbums;
			$scope.savedTracks = dataFactory.savedTracks;
			$scope.recentlyPlayed = dataFactory.recentlyPlayed;
			$scope.libraryUrl = dataFactory.libraryUrl;
			$scope.analysisPopUp = dataFactory.analysisPopUp;
			spinnerClose();
		}
	}

	function spinnerClose() {
		Promise.all(dataFactory.libraryPromises)
		.then(function() {
			modelStatus("loaded");
		})
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
});
