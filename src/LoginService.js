/**
 * Created by rerobins on 2/19/15.
 */
/**
 * Login service that is responsible for retrieving and maintaining the JWT token.
 *
 * The work flow of dealing with the service is:
 *
 * Login Required:
 *  * Interceptor requests token.
 *  * Login Service executes the injector method as configured in displayLogin
 *  * External controller or service will provide login credentials to LoginService.login() (provides a promise as return)
 *  * Login Service will login to the service and notify the promise returned by the login method.
 *  * On Success, the external service will process the result, and then resolve the original promise returned to
 * displayLogin
 *
 * @constructor
 */
var LoginService = function($http, $interval, $injector, $q, $rootScope, $window, jwtHelper, LOGIN_EVENTS,
                            configuration) {

    var LOGIN_REFRESH_TIME = configuration.refreshTime;

    var refreshPromise = null;
    var REFRESH_URL = configuration.refreshUrl;
    var LOGIN_URL = configuration.loginUrl;
    var ignoreUrls = configuration.ignoreUrls;

    var loggingIn = false;

    var storageKey = 'jwtToken';

    // Login Service return.
    var LoginService = {};

    /**
     * Login to the service.
     * @param username username
     * @param password password
     */
    LoginService.login = function(username, password) {
        return $http({
            method: 'POST',
            url: LOGIN_URL,
            skipAuthorization: true,
            data: {
                username: username,
                password: password
            }
        }).then(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available

            console.log('Retrieved data', data);
            setToken(data.data.token);

            $rootScope.$broadcast(LOGIN_EVENTS.USER_LOGGED_IN);

        });
    };

    /**
     * Provide a piece of simple login functionality.
     * @returns {promise}
     */
    var displayLogin = function() {
        var promise = $injector.invoke(configuration.displayLogin);
        console.log('Display Login Promise', promise);
        return promise;
    };

    /**
     * Hide the login
     * @returns {promise}
     */
    var hideLogin = function() {
        $injector.invoke(configuration.hideLogin);
    };

    /**
     * Promises to refresh the current token.
     * @returns {*|Promise}
     */
    LoginService.refreshToken = function() {
        console.log('Refreshing token');
        return $http({
            method: 'POST',
            url: REFRESH_URL,
            skipAuthorization: true,
            data: {
                token: $window.localStorage.getItem(storageKey)
            }
        }).then(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available

            console.log('Retrieved data', data);
            setToken(data.data.token);

        }).catch(function(data, status, headers, config) {
            $window.localStorage.removeItem('jwtToken');
            $interval.cancel(refreshPromise);
            return LoginService.getJWT();
        });
    };

    /**
     * Logout and notify a promise that the logout was successful.
     * @returns {*|Promise}
     */
    LoginService.logout = function() {
        return $q(function(resolve, reject) {

            $window.localStorage.removeItem(storageKey);

            // Stop refreshing the token.
            $interval.cancel(refreshPromise);
            refreshPromise = null;

            $rootScope.$emit(LOGIN_EVENTS.USER_LOGGED_OUT);

            resolve();

        });

    };

    /**
     * This will attempt return a previously cached token, or request the credentials necessary to retrieve a token.
     * @returns {*|Promise}
     */
    LoginService.getJWT = function(config) {

        console.log(config);

        if (angular.isDefined(config) && ignoreUrls(config)) {
            return '';
        }

        var token = $window.localStorage.getItem(storageKey) || null;

        if (token === null || token === 'null' || token === 'undefined') {
            loggingIn = true;
            return displayLogin().then(function() {
                return $window.localStorage.getItem(storageKey);
            }).catch(function() {
                return $q.reject('Login cancelled');
            });
        } else if (jwtHelper.isTokenExpired(token) || refreshPromise === null) {
            // request a token refresh
            console.log('Token has expired');
            return LoginService.refreshToken().then(function() {
                console.log('Returning refreshed token');
                return $window.localStorage.getItem(storageKey);
            });
        } else {
            return token;
        }
    };

    /**
     * Set the token in the login service.
     * @param {string} _token
     */
    var setToken = function(_token) {
        console.log('Token Received', _token);
        $window.localStorage.setItem(storageKey, _token);

        if (refreshPromise === null) {
            console.log('Registering refresh timer');
            refreshPromise = $interval(function() { LoginService.refreshToken(); }, LOGIN_REFRESH_TIME);
        }

        if (loggingIn) {
            hideLogin();
            loggingIn = false;
        }
    };

    return LoginService;

};

/**
 * Provider definition for the Login Service.
 * @constructor
 */
var LoginServiceProvider = function() {

    var provider = this;

    // Number of seconds to wait before refreshing the token.
    this.refreshTime = 250000;

    // The url to use to refresh the token with.
    this.refreshUrl = '';

    // The url to use to login and fetch a token with.
    this.loginUrl = '';

    // Default ignore Urls code is to not ignore urls at all.
    this.ignoreUrls = function() {
        console.log('Running undefined ignore urls');
        return false;
    };

    // Returns a promise that will display a login.  It will resolve when the login was successful, and reject
    // when the login failed or was cancelled.
    this.displayLogin = ['$q', function($q) { return $q.reject('Undefined display login method'); }];

    // Hides the Display because the function has been recorded.
    this.hideLogin = ['$q', function($q) { return $q.reject('Undefined hide login method'); }];

    this.$get = ['$http', '$interval', '$injector', '$q', '$rootScope', '$window', 'jwtHelper', 'LOGIN_EVENTS',
        function($http, $interval, $injector, $q, $rootScope, $window, jwtHelper, LOGIN_EVENTS) {

            var configuration = {
                refreshTime: provider.refreshTime,
                refreshUrl: provider.refreshUrl,
                loginUrl: provider.loginUrl,
                ignoreUrls: provider.ignoreUrls,
                displayLogin: provider.displayLogin,
                hideLogin: provider.hideLogin
            };

            return new LoginService($http, $interval, $injector, $q, $rootScope, $window, jwtHelper, LOGIN_EVENTS, configuration);

        }];

};

angular.module('mkl.login.jwt')
    .provider('JWTLoginService', LoginServiceProvider)
    .constant('LOGIN_EVENTS', {
        USER_LOGGED_IN: 'login::userLoggedIn',
        USER_LOGGED_OUT: 'login::userLoggedOut'
    });
