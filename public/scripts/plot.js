function plotInit(popup, s, l, d, ids) {
	labels = l;
	// transpose samples matrix to a features matrix
	features = s[0].map((col, i) => s.map(row => row[i]))
	
	// provide all data with position title and artist information
	data.scatter = d.scatter.map(function(e, i) {
		return {
			x: e[0],
			y: e[1],
			title: labels[i].title,
			artists: labels[i].artists,
			id: ids[i],
			clusterLabel: d.clusterLabels[i]
		};
	});

	clusterLabels = d.clusterLabels.filter((value, index, self) => {return self.indexOf(value) === index;})
	clusterColors = Array.from(clusterLabels, x => '#' + (Math.random()*0xFFFFFF<<0).toString(16))

	data.decisionFunction = d.decisionFunction;
	var m = $(window).width() < 768 ? 10 : 300
	var w = popup.width() - m

	popup.append("<div id=\"svg-wrapper\"><svg id=\"d3svg\" width=\"" + w.toString() + "\" height=\"" + w.toString() + "\" stroke=\"#fff\" stroke-width=\"0.5\"></svg></div>");
	
	svg = d3.select("#d3svg");
	width = +svg.attr("width");
	height = +svg.attr("height");

	tooltip = d3.select("#svg-wrapper").append("div")
	.attr("class", "tooltip container")
	.style("left", (m / 2).toString() + "px")
	.style("width", w.toString() + "px")
	.style("bottom", (w - 25).toString() + "px")
	.style("text-align", "center")
	.style("margin-top", "5px");

	$("#feature-1, #feature-2").change(function() {
		analysisPlot("feature");
	})
	currentPlotType = "cluster";
}

function mouseOverDot(d) {
	tooltip.transition()
	.duration(200)
	.style("opacity", .9);
	tooltip.html("<div style=\"display:inline-block;font-size:130%;font-weight:500;\">" + d.title + "&nbsp;•&nbsp;</div><div style=\"display:inline-block;\">" + d.artists.join(", ") + "</div>")
	if (currentPlotType == "feature") tooltip.style("color", "black")
	else tooltip.style("color", "white")
}

function mouseOutDot(d) {
	tooltip.transition()
	.duration(500)
	.style("opacity", 0);
}

function generateClusterAnalysis() {
	var volcano = {
		width: 100,
		height: 100,
		values: data.decisionFunction
	};

	var min = data.decisionFunction.reduce(function(a, b) { return Math.min(a, b); });
	var max = data.decisionFunction.reduce(function(a, b) { return Math.max(a, b); });
	
	var colorPallete = [
		d3.interpolateRgb.gamma(2.2)("rgb(49,54,149)", "rgb(69,117,180)"),
		d3.interpolateRgb.gamma(2.2)("rgb(69,117,180)", "rgb(116,173,209)"),
		d3.interpolateRgb.gamma(2.2)("rgb(116,173,209)", "rgb(171,217,233)"),
		d3.interpolateRgb.gamma(2.2)("rgb(171,217,233)", "rgb(224,243,248)"),
		d3.interpolateRgb.gamma(2.2)("rgb(224,243,248)", "rgb(254,224,144)"),
		d3.interpolateRgb.gamma(2.2)("rgb(254,224,144)", "rgb(253,174,97)"),
		d3.interpolateRgb.gamma(2.2)("rgb(253,174,97)", "rgb(244,109,67)"),
		d3.interpolateRgb.gamma(2.2)("rgb(244,109,67)", "rgb(215,48,39)"),
		d3.interpolateRgb.gamma(2.2)("rgb(215,48,39)", "rgb(165,0,38)")
	];

	var color = d3.scaleSequential(function(t) {
		t = (t - min) / (max - min);
		var k = Math.floor(t * colorPallete.length);
		if (k == colorPallete.length) k -= 1;
		return colorPallete[k](t * colorPallete.length - k);
	});

	svg.selectAll("path")
	.data(d3.contours()
		.size([volcano.width, volcano.height])
		.thresholds(d3.range(min, max, 0.1))
	(volcano.values))
	.enter().append("path")
	.attr("d", d3.geoPath(d3.geoIdentity().scale(width / volcano.width)))
	.attr("fill", function(d) { return color(d.value); });

	// map data to display
	var xValue = function(d) { return d.x / 3 + 0.5;};
	var xScale = d3.scaleLinear().range([0, width]);
	var xMap = function(d) { return xScale(xValue(d));};

	var yValue = function(d) { return d.y / 3 + 0.5;};
	var yScale = d3.scaleLinear().range([height, 0]);
	var yMap = function(d) { return yScale(yValue(d));};


	// setup fill color
	var cValue = function(d) { return d.Manufacturer;};
	var dotColor = function(d) {
		return clusterColors[clusterLabels.indexOf(d.clusterLabel)];
	}

	tooltip
	.style("color", "white")

	var touch = false;
	var recentDot = undefined
	// draw dots
	svg.selectAll(".dot")
	.data(data.scatter)
	.enter().append("circle")
	.attr("class", "dot")
	.attr("r", 3.5)
	.attr("cx", xMap)
	.attr("cy", yMap)
	.style("fill", function(d) { return dotColor(d);}) 
	.on("mouseover", mouseOverDot)
	.on("touchstart", function(d) {
		touch = true
		recentDot = d
	})
	.on("mouseout", mouseOutDot)
	.on("click", function(d) {
		window.open("https://spotifynoiseinjection.herokuapp.com/track/" + d.id);
	})
	svg
	.on("touchstart", function() {
		if (touch) {
			mouseOverDot(recentDot)
			touch = false
		} else mouseOutDot(recentDot)
	})
}

function generateFeatureAnalysis(feature1, feature2) {
	// map data to display
	var xValue = function(d) { return d.x; };
	var xScale = d3.scaleLinear().range([0, width]);
	var xMap = function(d) { return xScale(xValue(d));};

	var yValue = function(d) { return d.y; };
	var yScale = d3.scaleLinear().range([height, 0]);
	var yMap = function(d) { return yScale(yValue(d));};

	// setup fill color
	var cValue = function(d) { return d.Manufacturer;};
	var dotcolor = d3.scaleOrdinal(d3.schemeCategory10);
	var scatter = d3.zip(features[feature1], features[feature2])
	.map(function(d, i) {
		return {x: d[0], y: d[1], title: labels[i].title, artists: labels[i].artists};
	});


	tooltip
	.style("color", "#333")

	// draw dots
	svg.selectAll(".dot")
	.data(scatter)
	.enter().append("circle")
	.attr("class", "dot")
	.attr("r", 3.5)
	.attr("cx", xMap)
	.attr("cy", yMap)
	.style("fill", function(d) { return dotcolor(cValue(d));}) 
	.on("mouseover", mouseOverDot)
	.on("mouseout", mouseOutDot);
}

function clearPlot() {
	svg.selectAll("*").remove();
}

function analysisPlot() {
	feature1 = $("#feature-1")[0].value;
	feature2 = $("#feature-2")[0].value;
	if (currentPlotType == "cluster" && previousPlotType == "feature" || currentPlotType == "feature") 
		clearPlot();
	if (currentPlotType == "cluster") generateClusterAnalysis();
	else if (feature1 >= 0 && feature2 >= 0) generateFeatureAnalysis(feature1, feature2)
	previousPlotType = currentPlotType;
};

function setCurrentType(type) {
	currentPlotType = type;
}

function analysisOptions() {
	$.alert({
		title: "Options",
		content: "What type of analysis would you like to perform?",
		backgroundDismiss: true,
		columnClass: "col-xs-10 col-xs-offset-1 col-md-6 col-md-offset-3",
		buttons: {
			cluster: {
				text: "Cluster Analysis",
				action: function() {
					setCurrentType("cluster")
					if (currentPlotType != previousPlotType) clearPlot()
					$("#feature-analysis-select").addClass("collapse")
					analysisPlot()
					return true;
				}
			},
			feature: {
				text: "Feature Analysis",
				action: function() {
					setCurrentType("feature")
					if (currentPlotType != previousPlotType) clearPlot()
					$("#feature-analysis-select").removeClass("collapse")
					return true;
				}
			}
		}
	});
}
