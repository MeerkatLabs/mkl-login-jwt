/**
 * Unit tests.
 */
describe('tests', function() {

    var refreshUrl = 'http://example.com/refresh/';
    var loginUrl = 'http://example.com/login';
    var loginDisplayed = false;
    var loginHide = false;

    var unexpiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsIm5hbWUiOiJKb2huIERvZSIsImFkbWluIjp0cnVlfQ.eoaDVGTClRdfxUZXiPs3f8FmJDkDE_VCQFXqKxpLsts';

    var displayLogin = function($q) {

        loginDisplayed = true;

        return $q(function(resolve, reject) {
            console.log('Displaying login');
            resolve();
        });
    };

    var hideLogin = function() {

        loginHide = true;

        return $q(function(resolve, reject) {
            console.log('Hiding Login');
            resolve();
        });
    };

    beforeEach(module('mkl.login.jwt'));

    beforeEach(function() {
        loginDisplayed = false;
        loginHide = false;

        var displayLoginConfig = ['$q', displayLogin];
        var hideLoginConfig = ['$q', hideLogin];

        angular.module('mkl.login.jwt')
            .config(function(JWTLoginServiceProvider) {
                JWTLoginServiceProvider.displayLogin = displayLoginConfig;
                JWTLoginServiceProvider.hideLogin = hideLoginConfig;
                JWTLoginServiceProvider.refreshUrl = refreshUrl;
                JWTLoginServiceProvider.loginUrl = loginUrl;
            });
    });

    afterEach(inject(function($window) {
        $window.localStorage.removeItem('jwtToken');
    }));

    it('should not have a token stored', inject(function($window) {
        expect($window.localStorage.getItem('jwtToken')).toBeNull();
    }));

    it('Should request Login Url', inject(function(JWTLoginService, $httpBackend) {

        $httpBackend.expectPOST(loginUrl);
        $httpBackend.when('POST', loginUrl)
            .respond({token: unexpiredToken});

        JWTLoginService.login('username', 'password');

        $httpBackend.flush();

        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();

    }));

    it('should execute the display login', inject(function(JWTLoginService) {

        JWTLoginService.getJWT();

        expect(loginDisplayed).toBeTruthy();

    }));

    it('should refresh the token because the refresh interval isnt running', inject(function(JWTLoginService, $httpBackend, $window, $interval) {

        $window.localStorage.setItem('jwtToken', unexpiredToken);

        $httpBackend.expectPOST(refreshUrl, {token: unexpiredToken});
        $httpBackend.when('POST', refreshUrl)
            .respond({ token: unexpiredToken });

        JWTLoginService.getJWT();

        $httpBackend.flush();

        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();

        // Verify that the token will be refreshed automatically by the service.
        $httpBackend.expectPOST(refreshUrl, {token: unexpiredToken});
        $httpBackend.when('POST', refreshUrl)
            .respond({ token: unexpiredToken });

        $interval.flush(300000);

        $httpBackend.flush();

        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();

        // Should just return the token directly.
        var token = JWTLoginService.getJWT();
        expect(token).toEqual(unexpiredToken);


    }));

    it('should logout of the service', inject(function(JWTLoginService, $window, $rootScope, LOGIN_EVENTS) {

        spyOn($rootScope, '$emit').and.callThrough();

        $window.localStorage.setItem('jwtToken', unexpiredToken);

        JWTLoginService.logout();

        $rootScope.$apply();

        expect($window.localStorage.getItem('jwtToken')).toBeNull();
        expect($rootScope.$emit).toHaveBeenCalledWith(LOGIN_EVENTS.USER_LOGGED_OUT);

    }));
});