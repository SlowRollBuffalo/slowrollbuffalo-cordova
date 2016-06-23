
var base_url = 'http://slowrollbuffalo.mycodespace.net';
//var base_url = 'http://localhost:6577';

var SENDER_ID = '575804731367';

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

		console.log('app.initialize(), start.');

		//this.push_init();

		this.bind_events();

		this.setup_plugins();

		// first thing, try and login using the stored credentials ( if
		// they exist )

		var valid_credentials = app._load_object('valid_credentials');

		if ( valid_credentials != undefined && valid_credentials.valid ) {
			var credentials = app._load_object('credentials');
			if ( credentials != undefined ) {
				app.login(
					credentials.email, 
					credentials.password,
					function() {
						app.display_page('rides');
					},
					function() {
						app.display_page('login');
					}
				);
			}
			else {
				app.display_page('login', true);
			}
		} else {
			app.display_page('login', true);
		}
		
        //app.display_notification('Loaded!');

        // hide all pags to start
        //$('.page').hide();

        /*
        // after a delay, hide the splash screen
        setTimeout( function() {
        	//$('#splash-screen').fadeOut();
        	$('#splash-screen').hide();
        	// show the app!
        	//$('#pages').fadeIn();
        	$('#pages').show();
        }, 750 );
		*/

        app.device = device.cordova;

        console.log('app.initialize(), exit.');
        
	},

	push: {},

    init_push_notifications: function() {

    	console.log('app.push_init(), start.');

    	app.push = PushNotification.init({
		    android: {
		        senderID: SENDER_ID,
		    },
		    ios: {
		        alert: "true",
		        badge: "true",
		        sound: "true"
		    },
		    windows: {}
		});

		app.push.on('registration', function(data) {
		    // data.registrationId
		    //console.log('app.push.on(\'registration\'), registrationId: ' + data.registrationId);
		    //alert('app.push.on(\'registration\'), registrationId: ' + data.registrationId);

		    app.user.google_registration_id = data.registrationId;

		    alert('registering user id: ' + app.user.id);

		    $.ajax({
		    	'url': base_url + '/api/users/' + app.user.id + '/push_registration',
		    	'type': 'PUT',
		    	'data': JSON.stringify({
		    		google_registration_id: data.registrationId,
		    	}),
		    	success: function(resp) {
		    		alert('push registration with server successful.');
		    	}, 
		    	error: function(resp) {
		    		alert('push registration with server failure.  status: ' + resp.status);
		    	}

		    });
		});

		app.push.on('notification', function(data) {
		    // data.message,
		    // data.title,
		    // data.count,
		    // data.sound,
		    // data.image,
		    // data.additionalData
		    console.log('app.push.on(\'notification\'): ', data);
		    alert('app.push.on(\'notification\'), title: ' + data.title + ', message: ' + data.message);
		});

		app.push.on('error', function(error) {
		    // e.message
		    console.log('app.push.on(\'error\'):', error);
		    alert('app.push.on(\'error\'):', error);
		});

		console.log('app.push_init(), end.');

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

						// this will have to do for now ...
						navigator.app.exitApp();
						
						//app.display_page('rides');
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
					case 'ride':
					case 'partner':
					case 'settings':
						app.display_page(app.previous_page);
						break;
					default:
						app.display_page('rides');
						break;
				};
				
			},
			false
		);

		//
		// Swiping
		//

		// handle swip right
	    $( document ).on( "swipeleft", function( event ) {
	    	console.log('swipeleft!, current page = ' + app.current_page);
	    	//alert('swipeleft');
	        switch( app.current_page ) {
	        	case 'login':
	        		break;
	        	case 'register':
	        		break;
	        	case 'rides':
	        		app.display_page('partners');
	        		break;
	        	case 'partners':
	        		break;
	        	case 'partner':
	        		break;
	        	case 'settings':
	        		break;
	        	case '':
	        	default:
	        		break;
	        };
	    });

	    // handle swip right
	    $( document ).on( "swiperight", function( event ) {
	    	console.log('swiperight!, current page = ' + app.current_page);
	    	//alert('swipeleft');
	        switch( app.current_page ) {
	        	case 'login':
	        		break;
	        	case 'register':
	        		app.display_page('login');
	        		break;
	        	case 'rides':
	        		break;
	        	case 'partners':
	        		app.display_page('rides');
	        		break;
	        	case 'partner':
	        		app.display_page('partners');
	        		break;
	        	case 'settings':
	        		// not sure if this makes sense ... but we'll keep it for now
	        		app.display_page(app.previous_page);
	        		break;
	        	case '':
	        	default:
	        		break;
	        };
	    });

	    /*
	    // handle swip down
	    $( document ).on( "swipedown", function( event ) {
	    	console.log('swipedown!, current page = ' + app.current_page);
	    	//alert('swipedown');
	        switch( app.current_page ) {
	        	case 'login':
	        		break;
	        	case 'register':
	        		break;
	        	case 'rides':
	        		$('#rides-list').html('<center id="loading-gears"><img class="loading-icon" src="img/gears.svg"></img></center>');
	        		app.get_rides();
	        		break;
	        	case 'partners':
	        		app.get_partners();
	        		break;
	        	case 'partner':
	        		break;
	        	case 'settings':
	        		break;
	        	case '':
	        	default:
	        		break;
	        };
	    });
		*/

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
					alert("The email and passwored you entered did not match.  Please try again.");
				}
			);
		});

		$('#page-login-register').on('click', function() {
			app.display_page('register');
		});

		$('#page-register-first').focus(function() {$(this).removeClass('bad-input')});
		$('#page-register-last').focus(function() {$(this).removeClass('bad-input')});
		$('#page-register-email').focus(function() {$(this).removeClass('bad-input')});
		$('#page-register-password1').focus(function() {$(this).removeClass('bad-input')});
		$('#page-register-password2').focus(function() {$(this).removeClass('bad-input')});

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

			$('#page-register-first').removeClass('bad-input');
			$('#page-register-last').removeClass('bad-input');
			$('#page-register-email').removeClass('bad-input');
			$('#page-register-password1').removeClass('bad-input');
			$('#page-register-password2').removeClass('bad-input');

			if ( password1 != password2 ) {
				alert("Herm, looks like you didn't type the same password both times.  Try again.");
				return;
			}

			var bad_input = false;

			if ( first == '' ) {
				$('#page-register-first').addClass('bad-input');
				bad_input = true;
			}

			if ( last == '' ) {
				$('#page-register-last').addClass('bad-input');
				bad_input = true;
			}

			if ( !validateEmail(email) ) {
				$('#page-register-email').addClass('bad-input');
				bad_input = true;
			}

			if ( $('#page-register-password1').val() == '' || $('#page-register-password2').val() == '' ) {
				$('#page-register-password1').addClass('bad-input');
				$('#page-register-password2').addClass('bad-input');
				bad_input = true;
			}

			//if ( first == '' || last == '' || !validateEmail(email) || password1 == '' || password2 == '') {
			if ( bad_input ) {
				alert("Yikes! Looks like you're missing some info to register.  Please try again.");
				return;
			}

			// save the new registered creds as the default login
			app._save_object('credentials', {'email': email, 'password': password1});
        	//app._save_object('token', {'token': resp.token});
        	//app._save_object('valid_credentials', {'valid': true});

			// get legal from the serve
			app.get_legal();

			// set our loading gears
			$('#legal-modal-contents').html('<center><img class="loading-icon" src="img/gears.svg"></img>');

			// display the modal
			//$('#legal-modal').foundation('reveal', 'open');
			$('#legal-modal').reveal({
				// modal config
			});
		});

		$('#legal-modal-accept').on('click', function() {
			var first = $('#page-register-first').val()
			var last = $('#page-register-last').val()
			var email = $('#page-register-email').val().toLowerCase().trim();
			var password1 = $.sha256($('#page-register-password1').val());
			var password2 = $.sha256($('#page-register-password2').val());

			//$('#page-login-email').val(email);

		 	$('#legal-modal').html('<center><img class="" src="img/gears.svg"></img><h3>Registering you with Slow Roll Buffalo ...</h3></center>');

			$.ajax({
				url: base_url + '/api/users/register',
				type: 'POST',
				data: JSON.stringify({
					first: first,
					last: last,
					email: email,
					password: password1,
					//platform: device.platform,
                	//version: device.version
				}),
				success: function(resp) {
					console.log(resp);
					//$('#legal-modal').foundation('reveal', 'close');
					$('#legal-modal').trigger('reveal:close');
					app.check_login(
						function() {
							app.display_notification('Registration successful!');
							app.display_page('rides');
						}
					)

				},
				error: function(resp) {
					// todo: figure out what the error was, and what
					//       we need to do.
					alert("Looks like that email address is already registered.  Try logging in with that email address and password.");
					$('#legal-modal').trigger('reveal:close');
					app.display_page('login');
				}
				
			});
		});

		$('#legal-modal-cancel').on('click', function() {
			//$('#legal-modal').foundation('reveal', 'close');
			$('#legal-modal').trigger('reveal:close');
		});

		//
		// Nav Menu
		//
		$('#gear-menu').on('click', function() {
			console.log('gears menu toggled.');
			$('#gear-menu-dropdown').toggle();
		});

		$('#refresh-menu').on('click', function() {
			console.log('refresh menu toggled.');
			$('#refresh-icon-overlay').show();
			switch(app.current_page) {
				case 'rides':
					app.get_rides();
					break;
				case 'partners':
					app.get_partners();
					break;
				case '':
				default:
					break;
			}
		});		

		$(document).click(function (event) {
			//console.log(event);
			if ( event.target.id != 'gear-menu' )
				$('#gear-menu-dropdown').hide();
		});

		//
		// Partner Page
		//

		$('#page-partner-back').on('click', function() {
			app.display_page('partners');
		});

		//
		// Ride Page
		//

		$('#page-ride-back').on('click', function() {
			app.display_page('rides');
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

		//
		// Settings Page
		//

		$('#page-settings-back').on('click', function() {
			app.display_page(app.previous_page);
		});

		// on "first boot" we'll set allow partner notications to true
		if ( app._load_object('allow-partner-notifications') == null ) {
			app._save_object('allow-partner-notifications', {allow: true});
			$('#page-settings-allow-new-ride-notifications').prop('data-cacheval', false);
			$('#page-settings-allow-new-ride-notifications-label').addClass('ui-checkbox-on');
			$('#page-settings-allow-new-ride-notifications-label').removelass('ui-checkbox-off');
		}
		$('#page-settings-allow-partner-notifications').change(function() {

			// allow partner notifications
			var checked = $('#page-settings-allow-partner-notifications').is(':checked');
			app._save_object('allow-partner-notifications', {allow: checked});

			console.log('saved "allow-partner-notifications" as ', checked);
		});

		// on "first boot" we'll set allow new ride notications to true
		if ( app._load_object('allow-new-ride-notifications') == null ) {
			app._save_object('allow-new-ride-notifications', {allow: true});
			$('#page-settings-allow-new-ride-notifications').prop('data-cacheval', false);
			$('#page-settings-allow-new-ride-notifications-label').addClass('ui-checkbox-on');
			$('#page-settings-allow-new-ride-notifications-label').removeClass('ui-checkbox-off');
		}
		$('#page-settings-allow-new-ride-notifications').change(function() {

			// allow new ride notifications
			var checked = $('#page-settings-allow-new-ride-notifications').is(':checked');
			app._save_object('allow-new-ride-notifications', {allow: checked});

			console.log('saved "allow-new-ride-notifications" as ', checked);
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

	user: {},

	login: function(email, password, success, failure) {

		// save the credentials for use in the success callback
		app._email = email;
		app._password = password;

		console.log('app.login() start.');

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

            	console.log('app.login().success: ', resp);

            	app.user = resp;
            	app.init_push_notifications();

            	app._save_object('credentials', {'email': app._email, 'password': app._password});
            	app._save_object('token', {'token': resp.token});
            	app._save_object('valid_credentials', {'valid': true});

            	// no need to keep them around once they are saved to localStorage
            	app._email = undefined;
            	app._password = undefined;
            
            	success(resp); 
            },
            error: function(resp) { 
            	console.log('app.login.error(), resp.status = ' + resp.status);
            	failure(resp);
            }
        });
    },

	logout: function() {

	},

	check_login: function(callback) {

		$.ajax({
			url: base_url + '/api/users/login',
			type: 'GET',
			success: function(resp) {

				console.log('app.check_login().success: ', resp);

				if ( resp.loggedin == false ) {
					app.login(
						app._load_object('credentials')['email'],
						app._load_object('credentials')['password'],
						function() {
							app.user = resp.user;
							app.init_push_notifications();
							if ( callback != undefined ) { callback(); }
						},
						function() {
							$('#refresh-icon-overlay').hide();
							app.display_page('login');
						}
					);
				} else {
					app.user = resp.user;
					app.init_push_notifications();
					if ( callback != undefined ) { callback(); }
				}
			},
			error: function() {
				 console.log('app.check_login().error: ', resp);
			}
		});

		

	},

	checkin: function(ride_id, callback) {
		console.log('app.checkin(), start.');
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
			success: function(resp) { 
				console.log('successful checkin!');
				callback();
			},
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

	previous_page: '',
	current_page: '',
	exit_attempt_count: 0, // this is a future hack ...

	display_page: function(page, immediate) {

		console.log('display_page(), page = "' + page + '"');

		$('#refresh-icon-overlay').hide();

		app.previous_page = app.current_page;
		app.current_page = page;
		if ( immediate == true )
			$('.page').hide();
		else
			$('.page').hide();
		switch(page) {
			case 'splash':
				//$('#top-bar-area').hide();
				$('.header-nav-wrapper').hide();
				//$('.top-bar').hide();
				//$('.tab-bar').hide();
				break;
			case 'login':
				//$('#top-bar-area').hide();
				$('.header-nav-wrapper').hide();
				//$('#menu-wrapper').hide();
				break;
			case 'register':
				$('.header-nav-wrapper').hide();
				//$('.top-bar').show();
				//$('.tab-bar').hide();
				//$('#menu-wrapper').hide();
				break;
			case 'ride':
				$('.header-nav-wrapper').hide();
				break;
			case 'partner':
				$('.header-nav-wrapper').hide();
				break;
			case 'settings':
				$('.header-nav-wrapper').hide();
				break;
			case '':
			default:
				console.log('app.display_page(), showing header/nav');
				//$('.top-bar').hide();
				//$('.tab-bar').show();
				//$('#top-bar-area').show();
				//$('#menu-wrapper').show();
				$('.header-nav-wrapper').show();
				break;
		};

		$('#nav-link-rides').removeClass('ui-btn-active');
		$('#nav-link-partners').removeClass('ui-btn-active');

		switch(page) {
			case '':
			case 'rides':
				$('#nav-link-rides').addClass('ui-btn-active');
				app.get_rides();
				break;
			case 'ride':
				// none
				break;
			case 'partners':
				$('#nav-link-partners').addClass('ui-btn-active');
				app.get_partners();
				break;
			case 'partner':
				// none
				break;
			case 'settings':

				var allow = app._load_object('allow-new-ride-notifications')['allow'];
				console.log('allow-new-ride-notifications = ' + allow);
				$('#page-settings-allow-new-ride-notifications').prop('checked', allow);
				$('#page-settings-allow-new-ride-notifications').prop('data-cacheval', !allow);
				var str_allow_add = ((allow == true) ? 'on' : 'off' );
				var str_allow_remove = ((allow == true) ? 'off' : 'on' );
				$('#page-settings-allow-new-ride-notifications-label').addClass('ui-checkbox-' + str_allow_add);
				$('#page-settings-allow-new-ride-notifications-label').removeClass('ui-checkbox-' + str_allow_remove);

				var allow = app._load_object('allow-partner-notifications')['allow'];
				console.log('allow-partner-notifications = ' + allow);
				$('#page-settings-allow-partner-notifications').prop('checked', allow);
				$('#page-settings-allow-partner-notifications').prop('data-cacheval', !allow);
				var str_allow_add = ((allow == true) ? 'on' : 'off' );
				var str_allow_remove = ((allow == true) ? 'off' : 'on' );
				$('#page-settings-allow-partner-notifications-label').addClass('ui-checkbox-' + str_allow_add);
				$('#page-settings-allow-partner-notifications-label').removeClass('ui-checkbox-' + str_allow_remove);
				

				break;
			default:
				break;
		};

		//if ( immediate == true )
		//	$('#page-' + page).show();
		//else
		//	$('#page-' + page).show(300);

		console.log('app,display_page(), showing page: ' + page);

		//$('#page-' + page).animate({width:'toggle'},350);
		$('#page-' + page).show();

		$('#loading-gears').hide();

		$('.pages').show();

	},

	/****************************************************************
	 * _save_object()
	 *
	 * This is a helper function that saves a object as json to 
	 * html4 local storage.
	 *
	 ****************************************************************/
	_save_object: function(name, object) {
		localStorage.setItem(name, JSON.stringify(object));
	},

	/****************************************************************
	 * _load_object()
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


	render_datetime: function(datetime) {
		var str_datetime;

		// comes in YYYY-MM-DD HH:MM:SS with HH being 24 hour format

		var year = datetime.split(' ')[0].split('-')[0];
		var month = datetime.split(' ')[0].split('-')[1];
		var day =datetime.split(' ')[0].split('-')[2];
		var hour = datetime.split(' ')[1].split(':')[0];
		var minute = datetime.split(' ')[1].split(':')[1];
		var am_pm = ((parseInt(hour) > 11) ? 'PM' : 'AM');

		str_datetime = month + '/' + day + '/' + year + ' ' + hour + ':' + minute + ' ' + am_pm;

		return str_datetime;
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
				app.display_page('login');
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
		console.log(rides);

		var html = '';
		for(var i=0; i<rides.length; i++) {

			var ride = rides[i].ride;
			var sponsor = rides[i].sponsor;
			var start_time = new Date(ride.ride_datetime + ' 22:00:00').getTime();
			
			html += '<div class="ride-entry">';

			// check if we're within 1 hour before or after the ride starts
            //if ( Math.abs( start_time - now ) < ( 3600 * 1000 ) ) { 
            //	// display the checkin button
            //	html += '<button id = "' + ride.id + '" class="right">Check In!</button>';
            //}
            html += '    <button id="' + ride.id + '" class="right more-ride-info"><i class="fa fa-info"></i></button>';
            html += '    <span class=""><b>' + ride.title + '</b></span><br>';
            html += '    <span><i class="fa fa-calendar-o"></i>' + app.render_datetime(ride.ride_datetime) + '</span><br>';
            html += '    <span><i class="fa fa-map-marker"></i>' + ride.address_0 + '</span></br>';
            html += '    <span class="span-buffer">' + ride.city + ', ' + ride.zipcode + '</span><br/>';
            
            
        	html += '</div>';
		}

		// set the elements in the DOM
		$('#ride-list').hide();
		$('#ride-list').html(html);

		// the elements need to be in the DOM before we can apply the click event hooks
		for( var i=0; i<rides.length; i++) {
			
        	var ride = rides[i];

			console.log('load_rides(), registering click event for "' + ride.ride.id + '"');
			console.log('load_rides, ride:', ride.ride);

        	$('#' + ride.ride.id).on('click', function() {
        		console.log('click!');
        		app.display_page('ride');
        		var ride_id = this.id;
        		//app.get_partners(function(resp) {
        			for(var j=0;j<app.rides.length;j++) {
        				if ( app.rides[j].ride.id == ride_id ) {
        					app.ride = app.rides[j];
        					app.load_ride();
        					break;
        				}
        			}
        		//});
        	});
		}


		/*
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
							alert("You've been checked into the ride! Happy Slow Rolling!");
						}
						// note: no error.  error will redirect to login screen
					);
				});
			}
		}
		*/

		$('#ride-list').show();

		$('#refresh-icon-overlay').hide();

	},

	/****************************************************************
	 * ride
	 *
	 * This is the current ride than the user has requested to get
	 * more information about
	 *
	 ****************************************************************/
	ride: {},

	/****************************************************************
	 * load_ride()
	 *
	 * This updats the ride info in the app UI.
	 *
	 ****************************************************************/
	load_ride: function() {
		console.log('load_ride(), id = ' + app.ride.ride.id, 'ride: ', app.ride);
		var html = '';
		html += '<div id="ride-info">';
		html += '<h2 class="">' + app.ride.ride.title + '</h2>'
		
		//html += '<br/>';
        //html += '<h4>' + app.ride.level + '</h4><br/>';
        //html += '<span><i class="fa fa-map-marker"></i>' + app.ride.address_0 + '</span><br/>';
        //html += '<span class="span-buffer">' + app.ride.city + ', ' + app.ride.zipcode + '</span>';
        //html += '</div>';
        
        html += '<span class=""><b>' + app.ride.ride.title + '</b></span><br>';
        html += '<span><i class="fa fa-calendar-o"></i>' + app.render_datetime(app.ride.ride.ride_datetime) + '</span><br>';
        html += '<span><i class="fa fa-map-marker"></i>' + app.ride.ride.address_0 + '</span></br>';
        html += '<span class="span-buffer">' + app.ride.ride.city + ', ' + app.ride.ride.zipcode + '</span><br/>';
      
      	var now = new Date().getTime();  
		var start_time = new Date(app.ride.ride.ride_datetime).getTime();

		console.log('load_ride(), start_time:', start_time);

		console.log('load_ride(), app.ride.ride.checked_in = ', app.ride.checked_in);

		if ( app.ride.checked_in > 0 ) {

			html += '<br><button class="checked-in">You\'re Checked In!</button>';

		} else {

			//if ( Math.abs( start_time - now ) < ( 3600 * 1000 ) ) { 
            	// display the checkin button
            	html += '<br><button id = "' + app.ride.ride.id + '-checkin" class="">Check In!</button>';
			//}
		}

		html += '</div>';
        html += '<hr/>';
        
        html += '<b>About</b>';
        html += '<div id="ride-description">';
		html += app.ride.ride.description;
		html += '</div>';
		$('#ride-info-wrapper').html(html);

		if ( app.ride.checked_in == 0 ) {

			// register click after html has been rendered to DOM
			$('#' + app.ride.ride.id + '-checkin').on('click', function() {
				console.log('load_ride(), checkin button clicked!  checking into ride ...');
				app.checkin(
					app.ride.ride.id,
					// success
					function() {
						// todo: tell the user they checked in successfully.
						alert("You've been checked into the ride! Happy Slow Rolling!");
						$('#' + app.ride.ride.id + '-checkin').off('click');
						$('#' + app.ride.ride.id + '-checkin').html("You're Checked In!");
						$('#' + app.ride.ride.id + '-checkin').addClass('checked-in');
						app.ride.checked_in++;
						//$('#' + ride.id).html('Checked In');
					}
					// note: no error.  error will redirect to login screen
				);
			});

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
				app.display_page('login');
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

		$('#refresh-icon-overlay').hide();
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
		html += '<div id="partner-info">';
		html += '<h2 class="">' + app.partner.name + '</h2>'
		//html += '<br/>';
        //html += '<h4>' + app.partner.level + '</h4><br/>';
        html += '<span><i class="fa fa-map-marker"></i>' + app.partner.address_0 + '</span><br/>';
        html += '<span class="span-buffer">' + app.partner.city + ', ' + app.partner.zipcode + '</span>';
        html += '</div>';
        html += '<hr/>';
        html += '<b>About ' + app.partner.name + ':</b>';
        html += '<div id="partner-description">';
		html += app.partner.description;
		html += '</div>';
		$('#partner-info-wrapper').html(html);
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