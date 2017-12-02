var app = angular.module("MyApp", ["ngRoute"]).config(function($locationProvider) {
	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix("");
});

// SPOTIFY
	var spotify_api_url = 'https://api.spotify.com/v1';
	var spotify_headers = {};
	var access_token = '';
	var refresh_token = '';
	var current_user_profile = null;
	var current_user_playlists = [];
	var calls = 0;

	function set_spotify_tokens(access, refresh) {
		access_token = access;
		refresh_token = refresh;
		spotify_headers = {
			'Accept': 'application/json',
			'Authorization': 'Bearer ' + access_token,
			'Content-Type': 'application/json'
		};
	}

	function get_current_user_profile() {
		return {
			method: 'GET',
			url: spotify_api_url + '/me',
			headers: spotify_headers
		};
	}

	function get_current_user_playlists() {
		return {
			method: 'GET',
			url: spotify_api_url + '/me/playlists/',
			headers: spotify_headers
		};
	}

	function get_current_user_tracks() {
		return {
			method: 'GET',
			url: spotify_api_url + '/me/tracks',
			headers: spotify_headers
		};
	}

	function get_current_user_albums() {
		return {
			method: 'GET',
			url: spotify_api_url + '/me/albums',
			headers: spotify_headers
		};
	}

	function get_track(songId) {
		return {
			method: 'GET',
			url: spotify_api_url + '/tracks/' + songId,
			headers: spotify_headers
		};
	}

	function get_tracks(songIds) {
		return {
			method: 'GET',
			url: spotify_api_url + '/tracks/?ids=' + songIds.join(),
			headers: spotify_headers
		};
	}

	function get_track_features(ids) {
		switch (typeof ids) {
			case "string":
				return {
					method: 'GET',
					url: spotify_api_url + '/audio-features/?ids=' + ids,
					headers: spotify_headers
				};
			case "object":
				return {
					method: 'GET',
					url: spotify_api_url + '/audio-features/?ids=' + ids.join(),
					headers: spotify_headers
				};
		}
	}

	function get_album(albumId) {
		return {
			method: 'GET',
			url: spotify_api_url + '/albums/' + albumId,
			headers: spotify_headers
		};
	}

	function get_artists(artists) {
		var artistIds = artists.map(function(artist) {
			return artist.id;
		});
		return get_artists_by_id(artistIds);
	}

	function get_artists_by_id(artistIds) {
		switch (typeof artistIds) {
			case "string":
				return {
					method: 'GET',
					url: spotify_api_url + '/artists/' + artistIds,
					headers: spotify_headers
				};
			case "object":
				return {
					method: 'GET',
					url: spotify_api_url + '/artists/?ids=' + artistIds.join(),
					headers: spotify_headers
				};
		}
	}

	function get_playlist(userId, playlistId) {
		return {
			method: 'GET',
			url: spotify_api_url + '/users/' + userId + '/playlists/' + playlistId,
			headers: spotify_headers
		}
	}

	function get_playlist_tracks(userId, playlistId) {
		return {
			method: 'GET',
			url: spotify_api_url + '/users/' + userId + '/playlists/' + playlistId + '/tracks',
			headers: spotify_headers
		}
	}

	function get_current_users_recent_tracks() {
		return {
			method: 'GET',
			url: spotify_api_url + '/me/player/recently-played/?limit=50',
			headers: spotify_headers
		};
	}

	function get_related_artists(artistId) {
		return {
			method: 'GET',
			url: spotify_api_url + '/artists/' + artistId + '/related-artists',
			headers: spotify_headers
		};
	}

	function search(query, type, limit) {
		return {
			method: 'GET',
			url: spotify_api_url + '/search/?q=' + query + '&type=' + type + '&limit=' + limit,
			headers: spotify_headers
		};
	}

	function play_tracks(tracks) {
		return {
			method: 'PUT',
			uris: tracks.map(function(e) {
				return e.uri;
			}),
			headers: spotify_headers
		};
	}

	function flatten_artists_genres(artists) {
		var input = artists.map(function(artist) {
			return artist.genres;
		});
		var flattened = [];
		for (var i = 0; i < input.length; ++i) {
			var current = input[i];
			for (var j = 0; j < current.length; ++j)
				flattened.push(current[j]);
		}
		return flattened;
	}

// MUSIXMATCH
	var musixmatch_api_url = 'http://api.musixmatch.com/ws/1.1';
	var musixmatch_key = '76b976295c262270482a842d34f56710';
	var musixmatch_headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
	function get_musixmatch_track(track_isrc) {
		return {
			method: 'GET',
			url: musixmatch_api_url + '/track.get?track_isrc=' + track_isrc + '&apikey=' + musixmatch_key,
			headers: musixmatch_headers
		}
	}

	function get_musixmatch_obj_by_id(type, id) {
		return {
			method: 'GET',
			url: musixmatch_api_url + '/' + type + '.get?' + type + '_id=' + id + '&apikey=' + musixmatch_key,
			headers: musixmatch_headers
		}
	}

	function flatten_musixmatch_genres(obj) {
		function retrieve_genre(item) {
			return item.music_genre;
		}

		var genres = {
			'primaryGenres': obj.primary_genres.music_genre_list.map(retrieve_genre), 
			'secondaryGenres': obj.secondary_genres.music_genre_list.map(retrieve_genre)
		};
		return genres;
	}
	/*
	var id_conglomerates = {
		"pop": ,
		"dance pop": ,
		"pop rap": ,
		"rap": ,
		"post-teen pop": ,
		"tropical house": ,
		"rock": ,
		"modern rock": ,
		"trap music": ,
		"dwn trap": ,
		"southern hip hop": ,
		"hip hop": ,
		"edm": ,
		"latin": ,
		"pop rock": ,
		"r&b": ,
		"alternative rock": ,
	}*/

	var genre_id = {
		// A
			"Adult Alternative": 1144,
			"Adult Contemporary": 1131,
			"Alternative": 20,
			"Alternative & Rock in Spanish": 1121,
			"Anime": 29,
			"Arena Rock": 1146,
			"Avant-Garde Jazz": 1106,
		// B
			"Baladas y Boleros": 1120,
			"Blues": 2,
			"Blues-Rock": 1147,
			"Brazilian": 1122,
			"Britpop": 1132,
		// C
			"Children's Music": 4,
			"Classical": 5,
			"Contemporary Gospel": 1100,
			"Contemporary Jazz": 1107,
			"Crossover Jazz": 1108,
			"Comedy": 3,
			"Contemporary Latin": 1116,
			"Contemporary R&B": 1136,
			"Country": 6,
		// D
			"Dance": 17,
			"Disco": 1137,
			"Doo Wop": 1138,
			"Dixieland": 1109,
		// E
			"Easter": 1090,
			"Easy Listening": 25,
			"Electronic": 7,
			"Enka": 28,
			"Environmental": 1125,
		// F
			"Fitness & Workout": 50,
			"Fusion": 1110,
			"Funk": 1139,
		// G
			"German Pop": 50000066,
			"Glam Rock": 1150,
			"Gospel": 1101,
		// H
			"Hair Metal": 1151,
			"Halloween": 1091,
			"Hard Rock": 1152,
			"Healing": 1126,
			"Heavy Metal": 1153,
			"Hip Hop/Rap": 18,
			"Holiday": 8,
		// I

			"Instrumental": 53,
		// J
			"J-Pop": 27,
			"Jam Bands": 1154,
			"Jazz": 11,
		// K
			"K-Pop": 51,
			"Karaoke": 52,
			"Kayokyoku": 30,
		// L
			"Latin": 12,
			"Latin Jazz": 1111,
			"Latin Urban": 1119,
		// M
			"Mainstream Jazz": 1112,
			"Meditation": 1127,
			"Motown": 1140,
		// N
			"Nature": 1128,
			"Neo-Soul": 1141,
			"New Age": 13,
		// O

			"Opera": 9,
		// P
			"Pop": 14,
			"Pop in Spanish": 1117,
			"Pop/Rock": 1133,
			"Praise & Worship": 1103,
			"Prog-Rock/Art Rock": 1155,
			"Psychedelic": 1156,
		// Q

			"Quiet Storm": 1142,
		// R
			"R&B/Soul": 15,
			"Ragtime": 1113,
			"Raices": 1118,
			"Reggae": 24,
			"Regional Mexicano": 1123,
			"Relaxation": 1129,
			"Rock": 21,
			"Rock & Roll": 1157,
			"Rockabilly": 1158,
			"Roots Rock": 1159,
		// S
			"Salsa y Tropical": 1124,
			"Singer/Songwriter": 10,
			"Smooth Jazz": 1114,
			"Soft Rock": 1134,
			"Soul": 1143,
			"Soundtrack": 16,
			"Southern Gospel": 1104,
		// T
			"Teen Pop": 1135,
			"Thanksgiving": 1093,
			"Traditional Gospel": 1105,
			"Travel": 1130,
		// V

			"Vocal": 23,
		// W

			"World": 19
	}

// GENIUS
	var genius_access_token = 'gyEqd2UeoO6JPcb8hHSVrPyTREA9Eww9S18dHp8Vix5-wMvhQFTMYCMa5W11pEHJ';
	var genius_headers = {
		'Accept': 'application/json',
		'Authorization': 'Bearer ' + genius_access_token,
		'Content-Type': 'application/json'
	};
