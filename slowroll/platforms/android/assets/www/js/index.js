
var base_url = 'http://slowrollbuffalo.mycodespace.net';
//var base_url = 'http://localhost:6577';

// TODO: need to generate the correct platform based on what
//       platform we're actually on
PLATFORM = 'android';

// taken from:
//   http://stackoverflow.com/a/46181
function validateEmail(email) {
	var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
	return re.test(email);
}

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

		//
		// back button
		//
		document.addEventListener(
			"backbutton", 
			function() {
				console.log('back button pressed.');
				switch(app.current_page) {
					case '':

						break;
					case 'login':
						// exit the app
						navigator.app.exitApp();
						break;
					case 'register':
						app.display_page('login');
						break;
					case 'partners':
						app.display_page('rides');
						break;
					case 'rides':
						alert('hi');
						// exit the app
					    navigator.notification.confirm(
					        'Are you sure you want to exit?',  	// message
					        function(buttonIndex) {				// callback
					        	console.log('inside');
					        	if ( buttonIndex == 1 )
					        		// exit app
					        		navigator.app.exitApp();
					        	else
					        		// do nothing, close dialog
					        		return;
					        },              
					        'Quit?',          					// title
					        'No,Yes'          					// buttonLabels
					    );
						break;
					case 'settings':
						app.display_page('rides');
						break;
					default:
						app.display_page('login');
						break;
				};
			},
			false
		);

		//
		// Login Page
		//

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

		//
		// Register Page
		//
		$('#page-login-register').on('click', function() {
			app.display_page('register');
		});

		$('#page-register-cancel').on('click', function() {
			app.display_page('login');
		});

		$('#page-register-submit').on('click', function() {
			var first = $('#page-register-first').val()
			var last = $('#page-register-last').val()
			var email = $('#page-register-email').val().toLowerCase().trim();
			var password1 = $.sha256($('#page-register-password1').val());
			var password2 = $.sha256($('#page-register-password2').val());

			if ( password1 != password2 ) {
				alert("Herm, looks like you didn't type the same password both times.  Try again.");
				return;
			}

			if ( first == '' || last == '' || !validateEmail(email) || password1 == '' || password2 == '') {
				alert("Yikes! Looks like you're missing some info to register.  Please try again.");
				return;
			}

			// get legal from the serve
			app.get_legal();

			// set our loading gears
			$('#legal-modal-contents').html('<center><img class="loading-icon" src="img/cube.gif"></img>');

			// display the modal
			$('#legal-modal').foundation('reveal', 'open');
			
		});

		$('#legal-modal-accept').on('click', function() {
			var first = $('#page-register-first').val()
			var last = $('#page-register-last').val()
			var email = $('#page-register-email').val().toLowerCase().trim();
			var password1 = $.sha256($('#page-register-password1').val());
			var password2 = $.sha256($('#page-register-password2').val());

		 	$('#legal-modal').html('<center><img class="" src="img/cube.gif"></img><h3>Registering you with SlowRoll Buffalo ...</h3></center>');

			$.ajax({
				url: base_url + '/api/users/register',
				type: 'POST',
				data: JSON.stringify({
					first: first,
					last: last,
					email: email,
					password: password1,
					platform: PLATFORM,
				}),
				success: function(resp) {
					$('#legal-modal').foundation('reveal', 'close');
					app.display_page('login');
					alert("You're registered!  Check your email!");
				},
				error: function(resp) {
					// todo: figure out what the error was, and what
					//       we need to do.
				}
				
			});
		});

		$('#legal-modal-cancel').on('click', function() {
			$('#legal-modal').foundation('reveal', 'close');
		});

		//
		// Navigation Links
		//

		$('#nav-link-rides').on('click', function() {
			$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			app.display_page('rides', true);
		});

		$('#nav-link-partners').on('click', function() {
			$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			app.display_page('partners', true);
		});

		$('#nav-link-settings').on('click', function() {
			$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			app.display_page('settings', true);
		});

		$('#nav-link-logout').on('click', function() {
			$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			// todo: invalidate credentials locally
			app.display_page('login', false);
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
                platform: PLATFORM
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
        app.get_rides();
        app.get_partners();

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

	current_page: '',

	display_page: function(page, immediate) {
		app.current_page = page;
		if ( immediate == true )
			$('.page').hide();
		else
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

		switch(page) {
			case 'rides':
				app.get_rides();
				break;
			case 'partners':
				app.get_partners();
				break;
			default:
				break;
		};

		if ( immediate == true )
			$('#page-' + page).show();
		else
			$('#page-' + page).show(500);
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

	legal: {},

	/****************************************************************
	 * get_legal()
	 *
	 * This grabs the legal document from the server, and stores it.
	 *
	 ****************************************************************/
	get_legal: function() {
		$.ajax({
			url: base_url + '/api/users/legal',
			type: 'GET',
			success: function(resp) {

				// save them to the app var
				app.legal = resp;
				// save them to local storage
				app._save_object('legal', app.legal);
				// update the UI
				app.load_legal();

			},
			error: function(resp) {

			}
		});
	},

	/****************************************************************
	 * load_legal()
	 *
	 * This updats the legal document contents in the UI
	 *
	 ****************************************************************/
	load_legal: function() {
		var html = '';
		html += app.legal.legal_notice;
		$('#legal-modal-contents').html(html);
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

				//console.log('get_rides(), success');
				//console.log(resp);

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
		//console.log('rides:');
		//console.log(rides);
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
	 * partners
	 *
	 * This is a list of the partners from the server.  This is updated
	 * by get_partners(), and then pushed to the UI with load_partners()
	 *
	 ****************************************************************/
	partners: [],

	/****************************************************************
	 * get_partners()
	 *
	 * This grabs the partner list from the server, and stores them.
	 *
	 ****************************************************************/
	get_partners: function(callback) {

		console.log('get_partners()');

		$.ajax({
			url: base_url + '/api/partners?token=' + app._load_object('token')['token'],
			type: 'GET',
			success: function(resp) {

				//console.log('get_partners(), success');
				//console.log(resp);

				// save them to the app var
				app.partners = resp;
				// save them to local storage
				app._save_object('partners', app.partners);
				// update the UI
				app.load_partners();
				// do call back
				if ( callback != undefined )
					callback(resp);
			},
			error: function(resp) {
				// todo: fail eligantly 
				console.log('get_partners(), error');
				console.log(resp);
			},
		});
	},

	/****************************************************************
	 * load_partners()
	 *
	 * This updats the partner list in the app UI.
	 *
	 ****************************************************************/
	load_partners: function() {
		var partners = app._load_object('partners');
		console.log('load_partners()');
		//console.log(partners);
		var html = '';
		for(var i=0; i<partners.length; i++) {
			var partner = partners[i];
			html += '<div class="partner-entry">';
			html += '    <button id="' + partner.id + '" class="right">More Info</button>';
            html += '    <span class="">' + partner.name + '</span><br/>';
            html += '    <span class="">' + partner.level + '</span><br/>';
            html += '    <span><i class="fa fa-map-marker"></i>' + partner.address_0 + '</span><br/>';
            html += '    <span class="span-buffer">' + partner.city + ', ' + partner.zipcode + '</span>';
        	html += '</div>';

        	

		}

		// hide, and render the div ( note: this UX could be TERRIBLE for slow phones ...)
		$('#partner-list').hide();
		$('#partner-list').html(html);

		// the elements need to be in the DOM before we can apply the click event hooks
		for( var i=0; i<partners.length; i++) {
			
        	var partner = partners[i];

			console.log('registering click event for "' + partner.id + '"');

        	$('#' + partner.id).on('click', function() {
        		console.log('click!');
        		app.display_page('partner');
        		var partner_id = this.id;
        		//app.get_partners(function(resp) {
        			for(var i=0;i<app.partners.length;i++) {
        				if ( app.partners[i].id == partner_id ) {
        					app.partner = app.partners[i];
        					app.load_partner();
        				}
        			}
        		//});
        	});
		}

		// show the div
		$('#partner-list').show();
	},

	/****************************************************************
	 * partner
	 *
	 * This is the current parter than the user has requested to get
	 * more information about
	 *
	 ****************************************************************/
	partner: {},

	/****************************************************************
	 * load_partner()
	 *
	 * This updats the partner info in the app UI.
	 *
	 ****************************************************************/
	load_partner: function() {
		console.log('load_parter(), id = ' + app.partner.id);
		console.log(app.partner);
		var html = '';
		html += '<h2>' + app.partner.name + '</h2>'
		html += '<br/>';
        html += '<h4>' + app.partner.level + '</h4><br/>';
        html += '<span><i class="fa fa-map-marker"></i>' + app.partner.address_0 + '</span><br/>';
        html += '<span class="span-buffer">' + app.partner.city + ', ' + app.partner.zipcode + '</span>';
        html += '<hr/>';
		html += app.partner.description;
		$('#partner-info').html(html);
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