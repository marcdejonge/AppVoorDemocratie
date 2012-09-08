var kamer = {
	w: 800,
	h: 400,

	init: function() {
		d3.csv("kamerleden.csv", function(members) {
			this.members = members;
		
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
				.on("click", kamer.generateTagCloud)
								
			color.setColorParty();
			sort.sortParties();
			membersize.setSize("byExp");
			kamer.update();
		});
	},
	
	update: function() {
		var circles = d3.selectAll("circle")
			.data(members, function(member) { return member.Naam; })
			.transition()
			.duration(500)
			.attr("r", function(member) { 
				return member.size;
			})
			.attr("fill", function(member) {
				return member.color;
			})
			.attr("cx", function(member, ix) { 
				return sort.positions[ix].x;
			})
			.attr("cy", function(member, ix) { 
				return sort.positions[ix].y; 
			});
	},
	
	
	generateTagCloud: function(member) {
		naam = member.Voornaam + " " + member.Naam.split(",")[0];
	
		d3.text("http://mes-project.tno.nl/services/tagcloud?query=%22" + naam + "%22&time", "text/xml",
	//	d3.xml("test.xml", "text/xml",
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
}

var sort = {
	positions: d3.range(150).map(function(d) {
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
		
		return { x: -Math.cos(rot) * r + kamer.w / 2, y: Math.sin(rot) * r + 10 }
	}),
	sortBy: function(type) {
				if(type == "Parties") {
					this.sortParties();
				} else {
					console.log(type);
					this.sort(eval("sort."+type));
					
				}
				kamer.update();
	},
	sort: function(sortFunction, keyFunction) {
		if(!keyFunction) {
			members.sort(sortFunction);
		} else {
			members = d3.nest().key(keyFunction).map(members);
			members = d3.values(members);
			members.sort(sortFunction);
			members = d3.merge(members);
		}
	},
	byName: function(a, b) {
		return a.Naam > b.Naam ? 1 : a.Naam < b.Naam ? -1 : 0;
	},
	byAge: function (a, b) {
		return a.Leeftijd > b.Leeftijd ? 1 : a.Leeftijd < b.Leeftijd ? -1 : sort.byName(a, b);
	},
	byCity: function(a, b) {
		return a.Woonplaats > b.Woonplaats ? 1 : a.Woonplaats < b.Woonplaats ? -1 : sort.byName(a, b);
	},
	byExp: function (a, b) {
		return parseInt(a.Ervaring) > parseInt(b.Ervaring) ? 1 : parseInt(a.Ervaring) < parseInt(b.Ervaring) ? -1 : sort.byName(a, b);
	},
	byParty: function (a, b) {
		return a.Partij > b.Partij ? 1 : a.Partij < b.Partij ? -1 : sort.byName(a, b);
	},
	sortParties: function () {
		this.sort(
			function(a, b) {
				if(a.length == b.length) {
					return sort.byParty(a[0], b[0]);
				} else {
					return b.length - a.length;
				}
			},
			function(member) { 
				return member.Partij;
			} 
		);
	}
};

var color = {
	partyColors: {
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
	},
	color: function(type) {
		if(type == "party") {
			this.setColorParty();
		} else if(type == "exp") {
			this.setColorExp();
		}
		kamer.update();
	},
	setColor: function(mapFunction, colorFunction) {
		for(ix in members) {
			members[ix].color = colorFunction(mapFunction(members[ix]));
		}
	},
	setColorParty: function() {
		this.setColor(function(member) { 
					return member.Partij; 
				}, function(party) { 
					return color.partyColors[party]; 
				});
	},
	setColorExp: function() {
		this.setColor(
			function(member) {
				return parseInt(member.Ervaring);
			},
			function(time) {
				return "rgb(" + Math.max(0, 200 - time/10) + "," + Math.min(200, (time - 1000) / 10) + ",0)"; 
			});			
	}
};

var membersize = {
	setSize: function(type) {
		calc = eval("this." + type);
		for(ix in members) {
			members[ix].size = calc(members[ix]);
		}
		kamer.update();
	},
	byExp: function(member) {
		return Math.min(10, parseInt(member.Ervaring) / 500) + 5; 
	},
	byAge: function(member) {
		return Math.min(15, parseInt(member.Leeftijd) / 5);
	}
};
