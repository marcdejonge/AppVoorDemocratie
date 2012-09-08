var w = 800,
	h = 400;
	
var positions = d3.range(150).map(function(d) {
		split = 0.1;
		width = (Math.PI - 5 * split) / 6
		startRange = 100;
		stepRange = 50;
		
		baseRot = Math.floor(d / 25) * (width + split);
		nr = d % 25;
		r = 0;
		rot = 0;
		
		if(nr < 2) {
			r = startRange;
			rot = baseRot + (width / 4) + (width / 2) * nr;
		} else if(nr < 5) {
			r = startRange + stepRange;
			rot = baseRot + (width / 6) + (width / 3) * (nr - 2);
		} else if(nr < 9) {
			r = startRange + 2 * stepRange;
			rot = baseRot + (width / 8) + (width / 4) * (nr - 5);
		} else if(nr < 14) {
			r = startRange + 3 * stepRange;
			rot = baseRot + (width / 10) + (width / 5) * (nr - 9);
		} else if(nr < 19) {
			r = startRange + 4 * stepRange;
			rot = baseRot + (width / 10) + (width / 5) * (nr - 14);
		} else if(nr < 25) {
			r = startRange + 5 * stepRange;
			rot = baseRot + (width / 12) + (width / 6) * (nr - 19);
		}
		
		return { x: -Math.cos(rot) * r + w / 2, y: Math.sin(rot) * r + 10 }
	});

var partyColors = {
	"VVD": "#0D1D6F",
	"D66": "#007F3D",
	"CDA": "#336628",
	"PVDA": "#BF0009",
	"PVV": "#0F2B50",
	"GL": "#4CBF5F",
	"SP": "#EA3A43",
	"SGP": "#EB6909",
	"CU": "#0088C2",
	"PVDD": "#1C99A6"
}

function update() {
	members = window.members;
	
	var circles = d3.selectAll("circle")
		.data(members, function(member) { return member.Naam; })
		.transition()
		.duration(500)
		.attr("r", function(member) { 
			return Math.min(10, parseInt(member.Ervaring) / 500) + 5; }
		)
		.attr("fill", function(member) {
			return member.color;
		})
		.attr("cx", function(member, ix) { 
			return positions[ix].x; 
		})
		.attr("cy", function(member, ix) { 
			return positions[ix].y; 
		});
}

function sort(sortFunction, keyFunction) {
	members = window.members;
	
	if(!keyFunction) {
		members.sort(sortFunction);
	} else {
		members = d3.nest().key(keyFunction).map(window.members);
		members = d3.values(members);
		members.sort(sortFunction);
		members = d3.merge(members);
	}
	
	window.members = members;
}

function byName(a, b) {
	return a.Naam > b.Naam ? 1 : a.Naam < b.Naam ? -1 : 0;
}

function byAge(a, b) {
	return a.Leeftijd > b.Leeftijd ? 1 : a.Leeftijd < b.Leeftijd ? -1 : byName(a, b);
}

function byCity(a, b) {
	return a.Woonplaats > b.Woonplaats ? 1 : a.Woonplaats < b.Woonplaats ? -1 : byName(a, b);
}

function byExp(a, b) {
	return parseInt(a.Ervaring) > parseInt(b.Ervaring) ? 1 : parseInt(a.Ervaring) < parseInt(b.Ervaring) ? -1 : byName(a, b);
}

function byParty(a, b) {
	return a.Partij > b.Partij ? 1 : a.Partij < b.Partij ? -1 : byName(a, b);
}

function sortParties() {
	sort(
		function(a, b) {
			if(a.length == b.length) {
				return byParty(a[0], b[0]);
			} else {
				return b.length - a.length;
			}
		},
		function(member) { 
			return member.Partij;
		} 
	);
}

function setColor(mapFunction, colorFunction) {
	for(ix in window.members) {
		window.members[ix].color = colorFunction(mapFunction(window.members[ix]));
	}
}

function setColorParty() {
	setColor(function(member) { 
				return member.Partij; 
			}, function(party) { 
				return partyColors[party]; 
			});
}

function setColorExp() {
	setColor(function(member) {
				return parseInt(member.Ervaring);
			}, function(time) {
				return "rgb(" + Math.max(0, 200 - time/10) + "," + Math.min(200, (time - 1000) / 10) + ",0)"; 
			});			
}

function generateTagCloud(member) {
	naam = member.Voornaam + " " + member.Naam.split(",")[0]

	d3.text("http://mes-project.tno.nl/services/tagcloud?query=%22" + naam + "%22&time", "text/xml",
	d3.xml("test.xml", "text/xml",
		function(data) {
			words = new Array();
			tags = data.getElementsByTagName("tag");
			for(ix in tags) {
				words.push({text: tags[ix].lastChild.data, size: 2 * tags[ix].attributes["weight"].nodeValue});
				if(words.length > 100) break;
			}
			
			d3.layout.cloud().size([600, 300])
				.words(words)
      			.rotate(0)
      			.fontSize(function(d) { return d.size; })
      			.on("end", function(words) {
      				d3.select("#wordcloud").selectAll("text").remove();
      				d3.select("#wordcloud")
						.selectAll("text")
						.data(words)
						.enter()
						.append("text")
						.style("font-size", function(d) { return d.size + "px"; })
						.attr("text-anchor", "middle")
						.attr("transform", function(d) {
							return "translate(" + [d.x + 400, d.y + 150] + ")rotate(" + d.rotate + ")";
						})
						.text(function(d) { return d.text; });
      			})
      			.start();
		});
}

function init() {
	d3.csv("kamerleden.csv", function(members) {
		window.members = members;
	
		d3.select("#kamer").selectAll("circle")
			.data(members, function(member) { return member.Naam; })
			.enter()
			.append("circle")
			.on("mouseover", function(member) {
				d3.select("#memberphoto").attr("src", member.Foto);
				d3.select("#membername").text(member.Naam);
				d3.select("#memberfirstname").text(member.Voornaam);
				d3.select("#memberparty").text(member.Partij);
				d3.select("#membercity").text(member.Woonplaats);
				d3.select("#memberage").text(member.Leeftijd);
				d3.select("#membersex").text(member.Geslacht);
				d3.select("#memberexp").text(member.Ervaring);
				d3.select("#memberinfo")
					.style("display", "block")
					.style("left", d3.event.clientX + "px")
					.style("top", d3.event.clientY + "px")
			})
			.on("mouseout", function(member) {
				d3.select("#memberinfo").style("display", "none");
			})
			.on("click", generateTagCloud)
							
		setColorParty();
		sortParties();
		update();
	});
}