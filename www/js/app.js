// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var findParkApp = angular.module('findPark', ['ionic', 'firebase', 'findPark.controllers', 'ngRoute'])

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

            $rootScope.userEmail = null;
            $rootScope.baseUrl = 'https://findPark.firebaseio.com/';
            var firebaseRef = new Firebase($rootScope.baseUrl);
            $rootScope.auth = $firebaseSimpleLogin(firebaseRef);

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
                return;
            }
        });
    });
findParkApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/auth/signin', {
                templateUrl: 'templates/auth-signin.html',
                controller: 'SignInCtrl'
            }).
            when('/bucket/list', {
                templateUrl: 'templates/bucket-list.html',
                controller: 'myListCtrl'
            }).
            otherwise({
                redirectTo: '/auth/signin'
            });
    }]);