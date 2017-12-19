app.controller("Sidebar", function($scope, $location, loggedInFactory) {
	loggedInFactory
	.then(function() {
		$("#sidebar-browse").show();
		$("#sidebar-library").show();
		$("#sidebar-search").show();
		$("#sidebar-login").hide();
		$("#sidebar-logout").show();
	})
	.catch(function() {
		$("#sidebar-browse").hide();
		$("#sidebar-library").hide();
		$("#sidebar-search").hide();
		$("#sidebar-login").show();
		$("#sidebar-logout").hide();
	});

	$scope.loggedOut = function() {
		$location.path("/");
	}
});
