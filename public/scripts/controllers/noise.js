app.controller("Noise", function($scope, dataFactory, apiFactory) {
	var promise = new Promise(function(resolve) {
		if (dataFactory.libraryPromises != undefined) {
			Promise.all(dataFactory.libraryPromises)
			.then(function() {
				resolve()
			})
		} else {
			dataFactory.loadFullLibrary().then(function() {
				resolve()
			})
		}
	})

	promise.then(function() {
		var artistIds = {}
		var histogram = {}

		function addId(id) {
			if (id in artistIds) 
				artistIds[id].count += 1
			else
				artistIds[id] = {count: 1}
		}

		for (var i in dataFactory.savedPlaylists)
			for (var j in dataFactory.savedPlaylists[i].tracks)
				for (var k in dataFactory.savedPlaylists[i].tracks[j].artists)
					addId(dataFactory.savedPlaylists[i].tracks[j].artists[k].artist_id)
		for (var i in dataFactory.savedAlbums)
			for (var j in dataFactory.savedAlbums[i].artists)
					addId(dataFactory.savedAlbums[i].artists[j].id)
		for (var i in dataFactory.savedTracks)
			for (var j in dataFactory.savedTracks[i].artists)
					addId(dataFactory.savedTracks[i].artists[j].id)
		for (var i in dataFactory.recentlyPlayed)
			for (var j in dataFactory.recentlyPlayed[i].artists)
					addId(dataFactory.recentlyPlayed[i].artists[j].id)
		for (var key in artistIds) 
			if (artistIds[key].count in histogram)
				histogram[artistIds[key].count].push(key)
			else
				histogram[artistIds[key].count] = [key]

		var histKeys = Object.keys(histogram).map((k) => parseInt(k))
		var sum = histKeys.reduce((a,b) => a + b)
		var rand = Math.random() * sum
		var histRand = -1
		while (rand > 0) {
			rand -= histKeys[histRand]
			histRand += 1
		}
		var ids = histogram[histKeys[histRand]]
		var initialArtist = ids[Math.floor(Math.random() * ids.length)]
		apiFactory.call("Get an Artist", {id: initialArtist})
		.then(function(res) {
			$scope.seedArtist = res.data
		})
		apiFactory.call("Get an Artist's Related Artists", {id: initialArtist})
		.then(function(res) {
			$scope.relatedArtists = res.data.artists
		})

	})
})