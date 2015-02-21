// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var findParkApp = angular.module('findPark', ['ionic', 'firebase', 'findPark.controllers', 'ngRoute', 'uiGmapgoogle-maps'])

    .run(function($ionicPlatform, $rootScope, $firebase, $window, $ionicLoading, $firebaseSimpleLogin) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            $rootScope.user = null;
            $rootScope.userEmail = null;
            $rootScope.baseUrl = 'https://findPark.firebaseio.com/';
            var firebaseRef = new Firebase($rootScope.baseUrl);
            $rootScope.auth = $firebaseSimpleLogin(firebaseRef);
            $rootScope.firebaseRef = firebaseRef

            $rootScope.show = function(text) {

                $rootScope.loading = $ionicLoading.show({
                    content: text ? text : 'Loading..',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });
            };

            $rootScope.hide = function() {
                $ionicLoading.hide();
            };

            $rootScope.notify = function(text) {

                $rootScope.show(text);
                $window.setTimeout(function() {
                    $rootScope.hide();
                }, 1999);
            };

            $rootScope.checkSession = function() {
                if (typeof $rootScope.user != 'undefined' && $rootScope.user != null)
                {
                    $location.href = ('#/parking/map');
                }
                else
                {
                    $location.href = ('#/auth/signin');
                }
            }

            $rootScope.logout = function() {
                $rootScope.firebaseRef.unauth();
                window.cookies.clear(function() {
                    console.log("Cookies cleared!");
                });
            }
        });
    });

findParkApp.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('home', {
            url: "/",
            templateUrl: "templates/map.html",
            controller: "MapCtrl"
        })
        .state('signin', {
            url: "/auth/signin",
            templateUrl: "templates/auth-signin.html",
            controller: "SignInCtrl"
        })
        .state('signout', {
            url: "/auth/signup",
            templateUrl: "templates/auth-signup.html",
            controller: "SignUpCtrl"
        })
        .state('map', {
            url: "/parking/map",
            templateUrl: "templates/map.html",
            controller: "MapCtrl"
        })
        .state('park-status', {
            url: "/parking/park-status",
            templateUrl: "templates/park-status.html",
            controller: "ParkStatusCtrl"
        })
        $urlRouterProvider.otherwise("/parking/map");
    })
    .run(function($rootScope, $location) {
        $rootScope.$on('$routeChangeSuccess', function () {
            if (typeof $rootScope.user != 'undefined' && $rootScope.user != null)
            {
                $location.href = ('#/parking/map');
            }
            else
            {
                $location.href = ('#/auth/signin');
            }
        })
    })
    .factory('checkSession', function($rootScope, $cookieStore, $http){
        return function(scope) {
            if (typeof $rootScope.user != 'undefined' && $rootScope.user != null)
            {
                $location.href = ('#/parking/map');
            }
            else
            {
                $location.href = ('#/auth/signin');
            }
        }
    });

findParkApp.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyDIxE6AbpYr5b5LgCfxcynEnX3e4QZgNjs',
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
});