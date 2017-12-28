app.controller("Sidebar", function($scope, $location, logInFactory) {
	logInFactory.isLoggedIn()
	.then(loggedInSidebar)
	.catch($scope.loggedOutSidebar)

	function loggedInSidebar() {
		$("#sidebar-browse").show()
		$("#sidebar-library").show()
		$("#sidebar-search").show()
		$("#sidebar-login").hide()
		$("#sidebar-logout").show()
	}

	$scope.loggedOutSidebar = function() {
		$("#sidebar-browse").hide()
		$("#sidebar-library").hide()
		$("#sidebar-search").hide()
		$("#sidebar-login").show()
		$("#sidebar-logout").hide()
	}
})
