
var base_url = 'http://slowrollbuffalo.mycodespace.net';
//var base_url = 'http://localhost:6577';

var app = {

	init: function() {
		$('#page-login-login').on('click', function() {
			app.login(
				$('#page-login-email').val(),
				$('#page-login-password').val(),
				function() {
					// todo: change pages
					alert('logged in!');
				},
				function() {
					// todo: show error popup
					alert('bad login!');
				}
			);
		})
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
            success: function(resp) {success(resp); },
            error: function(resp) { failure(resp); }
        });
    },

	logout: function() {

	},

	display_page: function(page) {
		$('.page').hide();
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
		$('#page-' + page).show();
	},

};