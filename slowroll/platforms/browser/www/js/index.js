
var base_url = 'http://slowrollbuffalo.mycodespace.net';
//var base_url = 'http://localhost:6577';

var app = {

	initialize: function() {
		this.bind_events();

		this.setup_plugins();
		
        //app.display_notification('Loaded!');

        // hide all pags to start
        $('.page').hide();

        // show the app!
        $('#pages').show();

        
	},

	bind_events: function() {

		// login screen login button click
		$('#page-login-login').on('click', function() {
			app.login(
				$('#page-login-email').val().toLowerCase().trim(),
				$('#page-login-password').val(),
				function(resp) {
					app._save_object('token', {'token': resp.token});
					app.post_login();
				},
				function() {
					// todo: show error popup
					alert('bad login!');
				}
			);
		});

		$('#page-login-register').on('click', function() {
			app.display_page('register');
		});

		$('#page-register-cancel').on('click', function() {
			app.display_page('login');
		});

		$('#page-register-submit').on('click', function() {
			var first = $('#page-register-first').val()
			var last = $('#page-register-last').val()
			var email = $('#page-register-email').val()
			var password1 = $.sha256($('#page-register-password1').val());
			var password2 = $.sha256($('#page-register-password2').val());

			if ( password1 != password2 ) {
				alert("Herm, looks like you didn't type the same password both times.  Try again.");
				return;
			}

			$.ajax({
				url: base_url + '/api/users/register',
				type: 'POST',
				data: JSON.stringify({
					first: first,
					last: last,
					email: email,
					password: password1
				}),
				success: function(resp) {
					alert("You're registered!  Check your email!");
					app.display_page('login');
				},
				error: function(resp) {
					// todo: figure out what the error was, and what
					//       we need to do.
				}
				
			});
			
		});		

	},

	setup_plugins: function() {

		//
		var watchId = navigator.geolocation.watchPosition(
			// success
			function(position) {
				var lat = position.coords.latitude;
				var lng = position.coords.longitude;
				var msg = '' + lat + ', ' + lng;
				//alert(msg);
				//app.display_notification(msg);
				app.check_for_partner_location();

			},
			// error
            function(error) {
            	var msg = 'oh noes, an error! : ' + error.message;
            	//alert(msg);
            	app.display_notification(msg);
            },
            // options
            { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
        );

	    // register call back for when a notification is triggered
	    cordova.plugins.notification.local.on('trigger', function (notification) {
            console.log('ontrigger', arguments);
            showToast('triggered: ' + notification.id);
        });

	    // register call back for user clicking on a notification
	    cordova.plugins.notification.local.on(
	    	"click",
	    	function (notification) {
    			alert(notification.text);
			}
		);

	},

	login: function(email, password, success, failure) {
        $.ajax({
            url: base_url + '/api/users/login',
            type: 'POST',
            //contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                email: email,
                password: $.sha256(password),
            }),
            success: function(resp) { success(resp); },
            error: function(resp) { failure(resp); }
        });
    },

	logout: function() {

	},


	post_login: function() {

		// show the ride list as our default page ( defaults to a loading icon )
        app.display_page('rides');

        // get the latest ride list from the server 
        app.get_rides()

		// get the latest partners list
		this.get_partners();

	},

	display_notification: function(text) {
		cordova.plugins.notification.local.schedule({
            id: 1,
            text: text,
            sound: null,
            data: {} //{ test: id }
        });
	},

	display_page: function(page) {
		$('.page').hide(500);
		switch(page) {
			case 'splash':
				$('.top-bar').hide();
				$('.tab-bar').hide();
				break;
			case 'login':
			case 'register':
				$('.top-bar').show();
				$('.tab-bar').hide();
				break;
			default:
				$('.top-bar').hide();
				$('.tab-bar').show();
				break;
		};
		$('#page-' + page).show(500); //'slide', {direction: 'left'}, 1400);
	},

	/****************************************************************
	 * save_object()
	 *
	 * This is a helper function that saves a object as json to 
	 * html4 local storage.
	 *
	 ****************************************************************/
	_save_object: function(name, object) {
		localStorage.setItem(name, JSON.stringify(object));
	},

	/****************************************************************
	 * load_object()
	 *
	 * This is a helper function that loads a object from local 
	 * storage and returns an object.
	 *
	 ****************************************************************/
	_load_object: function(name) {
		var json = localStorage.getItem(name);
		return JSON.parse(json);
	},

	/****************************************************************
	 * rides
	 *
	 * This is a list of the rides from the server.  This is updated
	 * by get_rides(), and then pushed to the UI with populate_rides()
	 *
	 ****************************************************************/
	rides: [],

	/****************************************************************
	 * get_rides()
	 *
	 * This grabs the rides list from the server, and stores them.
	 *
	 ****************************************************************/
	get_rides: function() {
		$.ajax({
			url: base_url + '/api/rides?token=' + app._load_object('token')['token'],
			type: 'GET',
			success: function(resp) {

				console.log('get_rides(), success');
				console.log(resp);

				// save them to the app var
				app.rides = resp;
				// save them to local storage
				app._save_object('rides', app.rides);
				// update the UI
				app.load_rides();
			},
			error: function(resp) {
				// todo: fail eligantly 
				console.log('get_rides(), error');
				console.log(resp);
			},
		});
	},

	/****************************************************************
	 * load_rides()
	 *
	 * This updats the rides list in the app UI.
	 *
	 ****************************************************************/
	load_rides: function() {
		var rides = app._load_object('rides');
		console.log('rides:');
		console.log(rides);
		var html = '';
		for(var i=0; i<rides.length; i++) {
			var ride = rides[i].ride;
			var sponsor = rides[i].sponsor;
			html += '<div class="ride-entry">';
            html += '    <span class="">' + ride.title + '</span><br>';
            html += '    <span><i class="fa fa-calendar-o"></i>' + ride.ride_datetime + '</span><br>';
            html += '    <span><i class="fa fa-map-marker"></i>' + ride.address_0 + '</span>';
        	html += '</div>';
		}
		$('#ride-list').html(html);
	},

	/****************************************************************
	 * rides
	 *
	 * This is a list of the rides from the server.  This is updated
	 * by get_rides(), and then pushed to the UI with populate_rides()
	 *
	 ****************************************************************/
	partners: [],

	/****************************************************************
	 * get_partners()
	 *
	 * This grabs the partner list from the server, and stores them.
	 *
	 ****************************************************************/
	get_partners: function() {

	},

	/***************************************************************
	 * check_for_partner_location()
	 * 
	 * This function checks to see if the current lat/lng is within
	 * any of the sponsor geo-fences.  If it is, it brings up a 
	 * notification to the user with the defined notification text.
	 *
	 ***************************************************************/
	check_for_partner_location: function(lat, lng) {

		for(var i=0; i<app.partners.length; i++) {
			
			var top_left_lat = partners[i].top_left_lat;
			var top_left_lng = partners[i].top_left_lng;
			var bottom_right_lat = partners[i].bottom_right_lat;
			var bottom_right_lng = partners[i].bottom_right_lng;
			notification_text = partners[i].notification_text;

			// dirty "point in box" calculation
			if ( top_left_lat + 90 > lat + 90 &&
				 top_left_lng + 180 < lng + 180 &&
				 bottom_right_lat + 90 < lat + 90 &&
				 bottom_right_lng +180 > lng + 180 ) 
			{

				app.display_notification(notification_text);
			}
		}
	}
};