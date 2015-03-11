/**
 * Create the correct module for the login service.
 *
 * Configure the jwtInterceptorProvider to use the login service for fetching the token, and then add the interceptor
 * to the httpProvider service.
 */

angular.module('mkl-login-jwt', ['angular-jwt'])
    .config(['$httpProvider', 'jwtInterceptorProvider', function($httpProvider, jwtInterceptorProvider) {

    jwtInterceptorProvider.tokenGetter = ['JWTLoginService', 'config', function(JWTLoginService, config) {

        return JWTLoginService.getJWT(config);

    }];

    $httpProvider.interceptors.push('jwtInterceptor');
}]);