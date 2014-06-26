$(function() {
	var parties = [
		['Bloc Qu\u00e9b\u00e9cois', 'deepskyblue'],
		['Conservative Party', 'blue'],
		['Green Party', 'green'],
		['Liberal Party', 'red'],
		['New Democratic Party', 'orange']
	];

	
	// enable new cartography and themes
	google.maps.visualRefresh = true;

	// create map centred on Canada
	var mapOptions = {
		center: new google.maps.LatLng(53, -95),
		zoom: 4,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
	var oldZoom = map.getZoom();
	var circles = [];

	// resize circles when zoom changed
	google.maps.event.addListener(map, 'zoom_changed', function(e) {
		var newZoom = map.getZoom();
		$.each(circles, function(i, circle) {
			circle.setRadius((circle.getRadius() * oldZoom) / newZoom);
		})
		oldZoom = newZoom;
	});
	
	
	// create a link for each party
	$.each(parties, function(i, pdata) {
		party = pdata[0];
		$('#partyList').append('<a>' + party + '</a>');
	});
	
	
	// load totals for each party and draw bars for each
	var totals = {};
	$.get('./results/totals.json', function(json) {
		var max = 1;
		for (party in json) {
			if (json[party] > max)
				max = json[party];
		}
		
		$.each(parties, function(i, pdata) {
			var party = pdata[0];
			var colour = pdata[1];
			var width = json[party] / max * 100;
			
			// format total amount as a currency string
			var total = (Number(json[party]) / 100).toFixed(2);
			var offset = total.length % 3;
			totals[party] = '$' + total.slice(0, offset);
			for (i = offset; i < total.length - 3; i += 3) {
				totals[party] += (i > 0 ? ',' : '') + total.slice(i, i + 3);
			}
			totals[party] += total.slice(-3);
			
			// create colour bar
			$('a:contains(' + party + ')').append($('<div>').css({
				width: '' + width + '%',
				backgroundColor: colour
			}));
		});
	});


	// load postal group amounts for each party and add circle function for each
	$.get('./results/postal_groups.json', function(json) {
		$.each(parties, function(i, pdata) {
			var party = pdata[0];
			var colour = pdata[1];
			
			var data = {party: party, colour: colour, amounts: json[party]}
			$('a:contains(' + party + ')').click(data, function(e) {
				e.preventDefault();
				
				$('a').removeClass('selected');
				$(this).addClass('selected');
				
				var colour = $('div', this).css('background-color');
				$('#info').show();
				$('#info h2').text($(this).text()).css('border-color', colour);
				$('#info #total').text(totals[party]).css('color', colour);
				
				draw_circles(e.data.party, e.data.colour, e.data.amounts);
			});
		});
	});
	
	
	// draw circles on the map for one party
	function draw_circles(party, colour, amounts) {
		var minSize = 20;
		var scale = 10;

		// Clear existing circles
		$.each(circles, function(i, circle) {
			circle.setMap(null);
		})

		// Add a circle to the map for each postal code.
		for (var i = 0; i < amounts.length; i++) {
			var amount = Number(amounts[i]['Amount']) / 100;
			var radius = (minSize + amount) * scale / oldZoom;
			
			var circleOptions = {
				strokeColor: colour,
				strokeOpacity: 1,
				strokeWeight: 1,
				fillColor: colour,
				fillOpacity: .25,
				map: map,
				center: new google.maps.LatLng(
						Number(amounts[i]['Lat']),
						Number(amounts[i]['Lng'])),
				radius: radius
			};
			circles.push(new google.maps.Circle(circleOptions));
		}
	}
});
