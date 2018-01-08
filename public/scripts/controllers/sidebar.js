app.controller("Sidebar", function($scope, $http, $location, $routeParams, logInFactory, localStorageService) {
	function loggedInSidebar() {
		$(".navbar-brand").attr("href", "/")
		$(".navbar-brand").html("Home")
		$("#sidebar-login").hide()
		$("#sidebar-browse").show()
		$("#sidebar-library").show()
		$("#sidebar-search").show()
		$("#sidebar-logout").show()
	}

	$scope.loggedOutSidebar = function() {
		$(".navbar-brand").attr("href", "/login")
		$(".navbar-brand").html("Login")
		$(".navbar-toggle").hide()
		$("#sidebar-browse").hide()
		$("#sidebar-library").hide()
		$("#sidebar-search").hide()
		$("#sidebar-logout").hide()
		removeSpotifyTokens($http, localStorageService)
		$http.post("/logout", { tmpsId: tmpsId })
		$location.path("/");
	}

	$("#sidebar-browse, #sidebar-search, #sidebar-logout, .sidebar-dropdown-menu").on("click", function() {
		$("#sidebar").collapse("hide");
	})

	if ($location.path().slice(0, 7) == "/tokens") {
		var url = $location.path().split('/');
		initializeSpotifyTokens({
			access_token: url[2],
			refresh_token: url[3]
		}, localStorageService)
		$location.path("/browse");
	}

	logInFactory.isLoggedIn()
	.then(loggedInSidebar)
	.catch($scope.loggedOutSidebar)

    function htmlbodyHeightUpdate(){
		var height3 = $( window ).height()
		var height1 = $('.nav').height()+50
		height2 = $('.main').height()
		if(height2 > height3){
			$('html').height(Math.max(height1,height3,height2)+10);
			$('body').height(Math.max(height1,height3,height2)+10);
		}
		else
		{
			$('html').height(Math.max(height1,height3,height2));
			$('body').height(Math.max(height1,height3,height2));
		}
		
	}
	
	$(document).ready(function () {
		htmlbodyHeightUpdate()
		$( window ).resize(function() {
			htmlbodyHeightUpdate()
		});
		$( window ).scroll(function() {
			height2 = $('.main').height()
  			htmlbodyHeightUpdate()
		});
	});
})
