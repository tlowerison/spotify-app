app.filter("featureUnits", function() {
	return function(input) {
		if (input == "Tempo")
			return " BPM"
		else if (input == "Loudness")
			return " dB"
		else
			return ""
	}
});