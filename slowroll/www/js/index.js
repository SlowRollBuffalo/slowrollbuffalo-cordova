
var base_url = 'http://slowrollbuffalo.mycodespace.net';
//var base_url = 'http://localhost:6577';

// TODO: need to generate the correct platform based on what
//       platform we're actually on
//PLATFORM = 'android';

// taken from:
//   http://stackoverflow.com/a/46181
function validateEmail(email) {
	var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
	return re.test(email);
}

// taken from:
//   http://stackoverflow.com/a/1050782
Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}

var app = {

	initialize: function() {

		this.bind_events();

		this.setup_plugins();

		// first thing, try and login using the stored credentials ( if
		// they exist )

		var valid_credentials = app._load_object('valid_credentials');

		console.log('valid_credentials');
		console.log(valid_credentials);

		if ( valid_credentials != undefined && valid_credentials.valid ) {
			console.log('inside 0');
			var credentials = app._load_object('credentials');
			if ( credentials != undefined ) {
				console.log('inside 1');
				app.login(
					credentials.email, 
					credentials.password,
					function() { app.display_page('rides'); },
					function() { app.display_page('login', truue); }
				);
			}
			else {
				console.log('else 1');
				app.display_page('login', true);
			}
		} else {
			console.log('else 0');
			app.display_page('login', true);
		}
		
        //app.display_notification('Loaded!');

        // hide all pags to start
        //$('.page').hide();

        // after 2 seconds, hide the splash screen
        setTimeout( function() {
        	$('#splash-screen').fadeOut();
        	// show the app!
        	$('#pages').fadeIn();
        }, 750 );

        app.device = device.cordova;
        
	},

	bind_events: function() {

		//
		// back button
		//
		document.addEventListener(
			"backbutton", 
			function() {
				
				// back buttons are hard ...

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
						//
						// this gets fired too early, and the page isn't fully displayed yet.
						// need to figure out how to go about doing that.
						// 
					    /*
					    navigator.notification.confirm(
					        'Are you sure you want to exit?',  	// message
					        function(buttonIndex) {				// callback
					        	if ( buttonIndex == 0 )
					        		// exit app
					        		navigator.app.exitApp();
					        	else
					        		// do nothing, close dialog
					        		return;
					        },              
					        'Quit?',          					// title
					        'No,Yes'          					// buttonLabels
					    );
					    */
						break;
					case 'settings':
						app.display_page('rides');
						break;
					default:
						app.display_page('rides');
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
			var email = $('#page-login-email').val().toLowerCase().trim();
			var password = $('#page-login-password').val();
			
			$('#page-login-password').val('');

			app.login(
				email,
				$.sha256(password),
				function(resp) {
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

		//
		// Register Page
		//

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

			//$('#page-login-email').val(email);

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
					alert("Congratualtions, you're registered!");
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
		// Nav Menu
		//
		$('#dots-menu').on('click', function() {
			console.log('dots menu toggled.');
			$('#dots-menu-dropdown').toggle();
		});

		$(document).click(function (event) {
			console.log(event);
			if ( event.target.id != 'dots-menu-icon' )
				$('#dots-menu-dropdown').hide();
		});

		//
		// Navigation Links
		//

		$('#nav-link-rides').on('click', function() {
			//$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			$('#dots-menu-dropdown').hide();
			app.display_page('rides');
		});

		$('#nav-link-partners').on('click', function() {
			//$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			$('#dots-menu-dropdown').hide();
			app.display_page('partners');
		});

		$('#nav-link-settings').on('click', function() {
			//$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			$('#dots-menu-dropdown').hide();
			app.display_page('settings');
		});

		$('#nav-link-logout').on('click', function() {
			//$('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
			$('#dots-menu-dropdown').hide();

			app.invalidate_login();
			
			app.display_page('login');
		});		
	},

	invalidate_login: function() {
		app._save_object('credentials', {'email':'', 'password': ''});
		app._save_object('valid_credentials', {'valid': false});
		app._save_object('token', {'token': ''});
	},

	setup_plugins: function() {

		//
		/*
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
        */

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

		// save the credentials for use in the success callback
		app._email = email;
		app._password = password;

        $.ajax({
            url: base_url + '/api/users/login',
            type: 'POST',
            //contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                email: app._email,
                password: app._password,
                platform: device.platform,
                version: device.version
            }),
            success: function(resp) { 

            	// per the docs, the localStorage is sandboxed to the cordova
            	// app, so we can just save the login credentials there.

            	app._save_object('credentials', {'email': app._email, 'password': app._password});
            	app._save_object('token', {'token': resp.token});
            	app._save_object('valid_credentials', {'valid': true});

            	// no need to keep them around once they are saved to localStorage
            	app._email = undefined;
            	app._password = undefined;
            
            	success(resp); 
            },
            error: function(resp) { failure(resp); }
        });
    },

	logout: function() {

	},

	check_login: function(callback) {

		$.ajax({
			url: '/api/users/login',
			type: 'GET',
			success: function(resp) {
				if ( resp.loggedin == false ) {
					app.login(
						app._load_object('credentials')['email'],
						app._load_object('credentials')['password'],
						function() {
							if ( callback != undefined ) { callback(); }
						},
						function() {
							app.display_page('login');
						}
					);
				} else {
					if ( callback != undefined ) { callback(); }
				}
			},
			error: function() {
				 
			}
		});

		

	},

	checkin: function(ride_id, callback) {
		var payload = JSON.stringify({
			'ride_id': ride_id
		});
		console.log('checkin:');
		console.log(payload);
		$.ajax({
			url: base_url + '/api/checkins?token=' + app._load_object('token')['token'],
			type: 'POST',
			data: JSON.stringify({
				'ride_id': ride_id
			}),
			success: function(resp) { callback(); },
			error: function(resp) { app.display_page('login'); }
		})
	},

	post_login: function() {

		// show the ride list as our default page ( defaults to a loading icon )
        app.display_page('rides');

        // get the latest ride list from the server 
        app.get_rides();

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
	exit_attempt_count: 0, // this is a future hack ...

	display_page: function(page, immediate) {
		console.log('display_page(), page = "' + page + '"');
		app.current_page = page;
		if ( immediate == true )
			$('.page').hide();
		else
			$('.page').hide(300);
		switch(page) {
			case 'splash':
				//$('.top-bar').hide();
				//$('.tab-bar').hide();
				break;
			case 'login':
			case 'register':
				//$('.top-bar').show();
				//$('.tab-bar').hide();
				$('#menu-wrapper').hide();
				break;
			default:
				//$('.top-bar').hide();
				//$('.tab-bar').show();
				$('#menu-wrapper').show();
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
			$('#page-' + page).show(300);
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
		
		

		var now = new Date().getTime();

		var rides = app._load_object('rides');

		console.log('rides:');
		console.log(app.rides);

		var html = '';
		for(var i=0; i<rides.length; i++) {

			var ride = rides[i].ride;
			var sponsor = rides[i].sponsor;
			var start_time = new Date(ride.ride_datetime + ' 22:00:00').getTime();
			//console.log('start_time (string)');
			//console.log(start_time);
			//start_time.setTime(start_time.getTime() + ( (18+4) * 60 * 60 * 1000 ));
			//start_time = start_time
			//console.log('start_time (time)');
			//console.log(start_time);
			
			//console.log(start_time);
			html += '<div class="ride-entry">';
            html += '    <span class=""><b>' + ride.title + '</b></span><br>';
            html += '    <span><i class="fa fa-calendar-o"></i>' + ride.ride_datetime + '</span><br>';
            html += '    <span><i class="fa fa-map-marker"></i>' + ride.address_0 + '</span></br>';
            html += '    <span class="span-buffer">' + ride.city + ', ' + ride.zipcode + '</span><br/>';
            // need to check if we can check into the ride
            //console.log('---- math time ----');
            //console.log(start_time);
            //console.log(now);
            //console.log(Math.abs( start_time - now ));
            //console.log(Math.abs( start_time - now ) < ( 3600 * 1000 ));
            //console.log(( 3600 * 1000 ))
            // 1 hour +/- you can check in
            if ( Math.abs( start_time - now ) < ( 3600 * 1000 ) ) { 
            	html += '<br/><br/><button id = "' + ride.id + '">Time To Check In!</button>';
            }
        	html += '</div>';
		}

		// set the elements in the DOM
		$('#ride-list').html(html);

		// can't set the click call backs until the elements are in the DOM
		for(var i=0; i<rides.length; i++) {
			var ride = rides[i].ride;
			var start_time = new Date(ride.ride_datetime + ' 22:00:00').getTime();
			// if we're within an hour, setup the click event ( because the button has been added to the UI )
			if ( Math.abs( start_time - now ) < ( 3600 * 1000 ) ) { 
				$('#' + ride.id).on('click', function() {
					app.checkin(
						ride.id,
						// success
						function() {
							// todo: tell the user they checked in successfully.
							alert("You've been checked into the ride! Happy SlowRolling!");
						}
						// note: no error.  error will redirect to login screen
					);
				});
			}
		}

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
            html += '    <button id="' + partner.id + '" class="right more-partner-info"><i class="fa fa-info"></i></button>';
            html += '    <span class=""><b>' + partner.name + '</b></span><br/>';
            //html += '    <span class="">' + partner.level + '</span><br/>';
            html += '    <span><i class="fa fa-map-marker"></i>' + partner.address_0 + '</span><br/>';
            html += '    <span class="span-buffer">' + partner.city + ', ' + partner.zipcode + '</span><br/>';
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
		html += '<h2 class="">' + app.partner.name + '</h2>'
		//html += '<br/>';
        //html += '<h4>' + app.partner.level + '</h4><br/>';
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
			
			var top_left_lat = app.partners[i].top_left_lat;
			var top_left_lng = app.partners[i].top_left_lng;
			var bottom_right_lat = app.partners[i].bottom_right_lat;
			var bottom_right_lng = app.partners[i].bottom_right_lng;
			var notification_text = app.partners[i].notification_text;

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