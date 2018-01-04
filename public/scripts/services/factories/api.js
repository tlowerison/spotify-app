app.factory("apiFactory", function($http, logInFactory) {
	function queryStringGenerator(endpoint, data) {
		var str = "";
		if (data == undefined) return str;
		var parameters = spotifyEndpointQueryParameters[endpoint];
		for (var i in parameters) {
			var key = parameters[i];
			if (key in data) {
				if (str == "" && endpoint != "Search") str += "/?";
				else str += "&";
				str += (key + "=" + data[key]);
			}
		}
		return str;
	}

	function dataStringGenerator(endpoint, data) {
		var obj = {};
		if (data == undefined) return "";
		var parameters = spotifyEndpointBodyParameters[endpoint];
		for (var key in parameters) {
			if (key in data) {
				obj[key] = data[key];
			}
		}
		return JSON.stringify(obj);
	}

	var endpointPromiseGenerators = {
		// Albums
			"Get an Album": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/albums/" + data.id
						+ queryStringGenerator("Get an Album", data),
					headers: spotifyHeaders
				})
			},
			"Get an Album's Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/albums/" + data.id + "/tracks"
						+ queryStringGenerator("Get an Album's Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Get Several Albums": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/albums/?ids=" + data.ids.join()
						+ queryStringGenerator("Get Several Albums", data),
					headers: spotifyHeaders
				})
			},
		// Artists
			"Get an Artist": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/artists/" + data.id
						+ queryStringGenerator("Get an Artist", data),
					headers: spotifyHeaders
				})
			},
			"Get an Artist's Albums": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/artists/" + data.id + "/albums"
						+ queryStringGenerator("Get an Artist's Albums", data),
					headers: spotifyHeaders
				})
			},
			"Get an Artist's Top Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/artists/" + data.id + "/top-tracks"
						+ queryStringGenerator("Get an Artist's Top Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Get an Artist's Related Artists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/artists/" + data.id + "/related-artists"
						+ queryStringGenerator("Get an Artist's Related Artists", data),
					headers: spotifyHeaders
				})
			},
			"Get Several Artists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/artists/?ids=" + data.ids.join()
						+ queryStringGenerator("Get Several Artists", data),
					headers: spotifyHeaders
				})
			},
		// Browse
			"Get a Category": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/browse/categories/" + data.category_id
						+ queryStringGenerator("Get an Category", data),
					headers: spotifyHeaders
				})
			},
			"Get a Category's Playlists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/browse/categories/" + data.category_id + "/playlists"
						+ queryStringGenerator("Get an Category's Playlists", data),
					headers: spotifyHeaders
				})
			},
			"Get a List of Categories": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/browse/categories/"
						+ queryStringGenerator("Get a List of Categories", data),
					headers: spotifyHeaders
				})
			},
			"Get a List of Featured Playlists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/browse/featured-playlists"
						+ queryStringGenerator("Get a List of Featured Playlists", data),
					headers: spotifyHeaders
				})
			},
			"Get a List of New Releases": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/brose/new-releases"
						+ queryStringGenerator("Get a List of New Releases", data),
					headers: spotifyHeaders
				})
			},
			"Get Recommendations": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/recommendations"
						+ queryStringGenerator("Get Recommendations", data),
					headers: spotifyHeaders
				})
			},
		// Follow
			"Check if Current User Follows Artists or Users": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/following/contains"
						+ queryStringGenerator("Check if Current User Follows Artists or Users", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Check if Current User Follows Artists or Users", data)
				});
			},
			"Check if Users Follow a Playlist": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.owner_id + "/playlists/" + data.playlist_id + "/followers/contains"
						+ queryStringGenerator("Check if Users Follow a Playlist", data),
					headers: spotifyHeaders
				})
			},
			"Follow Artists or Users": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/following"
						+ queryStringGenerator("Follow Artists or Users", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Follow Artists or Users", data)
				});
			},
			"Follow a Playlist": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/users/" + data.owner_id + "/playlists/" + data.playlist_id + "/followers"
						+ queryStringGenerator("Follow a Playlist", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Follow a Playlist", data)
				});
			},
			"Get User's Followed Artists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/following?type=Artist"
						+ queryStringGenerator("Get User's Followed Artists", data),
					headers: spotifyHeaders
				})
			},
			"Unfollow Artists or Users": function(data) {
				return $http({
					method: "DELETE",
					url: spotifyUrl + "/me/following"
						+ queryStringGenerator("Unfollow Artists or Users", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Unfollow Artists or Users", data)
				});
			},
			"Unfollow a Playlist": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.owner_id + "/playlists/" + data.playlist_id + "/followers"
						+ queryStringGenerator("Unfollow a Playlist", data),
					headers: spotifyHeaders
				})
			},
		// Personalization
			"Get a User's Top Artists and Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/top/" + data.type
						+ queryStringGenerator("Get a User's Top Artists and Tracks", data),
					headers: spotifyHeaders
				})
			},
		// Player
			"Get a User's Available Devices": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/player/devices"
						+ queryStringGenerator("Get a User's Available Devices", data),
					headers: spotifyHeaders
				})
			},
			"Get Information About The User's Current Playback": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/player"
						+ queryStringGenerator("Get Information About The User's Current Playback", data),
					headers: spotifyHeaders
				})
			},
			"Get Current User's Recently Played Tracks": function(data) {
				if (data == undefined)
					data = { limit: 50 };
				else if (data.limit == undefined)
					data.limit = 50;
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/player/recently-played"
						+ queryStringGenerator("Get Current User's Recently Played Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Get the User's Currently Playing Track": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/player/currently-playing"
						+ queryStringGenerator("Get the User's Currently Playing Track", data),
					headers: spotifyHeaders
				})
			},
			"Pause a User's Playback": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player/pause"
						+ queryStringGenerator("Pause a User's Playback", data),
					headers: spotifyHeaders
				})
			},
			"Seek To Position In Currently Playing Track": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player/seek"
						+ queryStringGenerator("Seek To Position In Currently Playing Track", data),
					headers: spotifyHeaders
				})
			},
			"Set Repeat Mode On User’s Playback": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player/repeat"
						+ queryStringGenerator("Set Repeat Mode On User’s Playback", data),
					headers: spotifyHeaders
				})
			},
			"Set Volume For User's Playback": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player/volume"
						+ queryStringGenerator("Set Volume For User's Playback", data),
					headers: spotifyHeaders
				})
			},
			"Skip User’s Playback To Next Track": function(data) {
				return $http({
					method: "POST",
					url: spotifyUrl + "/me/player/next"
						+ queryStringGenerator("Skip User’s Playback To Next Track", data),
					headers: spotifyHeaders
				})
			},
			"Skip User’s Playback To Previous Track": function(data) {
				return $http({
					method: "POST",
					url: spotifyUrl + "/me/player/previous"
						+ queryStringGenerator("Skip User’s Playback To Previous Track", data),
					headers: spotifyHeaders
				})
			},
			"Start/Resume a User's Playback": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player/play"
						+ queryStringGenerator("Start/Resume a User's Playback", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Start/Resume a User's Playback", data)
				});
			},
			"Toggle Shuffle For User’s Playback": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player/shuffle"
						+ queryStringGenerator("Toggle Shuffle For User’s Playback", data),
					headers: spotifyHeaders
				})
			},
			"Transfer a User's Playback": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/player"
						+ queryStringGenerator("Transfer a User's Playback", data),
					headers: spotifyHeaders
				})
			},
		// Playlists
			"Add Tracks to a Playlist": function(data) {
				return $http({
					method: "POST",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/tracks"
						+ queryStringGenerator("Add Tracks to a Playlist", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Add Tracks to a Playlist", data)
				});
			},
			"Change a Playlist's Details": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id
						+ queryStringGenerator("Change a Playlist's Details", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Change a Playlist's Details", data)
				});
			},
			"Create a Playlist": function(data) {
				return $http({
					method: "POST",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists"
						+ queryStringGenerator("Create a Playlist", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Create a Playlist", data)
				});
			},
			"Get a List of Current User's Playlists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/playlists"
						+ queryStringGenerator("Get a List of Current User's Playlists", data),
					headers: spotifyHeaders
				})
			},
			"Get a List of a User's Playlists": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists"
						+ queryStringGenerator("Get a List of a User's Playlists", data),
					headers: spotifyHeaders
				})
			},
			"Get a Playlist": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id
						+ queryStringGenerator("Get a Playlist", data),
					headers: spotifyHeaders
				})
			},
			"Get a Playlist Cover Image": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/images"
						+ queryStringGenerator("Get a Playlist Cover Image", data),
					headers: spotifyHeaders
				})
			},
			"Get a Playlist's Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/tracks"
						+ queryStringGenerator("Get a Playlist's Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Remove Tracks from a Playlist": function(data) {
				return $http({
					method: "DELETE",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/tracks"
						+ queryStringGenerator("Remove Tracks from a Playlist", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Remove Tracks from a Playlist", data)
				});
			},
			"Reorder a Playlist's Tracks": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/tracks"
						+ queryStringGenerator("Reorder a Playlist's Tracks", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Reorder a Playlist's Tracks", data)
				});
			},
			"Replace a Playlist's Tracks": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/tracks"
						+ queryStringGenerator("Replace a Playlist's Tracks", data),
					headers: spotifyHeaders,
					data: dataStringGenerator("Replace a Playlist's Tracks", data)
				});
			},
			"Upload a Custom Playlist Cover Image": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/users/" + data.user_id + "/playlists/" + data.playlist_id + "/images"
						+ queryStringGenerator("Upload a Custom Playlist Cover Image", data),
					headers: {
						"Accept": "application/json",
						"Authorization": spotifyHeaders.Authorization,
						"Content-Type": "image/jpeg"
					},
					data: data.image
				});
			},
		// Search
			"Search": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/search?q=" + data.q + "&type=" + data.type 
						+ queryStringGenerator("Search", data),
					headers: spotifyHeaders
				});
			},
		// Tracks
			"Get Audio Analysis for a Track": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/audio-analysis/" + data.id
						+ queryStringGenerator("Get Audio Analysis for a Track", data),
					headers: spotifyHeaders
				})
			},
			"Get Audio Features for a Track": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/audio-features/" + data.id
						+ queryStringGenerator("Get Audio Features for a Track", data),
					headers: spotifyHeaders
				})
			},
			"Get Audio Features for Several Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/audio-features"
						+ queryStringGenerator("Get Audio Features for Several Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Get Several Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/tracks"
						+ queryStringGenerator("Get Several Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Get a Track": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/tracks/" + data.id
						+ queryStringGenerator("Get a Track", data),
					headers: spotifyHeaders
				})
			},
		// Library
			"Check User's Saved Albums": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/albums/contains"
						+ queryStringGenerator("Check User's Saved Albums", data),
					headers: spotifyHeaders
				})
			},
			"Check User's Saved Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/tracks/contains"
						+ queryStringGenerator("Check User's Saved Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Get Current User's Saved Albums": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/albums"
						+ queryStringGenerator("Get Current User's Saved Albums", data),
					headers: spotifyHeaders
				})
			},
			"Get Current User's Saved Tracks": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me/tracks"
						+ queryStringGenerator("Get Current User's Saved Tracks", data),
					headers: spotifyHeaders
				})
			},
			"Remove Albums for Current User": function(data) {
				return $http({
					method: "DELETE",
					url: spotifyUrl + "/me/albums?ids=" + data.ids.join()
						+ queryStringGenerator("Remove Albums for Current User", data),
					headers: spotifyHeaders,
					data: data.ids
				});
			},
			"Remove User's Saved Tracks": function(data) {
				return $http({
					method: "DELETE",
					url: spotifyUrl + "/me/tracks"
						+ queryStringGenerator("Remove User's Saved Tracks", data),
					headers: spotifyHeaders,
					data: data.ids
				});
			},
			"Save Albums for Current User": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/albums?ids=" + data.ids.join()
						+ queryStringGenerator("Save Albums for Current User", data),
					headers: spotifyHeaders,
					data: data.ids
				});
			},
			"Save Tracks for Current User": function(data) {
				return $http({
					method: "PUT",
					url: spotifyUrl + "/me/tracks"
						+ queryStringGenerator("Save Tracks for Current User", data),
					headers: spotifyHeaders,
					data: data.ids
				});
			},
		// User's Profile
			"Get Current User's Profile": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/me"
						+ queryStringGenerator("Get Current User's Profile", data),
					headers: spotifyHeaders
				})
			},
			"Get User's Profile": function(data) {
				return $http({
					method: "GET",
					url: spotifyUrl + "/users/" + data.user_id
						+ queryStringGenerator("Get User's Profile", data),
					headers: spotifyHeaders
				})
			}
	};

	return {
		call: function(endpoint, data) {
			console.log(endpoint);
			return endpointPromiseGenerators[endpoint](data)
			.catch(function(err) {
				console.log(err);
				if (err.status == 401) {
					return logInFactory.refreshLogIn()
				}
			})
			.then(function() {
				return endpointPromiseGenerators[endpoint](data);
			})
		},
		parseTracklistFeatures: function(tracklist) {
			return new Promise(function(RESOLVE) {
				var fullFeatureSamples = [];
				var avgSample = {
					"Danceability": 0,
					"Energy": 0,
					"Loudness": 0,
					"Speechiness": 0,
					"Acousticness": 0,
					"Instrumentalness": 0,
					"Liveness": 0,
					"Valence": 0,
					"Tempo": 0
				}

				if (tracklist == undefined || tracklist.length == 0) {
					RESOLVE(fullFeatureSamples, avgSample);
					return;
				}
				
				var trackIds = tracklist.map(function(t) {
					if (typeof t.track_id == "undefined")
						return t.id;
					else
						return t.track_id;
				});

				var labelById = {}
				for (var i in tracklist)
					labelById[trackIds[i]] = tracklist[i].name

				var promises = [];
				var i = 0;
				while (i < trackIds.length) {
					var queryIds = trackIds.slice(i, Math.min(i + 100, trackIds.length));
					promises.push(new Promise(function(resolve) {
						endpointPromiseGenerators["Get Audio Features for Several Tracks"]({ ids: queryIds })
						.then(function(res) {
							fullFeatureSamples = fullFeatureSamples.concat(res.data.audio_features);
							resolve();
						});
					}));
					i += 100;
				}

				Promise.all(promises).then(function() {
					for (var i = 0; i < fullFeatureSamples.length; i += 1) {
						if (fullFeatureSamples[i] == null || tracklist[i] == undefined) {
							fullFeatureSamples.splice(i, 1);
							tracklist.splice(i, 1);
							i -= 1;
							continue;
						}
					}
					var labels = [];

					clean(fullFeatureSamples, undefined);
					for (var i in fullFeatureSamples) {
						var track = fullFeatureSamples[i];
						labels.push(labelById[track.id]);
						for (var j in removedFeatures) {
							var key = removedFeatures[j];
							delete track[key];
						}
					}

					var samples = fullFeatureSamples.map(function(obj) {
						return Object.keys(obj).map(function(key) {
							return obj[key];
						});
					});

					for (var j = 0; j < fullFeatureSamples.length; j += 1) {
						for (var key in avgSample) {
							avgSample[key] += fullFeatureSamples[j][key.toLowerCase()];
						}
					}
					if (fullFeatureSamples.length > 0) {
						for (var key in avgSample) {
							avgSample[key] /= fullFeatureSamples.length;
						}
					}

					function scaleSpotifyFeaturesData(data) {
						for (var i = 0; i < data.length; i += 1) {
							scaleTrack(data[i]);
						}
					}
					scaleSpotifyFeaturesData(samples);

					RESOLVE({
						samples: samples,
						avgSample: avgSample,
						labels: labels
					});
				});
			});
		},
		modelCall: function(method, samples, labels) {
			var body = {
				method: method,
				samples: samples,
				tmpsId: tmpsId,
				labels: labels
			}

			$http({
				method: "POST",
				url: "/tracks-svm",
				data: body,
				headers: {
					"Accept": "image/png",
					"Content-Type": "application/json"
				}
			});
			$.confirm({
				title: "Analysis",
				content: "<div id=\"popup\" style=\"margin-left:auto;margin-right:auto;text-align:center;\"><div class=\"spinner\" style=\"width:100px;height:80px;font-size:15px;overflow-y:hidden;\"><div class=\"rect1 dialog\"></div><div class=\"rect2 dialog\"></div><div class=\"rect3 dialog\"></div><div class=\"rect4 dialog\"></div><div class=\"rect5 dialog\"></div></div></div>",
				backgroundDismiss: true,
				columnClass: "col-xs-12 col-md-8 col-md-offset-2"
			});

			function poll() {
				$http.get("/img-status?tmpsId=" + tmpsId)
				.then(function(res) {
				console.log("poll status:", res.data.status)
					if (res.data.status != "loading") {
						$(".spinner").fadeOut(function() {
							$("#popup").append("<div id=\"svg-wrapper\"><svg id=\"d3svg\" width=\"400\" height=\"400\" stroke=\"#fff\" stroke-width=\"0.5\"></svg></div>")
							var svg = d3.select("#d3svg"),
							    width = +svg.attr("width"),
							    height = +svg.attr("height");

							var i0 = d3.interpolateHsvLong(d3.hsv(120, 1, 0.65), d3.hsv(60, 1, 0.90)),
							    i1 = d3.interpolateHsvLong(d3.hsv(60, 1, 0.90), d3.hsv(0, 0, 0.95)),
							    interpolateTerrain = function(t) { return t < 0.5 ? i0(t * 2) : i1((t - 0.5) * 2); },
							    color = d3.scaleSequential(interpolateTerrain).domain([-1.5, 1.5]);
							var volcano = {
								width: 100,
								height: 100,
								values: res.data.data.decisionFunction
							};

							svg.selectAll("path")
							    .data(d3.contours()
							        .size([volcano.width, volcano.height])
							        .thresholds(d3.range(-15, 15, 0.1))
							      (volcano.values))
							    .enter().append("path")
							      .attr("d", d3.geoPath(d3.geoIdentity().scale(width / volcano.width)))
							      .attr("fill", function(d) { return color(d.value); });

							var data = res.data.data.scatter.map(function(d, i) {
								return {x: d[0], y: d[1], label: labels[i]};
							})

							// setup x 
							var xValue = function(d) { return d.x / 3 + 0.5;}, // data -> value
							    xScale = d3.scaleLinear().range([0, width]), // value -> display
							    xMap = function(d) { return xScale(xValue(d));}; // data -> display

							// setup y
							var yValue = function(d) { return -d.y / 3 + 0.5;}, // data -> value
							    yScale = d3.scaleLinear().range([height, 0]), // value -> display
							    yMap = function(d) { return yScale(yValue(d));}; // data -> display

							// add the tooltip area to the webpage
							var tooltip = d3.select("#svg-wrapper").append("div")
							    .attr("class", "tooltip")
							    .style("left", (($("#popup").width() - 400) / 2).toString() + "px")
							    .style("width", "400px")
								.style("top", "0px")
								.style("opacity", "1")

							// setup fill color
							var cValue = function(d) { return d.Manufacturer;},
							    color = d3.scaleOrdinal(d3.schemeCategory10);

							// draw dots
							svg.selectAll(".dot")
							.data(data)
							.enter().append("circle")
							.attr("class", "dot")
							.attr("r", 3.5)
							.attr("cx", xMap)
							.attr("cy", yMap)
							.style("fill", function(d) { return color(cValue(d));}) 
							.on("mouseover", function(d) {
								tooltip.transition()
								.duration(200)
								.style("opacity", .9);
								tooltip.html(d.label)
								.style("text-align", "center")
								.style("margin-top", "5px")
								.style("color", "white")
								.style("font-size", "120%")
								.style("font-weight", "500")
							})
							.on("mouseout", function(d) {
								tooltip.transition()
								.duration(500)
								.style("opacity", 0);
							});
						})
					} else {
						setTimeout(poll, 500);
					}
				})
			}
			setTimeout(poll, 500)
		}
	};
});

var generateRandomString = function(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

var spotifyEndpointQueryParameters = {
	// Albums
		"Get an Album": ["market"],
		"Get an Album's Tracks": ["limit", "offset", "market"],
		"Get Several Albums": ["ids", "market"],
	// Artists
		"Get an Artist": [],
		"Get an Artist's Albums": ["album_type", "market", "limit", "offset"],
		"Get an Artist's Top Tracks": ["country"],
		"Get an Artist's Related Artists": [],
		"Get Several Artists": ["ids"],
	// Browse
		"Get a Category": ["country", "locale"],
		"Get a Category's Playlists": ["country", "limit", "offset"],
		"Get a List of Categories": ["country", "locale", "limit", "offset"],
		"Get a List of Featured Playlists": ["locale", "country", "timestamp", "limit", "offset"],
		"Get a List of New Releases": ["country", "limit", "offset"],
		"Get Recommendations": [
			"limit",
			"market",
			"max_danceability",
			"max_energy",
			"max_key",
			"max_loudness",
			"max_mode",
			"max_speechiness",
			"max_acousticness",
			"max_instrumentalness",
			"max_liveness",
			"max_valence",
			"max_tempo",
			"max_duration_ms",
			"max_time_signature",
			"max_popularity",
			"min_danceability",
			"min_energy",
			"min_key",
			"min_loudness",
			"min_mode",
			"min_speechiness",
			"min_acousticness",
			"min_instrumentalness",
			"min_liveness",
			"min_valence",
			"min_tempo",
			"min_duration_ms",
			"min_time_signature",
			"min_popularity",
			"seed_artists",
			"seed_genres",
			"seed_tracks",
			"target_danceability",
			"target_energy",
			"target_key",
			"target_loudness",
			"target_mode",
			"target_speechiness",
			"target_acousticness",
			"target_instrumentalness",
			"target_liveness",
			"target_valence",
			"target_tempo",
			"target_duration_ms",
			"target_time_signature",
		],
	// Follow
		"Check if Current User Follows Artists or Users": ["type", "ids"],
		"Check if Users Follow a Playlist": ["ids"],
		"Follow Artists or Users": ["type", "ids"],
		"Follow a Playlist": [],
		"Get User's Followed Artists": ["type", "limit", "after"],
		"Unfollow Artists or Users": ["type", "ids"],
		"Unfollow a Playlist": [],
	// Personalization

		"Get a User's Top Artists and Tracks": ["limit", "offset", "time_range"],
	// Player
		"Get a User's Available Devices": [],
		"Get Information About The User's Current Playback": ["market"],
		"Get Current User's Recently Played Tracks": ["limit", "after", "before"],
		"Get the User's Currently Playing Track": ["market"],
		"Pause a User's Playback": ["device_id"],
		"Seek To Position In Currently Playing Track": ["position_ms", "device_id"],
		"Set Repeat Mode On User’s Playback": ["state", "device_id"],
		"Set Volume For User's Playback": ["volume_percent", "device_id"],
		"Skip User’s Playback To Next Track": ["device_id"],
		"Skip User’s Playback To Previous Track": ["device_id"],
		"Start/Resume a User's Playback": ["device_id"],
		"Toggle Shuffle For User’s Playback": ["state", "device_id"],
		"Transfer a User's Playback": ["device_id", "play"],
	// Playlists
		"Add Tracks to a Playlist": ["uris", "position"],
		"Change a Playlist's Details": [],
		"Create a Playlist": [],
		"Get a List of Current User's Playlists": ["limit", "offset"],
		"Get a List of a User's Playlists": ["limit", "offset"],
		"Get a Playlist Cover Image": [],
		"Get a Playlist": ["fields", "market"],
		"Get a Playlist's Tracks": ["fields", "limit", "offset", "market"],
		"Remove Tracks from a Playlist": [],
		"Reorder a Playlist's Tracks": [],
		"Replace a Playlist's Tracks": ["uris"],
		"Upload a Custom Playlist Cover Image": [],
	// Search

		"Search": ["market", "limit", "offset"],
	// Tracks
		"Get Audio Analysis for a Track": [],
		"Get Audio Features for a Track": [],
		"Get Audio Features for Several Tracks": ["ids"],
		"Get Several Tracks": ["ids", "market"],
		"Get a Track": ["market"],
	// Library
		"Check User's Saved Albums": ["ids"],
		"Check User's Saved Tracks": ["ids"],
		"Get Current User's Saved Albums": ["limit", "offset", "market"],
		"Get Current User's Saved Tracks": ["limit", "offset", "market"],
		"Remove Albums for Current User": ["ids"],
		"Remove User's Saved Tracks": ["ids"],
		"Save Albums for Current User": ["ids"],
		"Save Tracks for Current User": ["ids"],
	// User's Profile
		"Get Current User's Profile": [],
		"Get User's Profile": [],
};

var spotifyEndpointBodyParameters = {
	"Check if Users Follow a Playlist": ["ids"],
	"Follow Artists or Users": ["ids"],
	"Follow a Playlist": ["public"],
	"Unfollow Artists or Users": ["ids"],
	"Start/Resume a User's Playback": ["context_uri", "uris", "offset"],
	"Add Tracks to a Playlist": ["uris", "position"],
	"Change a Playlist's Details": ["name", "public", "collaborative", "description"],
	"Create a Playlist": ["name", "public", "collaborative", "description"],
	"Remove Tracks from a Playlist": ["tracks", "snapshot_id"],
	"Reorder a Playlist's Tracks": ["range_start", "range_length", "insert_before", "snapshot_id"],
	"Replace a Playlist's Tracks": ["uris"],
	// image is not an actual parameter as the data object is the image
	// Handled in request parameter generating function
	"Upload a Custom Playlist Cover Image": ["image"],
	// ids is not an actual parameter as the data object is the ids array
	// Handled in request parameter generating function
	"Remove Albums for Current User": ["ids"],
	// ids is not an actual parameter as the data object is the ids array
	// Handled in request generating function
	"Remove User's Saved Tracks": ["ids"],
	// ids is not an actual parameter as the data object is the ids array
	// Handled in request parameter generating function
	"Save Albums for Current User": ["ids"],
	// ids is not an actual parameter as the data object is the ids array
	// Handled in request parameter generating function
	"Save Tracks for Current User": ["ids"]
};

var removedFeatures = [
	"analysis_url",
	"duration_ms",
	"id",
	"key",
	"mode",
	"track_href",
	"type",
	"uri"
];
var dBNorm = -10;
var bpmNorm = 180;
var timeSignatureNorm = 4;
var scaleTrack = function(x) {
	x[2] /= dBNorm;
	x[8] /= bpmNorm;
	x[9] /= timeSignatureNorm;
};
var clean = function(arr, deleteValue) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == deleteValue) {
			arr.splice(i, 1);
			i--;
		}
	}
	return arr;
};
