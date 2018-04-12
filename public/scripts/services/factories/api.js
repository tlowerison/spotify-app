app.factory("apiFactory", function($http, logInFactory) {

	var endpoints = endpointPromiseGenerator($http)

	return {
		call: function(endpoint, data) {
			return endpoints[endpoint](data)
			.catch(function(err) {
				if (err.status == 401) {
					return logInFactory.refreshLogIn()
				}
			})
			.then(function() {
				return endpoints[endpoint](data)
			})
		},
		modelCall: function(title, method, samples, labels, ids, isCached) {
			function pollImgStatus() {
				$http.get("/img-status?tmpsId=" + tmpsId)
				.then(function(res) {
					if (res.data.status != "loading") {
						$(".spinner").fadeOut(function() {
							plotInit($("#analysis-popup"), samples, labels, res.data.data, ids)
							generateClusterAnalysis()
						})
					} else setTimeout(pollImgStatus, imgPollRate)
				})
			}

			if (!isCached) {
				$http({
					method: "POST",
					url: "/tracks-svm",
					data: {
						method: method,
						samples: samples,
						tmpsId: tmpsId
					},
					headers: {
						"Accept": "image/png",
						"Content-Type": "application/json"
					}
				})
			}

			if (method == "train" || method == "test") {
				var plotTitle = ''
					+ '<div style="display:inline-block;">' + title + (title == 'Library' ? '' : ':') + ' Analysis' + '</div>'
					+ '<button class="mdc-button collapsed" style="display:inline-block; margin-left:3px;padding:0px;" onclick="analysisOptions()">'
						+ '<h3 style="margin:0px; padding-left:3px; padding-right:3px;">•••</h3>'
					+ '</button>'

				$.alert({
					title: plotTitle,
					content: plotContent,
					backgroundDismiss: true,
					columnClass: "col-xs-12 col-md-8 col-md-offset-2",
					buttons: {
						close: {
							text: "Close",
							action: function() {
								return true
							}
						}
					}
				})

				pollImgStatus()
			}
		},
		parseTracklistFeatures: function(tracklist) {
			return new Promise(function(RESOLVE) {
				var fullFeatureSamples = []
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
					RESOLVE(fullFeatureSamples, avgSample)
					return
				}
				
				var trackIds = tracklist.map(function(t) {
					if (typeof t.track_id == "undefined")
						return t.id
					else
						return t.track_id
				})

				var labelById = {}
				for (var i in tracklist)
					labelById[trackIds[i]] = { title: tracklist[i].name, artists: tracklist[i].artists.map(function(a) {return a.name}) }

				var promises = []
				var i = 0
				while (i < trackIds.length) {
					var queryIds = trackIds.slice(i, Math.min(i + 100, trackIds.length))
					promises.push(new Promise(function(resolve) {
						endpoints["Get Audio Features for Several Tracks"]({ ids: queryIds })
						.then(function(res) {
							fullFeatureSamples = fullFeatureSamples.concat(res.data.audio_features)
							resolve()
						})
					}))
					i += 100
				}

				Promise.all(promises).then(function() {
					for (var i = 0; i < fullFeatureSamples.length; i += 1) {
						if (fullFeatureSamples[i] == null || tracklist[i] == undefined) {
							fullFeatureSamples.splice(i, 1)
							tracklist.splice(i, 1)
							i -= 1
							continue
						}
					}
					var labels = []

					clean(fullFeatureSamples, undefined)
					for (var i in fullFeatureSamples) {
						var track = fullFeatureSamples[i]
						labels.push(labelById[track.id])
						for (var j in removedFeatures) {
							var key = removedFeatures[j]
							delete track[key]
						}
					}

					var samples = fullFeatureSamples.map(function(obj) {
						return Object.keys(obj).map(function(key) {
							return obj[key]
						})
					})

					for (var j = 0; j < fullFeatureSamples.length; j += 1) {
						for (var key in avgSample) {
							avgSample[key] += fullFeatureSamples[j][key.toLowerCase()]
						}
					}
					if (fullFeatureSamples.length > 0) {
						for (var key in avgSample) {
							avgSample[key] /= fullFeatureSamples.length
						}
					}

					function scaleSpotifyFeaturesData(data) {
						for (var i = 0; i < data.length; i += 1) {
							scaleTrack(data[i])
						}
					}
					scaleSpotifyFeaturesData(samples)
					RESOLVE({
						samples: samples,
						avgSample: avgSample,
						labels: labels,
						ids: tracklist.map((t) => {return t.track_id})
					})
				})
			})
		}
	}
})
