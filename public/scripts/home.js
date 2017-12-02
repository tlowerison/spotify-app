app.controller('HomeCtrl', function($scope, $http, $compile) {
	$(document).ready(function() {
		console.log('hello!');
		// AUTHORIZATION
			// Retrieves access_token and refresh_token from server
			setSpotifyAccess();

		// LIBRARY
			// Get all user playlists and specified non-user playlists
			// Load all playlists' tracklists in background
			var userPlaylistsPromise = new Promise(function(resolve) {
				getUserPlaylists(resolve);
			});

			var userSavedTracksPromise = new Promise(function(resolve) {
				getUserSavedTracks(resolve);
			});

			var userSavedAlbumsPromise = new Promise(function(resolve) {
				getUserSavedAlbums(resolve);
			});

			var userPromises = [userPlaylistsPromise, userSavedTracksPromise, userSavedAlbumsPromise];

			// All playlists have been loaded
			Promise.all(userPromises).then(function() {
				if ($scope.putUser) putUser($scope.user.id);

				libraryPromises['saved tracks'] = {
					"execute": function(resolve) {
						parseTracklistFeatures($scope.savedTracks.tracks)
						.then(function(featureLst) {
							resolve(featureLst);
						});
					}
				};
				var allAlbumTrackIds = [];
				for (var i in $scope.savedAlbums.albums) {
					allAlbumTrackIds = allAlbumTrackIds.concat($scope.savedAlbums.albums[i].tracks.items.map(function(t) {
						return t.id;
					}));
				}

				var albumtrackspromise = new Promise(function(resolve) {
					var k = 0;
					while (k < allAlbumTrackIds.length) {
						var queryIds = allAlbumTrackIds.slice(k, Math.min(k + 50, allAlbumTrackIds.length));
						$http(get_tracks(queryIds)).then(function(res) {
							allAlbumTracks = allAlbumTracks.concat(res.data.tracks);
							if (k > allAlbumTrackIds.length) {
								resolve();
							}
						})
						k += 50;
					}
				})
				libraryPromises['saved albums'] = {
					"execute": function(resolve) {
						albumtrackspromise.then(function() {
							parseTracklistFeatures(allAlbumTracks)
							.then(function(featureLst) {
								resolve(featureLst);
							});
						});
					}
				};

				for (var i in $scope.playlists) {
					function makePromise(key) {
						libraryPromises[$scope.playlists[key].id] = {
							"execute": function(resolve) {
								loadPlaylistTracklist(resolve, $scope.playlists[key].id);
							},
							"then": function(playlist_id) {
								getPlaylistGenres(key, playlist_id);
								getPlaylistOverview(key, playlist_id);
							}
						}
						playlist_id_to_index[$scope.playlists[key].id] = key;
					}
					makePromise(i);
				}
			});

		// SEARCH
			for (var key in $scope.searchResults) {
				$('#search-' + key).hide();
			}
			$('#search-item').hide();

		// CLICK FUNCTIONS
			$scope.onPlaylistClick = function(playlist_id) {
				if (!$scope.tracklists[playlist_id]) {
					new Promise(libraryPromises[playlist_id]["execute"]).then(libraryPromises[playlist_id]["then"]);
				}
			}

			$scope.onSavedTracksClick = function() {
				if (!$scope.savedTracks.overview)
					new Promise(getUserSavedTracksOverview);
			}

			$scope.onSavedAlbumsClick = function() {
				if (!$scope.savedAlbums.overview)
					new Promise(getUserSavedAlbumsOverview);
			}

			$scope.onUserModelClick = function() {
				if (!userModelLoaded && !userModelClicked) {
					userModelClicked = true;
					Promise.all(userPromises).then(function() {
						
						// Saved Playlists
						for (var i in $scope.playlists) {
							function loadThisPlaylist(j) {
								var playlist_id = $scope.playlists[j].id;

								if (typeof $scope.playlists[j].overview == "undefined") {

									tracklistsLoaded.push(new Promise(function(resolve) {
										var overviewPromise = null;
										new Promise(libraryPromises[playlist_id]["execute"])
										.then(function() {
											getPlaylistGenres(playlist_id_to_index[playlist_id], playlist_id);
											console.log($scope.playlists[j].name);
											resolve();
										});
									}));
								}
							}

							loadThisPlaylist(i);
						}

						// Recent Tracks
						tracklistsLoaded.push(new Promise(function(resolve) {
							getRecentTracks(resolve);
						}));
						Promise.all(tracklistsLoaded).then(function() {
							var overviewPromises = [];
							overviewPromises.push(new Promise(function(resolve) {
								getUserSavedTracksOverview(resolve);
							}));
							overviewPromises.push(new Promise(function(resolve) {
								getUserSavedAlbumsOverview(resolve);
							}));
							overviewPromises.push(new Promise(function(resolve) {
								getRecentTracksOverview(resolve);
							}));
							var playlistOverviewPromises = [];
							for (var i in $scope.playlists) {
								var playlistOverviewPromise = getPlaylistOverview(i, $scope.playlists[i].id);
								overviewPromises.push(playlistOverviewPromise);
								playlistOverviewPromises.push(playlistOverviewPromise);
							}

							Promise.all(playlistOverviewPromises).then(function() {
								for (var i in $scope.playlists) {
									function loadFeatures(j) {
										if ($scope.playlists[j].name != "Discover Weekly" && typeof $scope.playlists[j].overview == "object")
											appendToFullFeatures($scope.playlists[j].overview.features);
									}
									loadFeatures(i);
								}
							});
							Promise.all(overviewPromises).then(function() {
								modelStatus("loaded");
							})
						});
					});
				}
			}

			$scope.onUserModelTrainButtonClick = function() {
				$http.post('/tracks-svm', { method: "train", data: fullFeatures });
				modelStatus("trained");
			}

			$scope.onUserModelUnitTestButtonClick = function() {
				$http.post('/tracks-svm', { method: "unitTest" });
			}

			$scope.onPlotTrackClick = function(features) {
				features[2] /= dBNorm;
				features[8] /= bpmNorm;
				features[9] /= timeSignatureNorm;
				features[10] /= popularityNorm;
				$http.post('/tracks-svm', { method: "test", data: [features] })
			}

			$scope.onRecentTracksClick = function() {
				if ($scope.recentTracks.length == 0) {
					new Promise(function(resolve) {
						getRecentTracks(resolve);
					});
				}
			}

			$scope.onSearchClick = function() {
				var query = $('#search-input').val();
				query.replace(' ', '%20');
				var type = $('#search-select').find(":selected").val();
				$http(search(query, type, 20)).then(function(res) {
					displaySearchResults(type, res.data);
				})
			}

			$scope.onSearchItemClick = function(type, item) {
				$scope.searchItem = $scope.searchResults[type][item.$index];
				if (type == 'tracks') {
					getTrackGenres($scope.searchItem.external_ids.isrc).then(function(genres) {
						$scope.$apply(function() {
							$scope.searchItem.genres = genres;
						});
						displaySearchItem(type);
					});
					$http(get_track_features($scope.searchItem.id)).then(function(res) {
						var audio_features = res.data.audio_features[0];
						for(var key in audio_features) {
							$scope.searchItem[key] = audio_features[key];
						}
					});
				} else if (type == 'artists') {
					$http(get_related_artists($scope.searchItem.id)).then(function(res) {
						$scope.searchItem.relatedArtists = res.data.artists;
						displaySearchItem(type);
					});
				} else if (type == 'albums') {
					$http(get_album($scope.searchItem.id)).then(function(res) {
						$scope.searchItem = res.data;
						displaySearchItem(type);
					});
				}
			}

			$scope.onFeaturesModelButtonClick = function(playlist_id, method) {
				var body = { method: method };
				if (playlist_id == 'saved tracks') {
					body.data = $scope.savedTracks.overview.features;
				} else if (playlist_id == 'saved albums') {
					 body.data = $scope.savedAlbums.overview.features;
				} else {
					body.data = $scope.playlists[playlist_id_to_index[playlist_id]].overview.features;
				}
				$http.post('/tracks-svm', body);
			}
	});

	// PROMISE AND UTILITY FUNCTIONS
		// AUTHORIZATION
			function setSpotifyAccess() {
				set_spotify_tokens($('#at').html(), $('#rt').html());
				$('#at, #rt').remove();
			}

		// PLAYLISTS
			function getUserPlaylists(resolve) {
				$http(get_current_user_playlists()).then(function(res) {
					$scope.playlists = $scope.playlists.concat(res.data.items);
					for (var i = 0; i < $scope.playlists.length; i += 1) {
						function set_playlist_user(key) {
							playlist_user_db[$scope.playlists[key].id] = $scope.playlists[key].owner.id;
						}
						set_playlist_user(i);
					}
					resolve();
				});
			}

			function getNonUserPlaylists(resolve) {
				var nup_resolves = Array.apply(null, Array(non_user_playlists.length)).map(Boolean.prototype.valueOf, false);
				function nup_resolved() {
					for (var j = 0; j < nup_resolves.length; j += 1) {
						if (!nup_resolves[j]) { return false; }
					}
					return true;
				}
				function gnup(idx) {
					var user_id = non_user_playlists[idx].user_id;
					var playlist_id = non_user_playlists[idx].playlist_id;
					$http(get_playlist(user_id, playlist_id)).then(function(res) {
						res.data.name = non_user_playlists[idx].name;
						$scope.playlists.push(res.data);
						playlist_user_db[playlist_id] = user_id;
						nup_resolves[idx] = true;
						if (nup_resolved()) {
							resolve();
						}
					});
				}

				for (var i in non_user_playlists) {
					gnup(i);
				}
			}

			function getPlaylistGenres(i, playlist_id) {
				var genres = {'primaryHistogram': {}, 'secondaryHistogram': {}};
				try {
					genres = parsePlaylistGenres(playlist_id);
				} catch(err) { }
				$scope.$apply(function() {
					$scope.playlists[i].overview = {
						'genres': genres
					};
				});
			}

		// TRACKS
			function getUserSavedTracks(resolve) {
				$http(get_current_user_tracks()).then(function(res) {
					$scope.savedTracks = {
						tracks: res.data.items.map(function(t) {
							return t.track;
						})
					};
					resolve();
				});
			}

			function getUserSavedAlbums(resolve) {
				$http(get_current_user_albums()).then(function(res) {
					$scope.savedAlbums = {
						albums: res.data.items.map(function(a) {
							return a.album;
						})
					};
					resolve();
				});
			}

			function loadPlaylistTracklist(resolve, playlist_id) {
				$http(get_playlist_tracks(playlist_user_db[playlist_id], playlist_id)).then(function(res) {
					// initialize current user's playlists db for this playlist to empty array 
					$scope.tracklists[playlist_id] = [];
					tracklists_memo[playlist_id] = [];

					// get playlist tracks
					for (var i in res.data.items) {
						function setPlaylistTrack(key) {
							var track = res.data.items[key];

							// memoize track in this playlist by id
							tracklists_memo[playlist_id].push(track.track.id);

							getTrackGenres(track.track.external_ids.isrc).then(function(track_genres) {
								var t = track.track;
								$scope.tracklists[playlist_id].push({
									album: {album_id: t.album.id, name: t.album.name},
									artists: t.artists.map(function(a) {
										return {artist_id: a.id, name: a.name};
									}),
									duration: t.duration,
									explicit: t.explicit,
									genres: track_genres,
									isrc: t.external_ids.isrc,
									name: t.name,
									popularity: t.popularity,
									track_id: t.id
								});
								// if last track, resolve promise
								if (key == res.data.items.length - 1) { 
									resolve(playlist_id); }
							});
						}
						setPlaylistTrack(i);
					}
				});
			}

			function getRecentTracks(resolve) {
				$http(get_current_users_recent_tracks()).then(function(res) {
					$scope.recentTracks = res.data.items.map(function(item) {
						item.track.genres = getTrackGenres(item.track.external_ids.isrc);
						return item.track;
					});
					resolve();
				});
			}

			function getTrackGenres(isrc) {
				return new Promise(function(resolve) {
					$http(get_musixmatch_track(isrc)).then(function(res) {
						var musixmatch_track = res.data.message.body.track;
						var track_genres = {};
						try {
							track_genres = flatten_musixmatch_genres(musixmatch_track);
						} catch(err) {
							resolve({ "primaryGenres": [], "secondaryGenres": [] });
							return;
						}
						if (nonEmptyGenres(track_genres)) {
							resolve(track_genres);
							return;
						} else {
							$http(get_musixmatch_obj_by_id('album', musixmatch_track.album_id)).then(function(res) {
								var album_genres = flatten_musixmatch_genres(res.data.message.body.album);
								if (nonEmptyGenres(album_genres)) {
									resolve(album_genres);
									return;
								} else {
									resolve({ "primaryGenres": [], "secondaryGenres": [] });
									return;
								}
							});
						}
					});
				});
			}

			function appendToFullFeatures(arr) {
				fullFeatures = fullFeatures.concat(arr);
			}

			function nonEmptyGenres(arr) {
				return !(arr['primaryGenres'].length == 0 && arr['secondaryGenres'].length == 0);
			}

		// ARTISTS
			function updateArtistCount(tracklist) {
				for (var i in tracklist) {
					var track = tracklist[i];
					for (var j in track.artists) {
						var artist = track.artists[j].name;
						if (artist in artistCounts)
							artistCounts[artist] += 1;
						else
							artistCounts[artist] = 1;
					}
				}
			}

		// OVERVIEW
			function getUserSavedTracksOverview(resolve) {
				new Promise(libraryPromises["saved tracks"]["execute"])
				.then(function(featureLst) {
					$scope.$apply(function() {
						$scope.savedTracks.overview = {
							features: featureLst[0],
							avgFeatures: featureLst[1]
						};
					});
					appendToFullFeatures(featureLst[0]);
					resolve();
				});
			}

			function getUserSavedAlbumsOverview(resolve) {
				new Promise(libraryPromises["saved albums"]["execute"])
				.then(function(featureLst) {
					$scope.$apply(function() {
						$scope.savedAlbums.overview = {
							features: featureLst[0],
							avgFeatures: featureLst[1]
						};
					});
					appendToFullFeatures(featureLst[0]);
					resolve();
				});
			}

			function getPlaylistOverview(i, playlist_id) {
				return new Promise(function(resolve) {
					parseTracklistFeatures($scope.tracklists[playlist_id]).then(function(featureLst) {
						$scope.$apply(function() {
							$scope.playlists[i].overview['features'] = featureLst[0];
							$scope.playlists[i].overview['avgFeatures'] = featureLst[1];
							resolve();
						});
					});
				});
			}

			function getRecentTracksOverview(resolve) {
				parseTracklistFeatures($scope.recentTracks)
				.then(function(featureLst) {
					appendToFullFeatures(featureLst[0]);
					resolve();
				});
			}

		// SEARCH
			function displaySearchResults(type, data) {
				if (type != previousSearchType) {
					var idsIn = '';
					var idsOut = '';
					for (var key in $scope.searchResults) {
						if (!searchDisplays[key] && (key == type + 's' || type == 'track,album,artist,playlist')) {
							idsIn += ('#search-' + key + ', ');
							searchDisplays[key] = true;
						}
							searchDisplays[key] = false;
						idsOut += ('#search-' + key + ', ');
					}
					if (idsIn != '') {
						idsIn = idsIn.slice(0, idsIn.length - 2);
					}
					if (idsOut != '') {
						idsOut = idsOut.slice(0, idsOut.length - 2);
						$(idsOut).fadeOut(400);
						setTimeout(function() {
							$(idsIn).fadeIn(400);
						}, 600);
					} else {
						$(idsIn).fadeIn();
					}
					previousSearchType = type;
				}

				for (var key in data) {
					$scope.searchResults[key] = data[key].items;
				}
			}

			function displaySearchItem(type) {
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

		// PARSERS
			function parsePlaylistGenres(playlist_id) {
				var tracklist = $scope.tracklists[playlist_id];
				var primaryGenreHistogram = {};
				var secondaryGenreHistogram = {};
				function addToHistogram(hist, gens, keyJ) {
					if (gens[keyJ]['music_genre_name'] in hist) {
						hist[gens[keyJ]['music_genre_name']]['count'] += 1;

					} else {
						hist[gens[keyJ]['music_genre_name']] = {
							genre_id: gens[keyJ].music_genre_id,
							label: gens[keyJ].music_genre_name,
							count: 1
						};
					}
				}
				for (var i in tracklist) {
					function trackGenres(keyI) {
						var prims = tracklist[keyI].genres['primaryGenres'];
						var scnds = tracklist[keyI].genres['secondaryGenres'];
						for (var j in prims) {
							addToHistogram(primaryGenreHistogram, prims, j);
						}
						for (var j in scnds) {
							addToHistogram(secondaryGenreHistogram, scnds, j);
						}
					}
					trackGenres(i);
				}

				return {
					'primaryHistogram': primaryGenreHistogram,
					'secondaryHistogram': secondaryGenreHistogram
				};
			}

			function parseTracklistFeatures(tracklist) {
				return new Promise(function(RESOLVE) {
					var trackIds = tracklist.map(function(t) {
						if (typeof t.track_id == "undefined")
							return t.id;
						else
							return t.track_id;
					});
					var features = [];
					var avgFeatures = {
						"danceability": 0,
						"energy": 0,
						"key": 0,
						"loudness": 0,
						"mode": 0,
						"speechiness": 0,
						"acousticness": 0,
						"instrumentalness": 0,
						"liveness": 0,
						"valence": 0,
						"tempo": 0,
						"duration_ms": 0,
						"time_signature": 0,
						"popularity": 0
					}

					var promises = [];
					var i = 0;
					while (i < trackIds.length) {
						var queryIds = trackIds.slice(i, Math.min(i + 100, trackIds.length));
						promises.push(new Promise(function(resolve) {
							$http(get_track_features(queryIds)).then(function(res) {
								features = features.concat(res.data.audio_features);
								resolve();
							});
						}));
						i += 100;
					}
					Promise.all(promises).then(function() {
						for (var i = 0; i < features.length; i += 1) {
							features[i].popularity = tracklist[i].popularity;
						}

						// SVM
							clean(features, undefined);
							for (var i in features) {
								var track = features[i];
								for (var j in removedFeatures) {
									var key = removedFeatures[j];
									delete track[key];
								}
							}
							var trackFeatures = features.map(function(obj) {
								return Object.keys(obj).map(function(key) {
									return obj[key];
								});
							});

						for (var j = 0; j < features.length; j += 1) {
							for (var key in avgFeatures) {
								avgFeatures[key] += features[j][key];
							}
						}
						if (features.length > 0) {
							for (var key in avgFeatures) {
								avgFeatures[key] /= features.length;
							}
						}

						function scaleSpotifyFeaturesData(data) {
							for (var i = 0; i < data.length; i += 1) {
								scaleTrack(data[i]);
							}
						}
						scaleSpotifyFeaturesData(trackFeatures);
						RESOLVE([trackFeatures, avgFeatures]);
					});
				});
			}

		// MODEL
			function modelStatus(status) {
				if (status == "loaded") {
					userModelLoaded = true;
					$('.spinner').fadeOut(function() {
						$('#user-model').append($compile(modelDialog)($scope));
						$('#model-train-button').hide();
						$('#model-train-button').fadeIn();
						$('#spinner').remove();
					});
				} else if (status == "trained") {
					userModelClicked = false;
					if (!userModelTrained) {
						$('#user-model').append($compile(unitTestDialog)($scope));
						$('#model-unit-test-button-button').hide();
						$('#model-unit-test-button-button').fadeIn();
						userModelTrained = true;
					}
				}
			}

	// SCOPE VARIABLES
		$scope.playlists = [];
		$scope.recentTracks = [];
		$scope.savedAlbums = {};
		$scope.savedTracks = {};
		$scope.searchResults = {
			"tracks": [],
			"albums": [],
			"artists": [],
			"playlists": []
		};
		$scope.tracklists = {};

});

// NON-SCOPE VARIABLES
	var allAlbumTracks = [];
	var artistCounts = {};
	var clean = function(arr, deleteValue) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == deleteValue) {
				arr.splice(i, 1);
				i--;
			}
		}
		return arr;
	};
	var fullFeatures = [];
	var libraryPromises = {};
	var modelDialog = '<div id="model-train-button" class="section"><input type="button" value="Train" ng-click="onUserModelTrainButtonClick()"/></div>';
	var playlist_id_to_index = {};
	var playlist_user_db = {};
	var previousSearchType = null;
	var removedFeatures = [
		'analysis_url',
		'duration_ms',
		'id',
		'key',
		'mode',
		'track_href',
		'type',
		'uri'
	];
	var searchDisplays = {
		"tracks": false,
		"albums": false,
		"artists": false,
		"playlists": false
	};
	var tracklistsLoaded = [];
	var tracklists_memo = {};
	var unitTestDialog = '<div id="model-unit-test-button" class="section"><input type="button" value="Unit Test" ng-click="onUserModelUnitTestButtonClick()"/></div>';
	var userModelClicked = false;
	var userModelLoaded = false;
	var userModelTrained = false;
	var dBNorm = -60,
	bpmNorm = 180,
	timeSignatureNorm = 4,
	popularityNorm = 100;

	var scaleTrack = function(x) {
		x[2] /= dBNorm;
		x[8] /= bpmNorm;
		x[9] /= timeSignatureNorm;
		x[10] /= popularityNorm;
	};
