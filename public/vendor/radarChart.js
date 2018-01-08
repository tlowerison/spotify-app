/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////

function RadarChart(id, data, options) {
	var w0 = parseInt($("#track-audio-features").width() - 160)
	var cfg = {
		w: w0,		// Width of the circle
		h: w0,		// Height of the circle
		margin: {top: 60, right: 80, bottom: 80, left: 80}, // The margins of the SVG
		levels: 3,				// How many levels or inner circles should there be drawn
		labelFactor: 1.25, 	// How much farther than the radius of the outer circle should the labels be placed
		wrapWidth: 60, 		// The number of pixels after which a label needs to be given a new line
		opacityArea: 0.35, 	// The opacity of the area of the blob
		dotRadius: 4, 			// The size of the colored circles of each blog
		opacityCircles: 0.1, 	// The opacity of the circles of each blob
		strokeWidth: 2, 		// The width of the stroke around each blob
		roundStrokes: false,	// If true the area and stroke will follow a round path (cardinal-closed)
		color: d3v3.scale.category10()	// Color function
	};
	
	// Put all of the options into a variable called cfg
	if('undefined' !== typeof options)
		for(var i in options)
			if('undefined' !== typeof options[i]) cfg[i] = options[i];
		
	var allAxis = (data[0].map(function(i, j) {return i.axis})),	// Names of each axis
		total = allAxis.length,					// The number of different axes
		radius = Math.min(cfg.w / 2, cfg.h / 2), 	// Radius of the outermost circle
		Format = d3v3.format('%'),			 	// Percentage formatting
		angleSlice = Math.PI * 2 / total;		// The width in radians of each "slice"
	
	// Scale for the radius
	var rScale = d3v3.scale.linear()
		.range([0, radius])
		.domain([0, 1]);
		
	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	// Remove whatever chart with the same id/class was present before
	d3v3.select(id).select("svg").remove();

	// Initiate the radar chart SVG
	var svg = d3v3.select(id).append("svg")
			.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
			.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
			.attr("display", "block")
			.attr("margin", "auto")
			.attr("class", "radar" + id);

	// Append a g element		
	var g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");
	
	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////
	
	// Filter for the outside glow
	var filter = g.append('defs').append('filter').attr('id','glow'),
		feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
		feMerge = filter.append('feMerge'),
		feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
		feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////
	
	// Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	
	// Draw the background circles
	axisGrid.selectAll(".levels")
		.data(d3v3.range(1,(cfg.levels+1)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function(d, i){return radius/cfg.levels*d;})
		.style("fill", "#CCCCCC")
		.style("stroke", "#CCCCCC")
		.style("fill-opacity", cfg.opacityCircles)
		.style("filter" , "url(#glow)");

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////
	
	// Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	// Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ return rScale(1.1) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(1.1) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", "#ddd")
		.style("stroke-width", "2px");

	// Append the labels at each axis
	axis.append("text")
		.style("font-size", "12px")
		.attr("text-anchor", "middle")
		.attr("dy", "0em")
		.attr("x", function(d, i){ return rScale(cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale(cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", "#CCCCCC")
		.text(function(d){return d})
		.call(wrap, cfg.wrapWidth)

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	// The radial line function
	var radarLine = d3v3.svg.line.radial()
		.interpolate("linear-closed")
		.radius(function(d, i) { return rScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });
		
	if(cfg.roundStrokes) {
		radarLine.interpolate("cardinal-closed");
	}
				
	// Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");
			
	// Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			// Dim all blobs
			d3v3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1); 
			// Bring back the hovered over blob
			d3v3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);	
		})
		.on('mouseout', function(){
			// Bring back all blobs
			d3v3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});
		
	// Create the outlines	
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");		
	
	// Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 0.8);

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////
	
	// Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");
		
	// Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.attr("r", cfg.dotRadius*1.5)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3v3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3v3.select(this).attr('cy')) - 10;
			
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.transition().duration(200)
				.style('opacity', 1)
				.style("fill", "#FFFFFF");
			if (d.index == 2) tooltip.text((-(d.value - 1) * featureNorms[2]).toString() + " dB");
			else {
				var num = "";
				if (d.index == 8 || d.index == 9) num = (d.value * featureNorms[d.index]).toFixed(0);
				else num = (d.value * featureNorms[d.index]).toFixed(4);

				if (d.index == 8) num += " BPM";
				else if (d.index == 9) num += "/4";
				tooltip.text(num)
			}
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});
		
	// Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);

		/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////

	// Taken from http://bl.ocks.org/mbostock/7555321
	// Wraps SVG text	
	function wrap(text, width) {
		text.each(function() {
			var text = d3v3.select(this),
			words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.4, // em
				y = text.attr("y"),
				x = text.attr("x"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		});
	}
}