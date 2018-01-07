app.controller("Recommendations", function(apiFactory, dataFactory) {
	apiFactory.call("Get Recommendations", {
		seed_artists: "4V8LLVI7PbaPR0K2TGSxFF"
	})
	.then(function(res) {
		console.log(res);
	})
});
