var kamer = {
	w: 800,
	h: 400,

	init: function() {
		d3.csv("kamerleden.csv", function(members) {
			this.members = members;
		
			var groups = d3.select("#kamer").selectAll("g")
							.data(members, function(member) { return member.Naam; })
							.enter()
							.append("g")
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
								d3.select("#membermtotal").text(member.TotaalAantalMoties);
								d3.select("#membermdone").text(member.AangenomenMoties);
								
								if(!interactions.selected) {
									d3.select("#memberteam").text("");
									d3.select("#memberteamnr").text("");
								} else {
									d3.select("#memberteam").text("Ingediende moties met " + selectedmember + ":");
									nr = interactions.selected[member.Naam];
									if(!nr) nr = 0;
									d3.select("#memberteamnr").text(nr);
								}
							})
							.on("mouseout", function(member) {
								d3.select("#memberinfo").style("display", "none");
							})
							.on("click", function(member) {
								for(ix in members) members[ix].selected = false;
								member.selected = true;
								selectedmember = member.Naam;
								
								interactions.clicked(member);
								
								sort.sortBy();
								membersize.setSize();
								
								kamer.generateTagCloud(member);
							})
			groups.append("circle")
					.classed("out", true)
					.attr("stroke", "#333")
					.attr("fill-opacity", 0.5);
			groups.append("circle").classed("in", true);
								
			color.setColorParty();
			sort.sortBy("byPlace");
			membersize.setSize("byExp");
			kamer.update();
			
			interactions.init();
		});
	},
	
	update: function() {
		var groups = d3.selectAll("g")
			.data(members, function(member) { return member.Naam; });
		
		groups.select(".out").transition().duration(500)
			.attr("r", function(member) { 
				return member.size;
			})
			.attr("fill", function(member) {
				return member.color;
			})
			.attr("stroke-width", function(member) {
				return member.selected ? 5 : 0;
			})
			.attr("cx", function(member, ix) { 
				return sort.positions[ix].x;
			})
			.attr("cy", function(member, ix) { 
				return sort.positions[ix].y; 
			});
		groups.select(".in").transition().duration(500)
			.attr("r", function(member) { 
				return member.size * member.fill;
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
		d3.select("#wordcloud").selectAll("text").remove();
		d3.xml(member["Positie rev1"] + ".xml", "text/xml",
			function(data) {
				if(!data) return;
				words = new Array();
				tags = data.getElementsByTagName("tag");

				totalWeight = 0;				
				
				for(ix in tags) {
					weight = tags[ix].attributes["weight"].nodeValue;
					totalWeight += parseFloat(weight);
					words.push({text: tags[ix].lastChild.data, size: weight });
					if(words.length > 50) break;
				}
				
				factor = 1000 / totalWeight;
				
				for(ix in words) {
					words[ix].size = words[ix].size * factor;
				}
				
				d3.layout.cloud().size([600, 300])
					.words(words)
	      			.rotate(0)
	      			.fontSize(function(d) { return d.size; })
	      			.on("end", function(words) {
	      				d3.select("#wordcloud")
							.selectAll("text")
							.data(words)
							.enter()
							.append("text")
							.attr("text-anchor", "middle")
							.attr("transform", function(d) {
								return "translate(" + [d.x + 400, d.y + 150] + ")rotate(" + d.rotate + ")";
							})
							.text(function(d) { return d.text; })
							.transition()
							.delay(500)
							.style("font-size", function(d) { return d.size + "px"; });
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
		if(!type) {
			type = this.currenttype;
		}
		if(type == "Parties") {
			this.sortParties();
		} else {
			this.sort(eval("sort."+type));
		}
		this.currenttype = type;
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
	byPlace: function(a, b) {
		return parseInt(a["Positie rev1"]) > parseInt(b["Positie rev1"]) ? 1 : parseInt(a["Positie rev1"]) < parseInt(b["Positie rev1"]) ? -1 : 0;
	},
	byAge: function (a, b) {
		return a.Leeftijd > b.Leeftijd ? 1 : a.Leeftijd < b.Leeftijd ? -1 : sort.byPlace(a, b);
	},
	byCity: function(a, b) {
		return a.Woonplaats > b.Woonplaats ? 1 : a.Woonplaats < b.Woonplaats ? -1 : sort.byPlace(a, b);
	},
	byExp: function (a, b) {
		return parseInt(a.Ervaring) > parseInt(b.Ervaring) ? 1 : parseInt(a.Ervaring) < parseInt(b.Ervaring) ? -1 : sort.byPlace(a, b);
	},
	byParty: function (a, b) {
		return a.Partij > b.Partij ? 1 : a.Partij < b.Partij ? -1 : sort.byPlace(a, b);
	},
	byMotie: function (a, b) {
		x = parseInt(a.TotaalAantalMoties);
		if(!x) x = 0;
		y = parseInt(b.TotaalAantalMoties);
		if(!y) y = 0;
		return x > y ? 1 : x < y ? -1 : sort.byPlace(a, b);
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
		if(!type) {
			type = this.currenttype;
		}
		calc = eval("this." + type);
		for(ix in members) {
			c = calc(members[ix]);
			members[ix].size = c[0];
			members[ix].fill = c[1];
		}
		this.currenttype = type;
		kamer.update();
	},
	byExp: function(member) {
		return [Math.min(10, parseInt(member.Ervaring) / 500) + 5, 1]; 
	},
	byAge: function(member) {
		return [Math.min(15, parseInt(member.Leeftijd) / 5), 1];
	},
	byMotie: function(member) {
		tot = parseInt(member.TotaalAantalMoties);
		part = parseInt(member.AangenomenMoties) / tot;
		if(isNaN(tot)) {
			tot = 0;
			part = 0;
		}
		return [tot / 15 + 3, part];
	},
	byFriends: function(member) {
		if(member.selected) return [15, 1];
		nr = interactions.selected[member.Naam];
		if(!nr) nr = 0;
		max = interactions.max == 0 ? 1 : interactions.max;
		return [5 + 10 * (nr / max), 1];
	}
};

var interactions = {
	init: function() {
		this.interactionMap = new Array();
		d3.csv("interacties.csv", function(interactions) {
			for(ix in interactions) {
				x = interactions[ix];
				nr = parseInt(x.AantalInteracties);
				if(isNaN(nr)) nr = 0;
				if(!this.interactions.interactionMap[x.Naam1]) this.interactions.interactionMap[x.Naam1] = new Array();
				this.interactions.interactionMap[x.Naam1][x.Naam2] = nr;
			}
		});
	},
	clicked: function(member) {
		this.selected = this.interactionMap[member.Naam];
		this.max = 0;
		for(ix in this.selected) {
			if(this.max < this.selected[ix]) {
				this.max = this.selected[ix];
			}
		}
	}
};