var partijen = ["Brinkman", "CDA", "ChristenUnie", "D66", "GrKH", "Groenlinks", "PVDA", "PVDD", "PVV", "SGP", "SP", "VVD"];

var chord = d3.layout.chord()
    .padding(.05)
    .sortSubgroups(d3.descending)
    .matrix([
    [0,1,1,0,3,2,3,2,1,1,2,1],
	[1,0,169,1,129,129,234,20,176,135,102,372],
	[1,169,0,1,359,457,505,68,60,221,314,80],
	[0,1,1,0,0,1,1,1,1,0,1,0],
	[3,162,359,0,0,704,711,93,47,104,353,106],
	[2,129,457,1,704,0,891,139,52,94,551,84],
	[3,234,505,1,711,891,0,146,85,128,709,135],
	[2,20,68,0,93,139,146,0,17,24,122,8],
	[1,176,60,1,47,52,85,17,0,64,79,177],
	[1,135,221,0,104,94,128,24,64,0,93,90],
	[2,102,314,1,353,551,709,122,79,93,0,70],
	[1,372,80,0,106,84,135,8,177,90,70,0]
    ]);
    

var width = 600,
    height = 600,
    innerRadius = Math.min(width, height) * .41,
    outerRadius = innerRadius * 1.1;

var fill = d3.scale.ordinal()
    .domain(d3.range(12))
    .range([ "#A7987C",  "#E15E40", "#FF8D59", "#DCCDB3","#C4243C", "#445B85", "#643545", "#83EF58", "#BEFF0C", "#15C19F", "#27A7E5", "#0E9FCC"]);

var svg = d3.select("#chart")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("g")
  .selectAll("path")
    .data(chord.groups)
  .enter().append("path")
    .style("fill", function(d) { return fill(d.index); })
    .style("stroke", function(d) { return fill(d.index); })
    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
    .on("mouseover", fade(.1))
    .on("mouseout", fade(1));

var ticks = svg.append("g")
  .selectAll("g")
    .data(chord.groups)
  .enter().append("g")
  .selectAll("g")
    .data(groupTicks)
  .enter().append("g")
    .attr("transform", function(d) {
      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
          + "translate(" + outerRadius + ",0)";
    });

ticks.append("line")
    .attr("x1", 1)
    .attr("y1", 0)
    .attr("x2", 5)
    .attr("y2", 0)
    .style("stroke", "#000");

ticks.append("text")
    .attr("x", 8)
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) {
      return d.angle > Math.PI ? "end" : null;
    })
    .attr("transform", function(d) {
      return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
    })
    .text(function(d) { return d.label; });

svg.append("g")
    .attr("class", "chord")
  .selectAll("path")
    .data(chord.chords)
  .enter().append("path")
    .style("fill", function(d) { return fill(d.target.index); })
    .attr("d", d3.svg.chord().radius(innerRadius))
    .style("opacity", 1);

/** Returns an array of tick angles and labels, given a group. */
function groupTicks(d) {
	console.log(d);
  var k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, d.value, 1000).map(function(v, i) {
    return {
      angle: v * k + d.startAngle,
      label: partijen[d.index]
    };
  });
}

/** Returns an event handler for fading a given chord group. */
function fade(opacity) {
  return function(g, i) {
    svg.selectAll("g.chord path")
        .filter(function(d) {
          return d.source.index != i && d.target.index != i;
        })
      .transition()
        .style("opacity", opacity);
  };
}