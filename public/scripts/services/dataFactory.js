app.factory("dataFactory", function($location, apiFactory, loggedInFactory) {
	var service = {
		playlists: {},
		savedAlbums: {},
		savedTracks: {},
		recentlyPlayed: [],
		allFeatureSamples: [],
		currentObject: {},
		searchResults: {
			"tracks": [],
			"albums": [],
			"artists": [],
			"playlists": []
		},
		userModelLoaded: false,
		libraryUrl: {},
		queryType: "track,album,artist,playlist",
		overview: function(type, playlist_id) {
			var source = undefined, dest = undefined, preOverviewPromise = undefined;

			switch (type) {
				case "playlists":
					source = service.playlists[playlist_id].tracks
					dest = service.playlists[playlist_id]
					preOverviewPromise = loadPlaylistTracks(playlist_id, service.playlists[playlist_id].owner.id, true)
					break;
				case "savedAlbums":
					source = service.savedAlbums.tracks
					dest = service.savedAlbums
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

			if (dest.overview != undefined) return;

			return getOverview(source, dest, true, preOverviewPromise, playlist_id);
		},
		libraryPromises: [
			getUserPlaylists(),
			getUserSavedTracks(),
			getUserSavedAlbums(),
			getRecentlyPlayed()
		],
		loadFullLibrary: function() {
			return new Promise(function(resolve) {
				Promise.all(service.libraryPromises)
				.then(function() {
					// Utilize getOverview because it requires that
					// all tracks are loaded to generate an overview
					var overviewPromises = [];

					// Load Playlist Tracks
					for (var playlist_id in service.playlists)
						overviewPromises.push(service.overview("playlists", playlist_id));
					
					// Load Saved Albums
					overviewPromises.push(service.overview("savedAlbums"));

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
		analysisPopUp: function(type, samples) {
			function removeFocus() {
				$('.mdc-button.mdc-button--raised').focus(function() {
					this.blur();
				});
			}
			$.confirm({
				title: 'Analysis',
				content: 'Should' + (type == library ? ' your ' : ' this ') + type + ' be used to train or test the model of your musical preferences?',
				buttons: {
					train: {
						text: 'Train',
						btnClass: 'btn-blue',
						action: function() {
							apiFactory.modelCall('train', samples);
							removeFocus();
							return true;
						}
					},
					test: {
						text: 'Test',
						btnClass: 'btn-blue',
						action: function() {
							apiFactory.modelCall('test', samples);
							removeFocus();
							return true;
						}
					}
				},
				backgroundDismiss: function() {
					removeFocus();
					return true;
				}
			});
		}
	};

	function getUserPlaylists() {
		return new Promise(function(resolve) {
			loggedInFactory
			.then(function() {
				apiFactory.call("Get a List of Current User's Playlists")
				.then(function(res) {
					for (var i = 0; i < res.data.items.length; i += 1) {
						service.playlists[res.data.items[i].id] = res.data.items[i];
						service.playlists[res.data.items[i].id].tracks = [];
					}
					resolve();
				});
			})
		});
	}

	function getUserSavedAlbums() {
		return new Promise(function(resolve) {
			loggedInFactory
			.then(function() {
				apiFactory.call("Get Current User's Saved Albums")
				.then(function(res) {
					var albums = {};
					for (var i in res.data.items) {
						albums[res.data.items[i].album.id] = res.data.items[i].album;
						albums[res.data.items[i].album.id].tracks = albums[res.data.items[i].album.id].tracks.items;
					}
					var allAlbumTracks = Object.values(albums).map(function(album) {
						return album.tracks;
					});
					service.savedAlbums = {
						albums: albums,
						tracks: [].concat.apply([], allAlbumTracks)
					};
					resolve();
				});
			});
		});
	}

	function getUserSavedTracks() {
		return new Promise(function(resolve) {
			loggedInFactory
			.then(function() {
				apiFactory.call("Get Current User's Saved Tracks")
				.then(function(res) {
					service.savedTracks = {
						tracks: res.data.items.map(function(t) { return t.track; })
					};
					resolve();
				});
			});
		});
	}

	function getRecentlyPlayed() {
		return new Promise(function(resolve) {
			loggedInFactory
			.then(function() {
				apiFactory.call("Get Current User's Recently Played Tracks")
				.then(function(res) {
					service.recentlyPlayed = {
						tracks: res.data.items.map(function(item) { return item.track; })
					};
					resolve();
				});
			});
		});
	}

	function getOverview(source, dest, append, preOverviewPromise, playlist_id) {
		if (!dest.overview) {
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
						.then(function(featureLst) {
							dest.overview = {
								samples: featureLst[0],
								avgFeatures: featureLst[1]
							};
							if (append) appendToAllFeatureSamples(featureLst[0]);
							resolve();
						});
					}));
				})
			});
		} else
			return new Promise(function(resolve) {resolve()});
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
					dest = service.playlists[playlist_id].tracks;
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

	function appendToAllFeatureSamples(arr) {
		if (arr == undefined) return;
		service.allFeatureSamples = service.allFeatureSamples.concat(arr);
	}

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

	service["getOverview"] = getOverview;
	service["loadPlaylistTracks"] = loadPlaylistTracks;

	return service;
});
