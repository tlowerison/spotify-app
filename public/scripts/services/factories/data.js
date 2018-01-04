app.factory("dataFactory", function($location, apiFactory, logInFactory) {
	var service = {
		savedPlaylists: {},
		savedAlbums: {},
		savedTracks: {},
		recentlyPlayed: [],
		allFeatureSamples: [],
		allFeatureLabels: [],
		currentObject: {},
		searchResults: {
			"tracks": [],
			"albums": [],
			"artists": [],
			"playlists": []
		},
		userModelLoaded: false,
		queryType: "track,album,artist,playlist",
		overview: function(type, id) {
			var source = undefined, dest = undefined, append = true, preOverviewPromise = undefined;
			switch (type) {
				case "playlist":
					source = service.savedPlaylists[id].tracks
					dest = service.savedPlaylists[id]
					preOverviewPromise = loadPlaylistTracks(id, service.savedPlaylists[id].owner.id, true)
					// do not include spotify generated playlists in library analysis
					append = service.savedPlaylists[id].owner.id != "spotify"
					break;
				case "album":
					source = service.savedAlbums.albums[id].tracks
					dest = service.savedAlbums.albums[id]
					break;
				case "savedPlaylists":
					// Assume all saved albums' overviews have already been loaded.
					return new Promise(function(resolve) {
						service.savedPlaylists.overview = [];
						for (var playlist in service.savedPlaylists)
							service.savedPlaylists.overview = service.savedPlaylists.overview.concat(playlist.overview);
					})
					break;
				case "savedAlbums":
					// Assume all saved albums' overviews have already been loaded.
					return new Promise(function(resolve) {
						service.savedAlbums.overview = [];
						for (var album in service.savedAlbums)
							service.savedAlbums.overview = service.savedAlbums.overview.concat(album.overview);
						resolve();
					});
					break;
				case "savedTracks":
					source = service.savedTracks.tracks
					dest = service.savedTracks
					break;
				case "recentlyPlayed":
					source = service.recentlyPlayed.tracks
					dest = service.recentlyPlayed
					break;
				default:
					return;
			}

			return getOverview(source, dest, append, preOverviewPromise, id);
		},
		loadFullLibrary: function() {
			service.libraryPromises = [
				getUserPlaylists(),
				getUserSavedAlbums(),
				getUserSavedTracks(),
				getRecentlyPlayed()
			];
			return new Promise(function(resolve) {
				Promise.all(service.libraryPromises)
				.then(function() {
					// Utilize getOverview because it requires that
					// all tracks are loaded to generate an overview
					var overviewPromises = [];

					// Load Playlist Tracks
					for (var playlist_id in service.savedPlaylists)
						overviewPromises.push(service.overview("playlist", playlist_id));
					
					// Load Saved Albums
					for (var album_id in service.savedAlbums.albums)
						overviewPromises.push(service.overview("album", album_id));

					// Load Saved Tracks
					overviewPromises.push(service.overview("savedTracks"));

					// Load Recently Played
					overviewPromises.push(service.overview("recentlyPlayed"));

					Promise.all(overviewPromises)
					.then(function() {
						// All samples are saved in service.allFeatureSamples
						// during the loading of individual library overviews
						resolve();
					})
				})
			});
		},
		analysisPopUp: function(type, overview) {
			function removeFocus() {
				$('.mdc-button.mdc-button--raised').focus(function() {
					this.blur();
				});
			}
			var samples = null, labels = null;
			if (type == "library") {
				samples = service.allFeatureSamples
				labels = service.allFeatureLabels
			} else {
				samples = overview.samples
				labels = overview.labels
			}
			
			$.confirm({
				title: 'Analysis',
				content: 'Should' + (type == library ? ' your ' : ' this ') + type + ' be used to train or test the model of your musical preferences?',
				buttons: {
					train: {
						text: 'Train',
						btnClass: 'btn-blue',
						action: function() {
							apiFactory.modelCall('train', samples, labels)
							removeFocus()
							return true
						}
					},
					test: {
						text: 'Test',
						btnClass: 'btn-blue',
						action: function() {
							apiFactory.modelCall('test', samples, labels)
							removeFocus()
							return true
						}
					}
				},
				backgroundDismiss: function() {
					removeFocus()
					return true
				}
			});
		},
		objectCache: {
			"playlist": {},
			"album": {},
			"artist": {},
			"track": {}
		}
	};

	function getUserPlaylists() {
		return new Promise(function(resolve) {
			logInFactory.isLoggedIn()
			.then(function() {
				apiFactory.call("Get a List of Current User's Playlists")
				.then(function(res) {
					for (var i = 0; i < res.data.items.length; i += 1) {
						service.savedPlaylists[res.data.items[i].id] = res.data.items[i];
						service.savedPlaylists[res.data.items[i].id].tracks = [];
						service.objectCache.playlist[res.data.items[i].id] = service.savedPlaylists[res.data.items[i].id];
					}
					resolve();
				});
			})
		});
	}

	function getUserSavedAlbums() {
		return new Promise(function(resolve) {
			logInFactory.isLoggedIn()
			.then(function() {
				apiFactory.call("Get Current User's Saved Albums")
				.then(function(res) {
					var trackPromises = [];
					var albums = {};
					for (var j in res.data.items) {
						function foo(i) {
							var album = res.data.items[i].album;
							album.tracks = album.tracks.items;
							albums[album.id] = album;
							service.objectCache.album[album.id] = albums[album.id];
						}
						foo(j);
					}
					var allAlbumTracks = Object.values(albums).map(function(album) {
						return album.tracks;
					});
					service.savedAlbums = {
						albums: albums,
						tracks: [].concat.apply([], allAlbumTracks)
					};
					Promise.all(trackPromises).then(function() { resolve(); });
				});
			});
		});
	}

	function getUserSavedTracks() {
		return new Promise(function(resolve) {
			logInFactory.isLoggedIn()
			.then(function() {
				apiFactory.call("Get Current User's Saved Tracks")
				.then(function(res) {
					service.savedTracks = {
						tracks: res.data.items.map(function(t) { return t.track; })
					};
					for (var i in service.savedTracks.tracks)
						service.objectCache.track[service.savedTracks.tracks[i].id] = service.savedTracks.tracks[i];
					resolve();
				});
			});
		});
	}

	function getRecentlyPlayed() {
		return new Promise(function(resolve) {
			logInFactory.isLoggedIn()
			.then(function() {
				apiFactory.call("Get Current User's Recently Played Tracks")
				.then(function(res) {
					service.recentlyPlayed = {
						tracks: res.data.items.map(function(item) { return item.track; })
					};
					for (var i in service.savedTracks.tracks)
						service.objectCache.track[service.recentlyPlayed.tracks[i].id] = service.recentlyPlayed.tracks[i];
					resolve();
				});
			});
		});
	}

	function getOverview(source, dest, append, preOverviewPromise, playlist_id) {
		return new Promise(function(RESOLVE) {
			if (!preOverviewPromise)
				preOverviewPromise = new Promise(function(r) { r(); });

			preOverviewPromise.then(function(res) {
				if (res != undefined && res != null && playlist_id == undefined && append)
					source = res;
				else if (res != undefined && res != null && playlist_id != undefined && !append) {
					source = res;
					dest.tracks = res;
				}

				RESOLVE(new Promise(function(resolve) {
					apiFactory.parseTracklistFeatures(source)
					.then(function(res) {
						dest.overview = {
							samples: res.samples,
							avgSample: res.avgSample,
							labels: res.labels
						};
						if (append)	appendToAll(res.samples, res.labels);
						resolve();
					});
				}));
			})
		});
	}

	function loadPlaylistTracks(playlist_id, user_id, saved) {
		return new Promise(function(resolve) {
			apiFactory.call("Get a Playlist's Tracks", {
				user_id: user_id,
				playlist_id: playlist_id
			})
			.then(function(res) {
				var dest = [];
				if (saved) {
					dest = service.savedPlaylists[playlist_id].tracks;
				}
				for (var i in res.data.items) {
					var track = res.data.items[i].track;
					dest.push({
						album: {album_id: track.album.id, name: track.album.name},
						artists: track.artists.map(function(artist) {
							return {artist_id: artist.id, name: artist.name};
						}),
						duration: track.duration,
						explicit: track.explicit,
						isrc: track.external_ids.isrc,
						name: track.name,
						popularity: track.popularity,
						track_id: track.id,
						artistString: track.artists.map(function(a) {return a.name;}).join(", ")
					});
				}
				resolve(dest);
			});
		})
	}

	function getTracksInBlocks(ids) {
		ids = [].concat.apply([], ids);
		var queryIdBlocks = [],
			blockPromises = [],
			kMax = Math.floor(ids.length / 50) * 50;

		for (var k = 0; k < kMax; k += 50)
			queryIdBlocks.push(ids.slice(k, k + 50));

		if (ids.length != kMax)
			queryIdBlocks.push(ids.slice(kMax, ids.length));
		
		for (var k = 0; k < queryIdBlocks.length; k += 1)
			blockPromises.push(apiFactory.call("Get Several Tracks", { ids: queryIdBlocks[k] }));

		return blockPromises;
	}

	function appendToAll(samples, labels) {
		if (samples == undefined || labels == undefined) return;
		service.allFeatureSamples = service.allFeatureSamples.concat(samples);
		service.allFeatureLabels = service.allFeatureLabels.concat(labels);
	}

	service["getOverview"] = getOverview;
	service["loadPlaylistTracks"] = loadPlaylistTracks;

	return service;
});
