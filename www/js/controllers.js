function escapeEmailAddress(email) {
    if (!email) return false
    // Replace '.' (not allowed in a Firebase key) with ','
    email = email.toLowerCase();
    email = email.replace(/\./g, ',');
    return email.trim();
}

angular.module('findPark.controllers', [])
    .controller('SignUpCtrl', [
        '$scope', '$rootScope', '$firebaseAuth', '$window', '$location',
        function ($scope, $rootScope, $firebaseAuth, $window, $location) {
            $scope.user = {
                email: "",
                password: ""
            };
            $scope.createUser = function () {
                var email = this.user.email;
                var password = this.user.password;

                if (!email || !password) {
                    $rootScope.notify("Please enter valid credentials");
                    return false;
                }

                $rootScope.show('Please wait.. Registering');
                $rootScope.auth.$createUser(email, password, function (error, user) {
                    if (!error) {
                        $rootScope.hide();
                        $rootScope.userEmail = user.email;
                        $window.location.href = ('#/bucket/list');
                    }
                    else {
                        $rootScope.hide();
                        if (error.code == 'INVALID_EMAIL') {
                            $rootScope.notify('Invalid Email Address');
                        }
                        else if (error.code == 'EMAIL_TAKEN') {
                            $rootScope.notify('Email Address already taken');
                        }
                        else {
                            $rootScope.notify('Oops something went wrong. Please try again later');
                        }
                    }
                });
            }
        }
    ])
    .controller('SignInCtrl', [
        '$scope', '$rootScope', '$window', '$firebaseSimpleLogin', '$location',
        function ($scope, $rootScope, $window, $firebaseSimpleLogin, $location) {

            // Logs a user out
            $scope.logout = function() {
                $scope.auth.$logout();
                $scope.user = null;
            };

            // Create a Firebase Simple Login object
            $scope.auth = $rootScope.auth;

            // Logs a user in with inputted provider
            $scope.login = function(provider) {
                // Initially set no user to be logged in
                $scope.user = null;
                var credentials = {};
                if (provider == 'password') {
                    if ((this.user.email == null) || (this.user.password == null))
                        return;
                    credentials.email = this.user.email;
                    credentials.password = this.user.password;
                    $rootScope.auth.$login(provider, credentials)
                        .then(function (user) {
                            $rootScope.hide();
                            $rootScope.user = user.email;
                            $rootScope.userEmail = user.email;
                            $window.location.href = ('#/parking/map');
                        }, function (error) {
                            $rootScope.hide();
                            if (error.code == 'INVALID_EMAIL') {
                                $rootScope.notify('Invalid Email Address');
                            }
                            else if (error.code == 'INVALID_PASSWORD') {
                                $rootScope.notify('Invalid Password');
                            }
                            else if (error.code == 'INVALID_USER') {
                                $rootScope.notify('Invalid User');
                            }
                            else {
                                $rootScope.notify('Oops something went wrong. Please try again later');
                            }
                        });
                }
                if (provider == 'facebook') {
                    var url = 'https://findPark.firebaseio.com/';
                    var firebaseRef = new Firebase(url);
                    firebaseRef.onAuth(authDataCallback);
                    firebaseRef.authWithOAuthRedirect(provider, function(error) {
                        if (error) {
                            console.log("Login Failed!", error);
                        }
                    });
                }
            };

            function authDataCallback(authData) {
                if (authData) {
                    $rootScope.user = authData.uid;
                    $window.location.href = ('#/parking/map');

                }
            }

            // Upon successful login, set the user object
            $rootScope.$on("$firebaseSimpleLogin:login", function(event, user) {
                $scope.user = user;
            });

            // Upon successful logout, reset the user object
            $rootScope.$on("$firebaseSimpleLogin:logout", function(event) {
                $scope.user = null;
            });

            // Log any login-related errors to the console
            $rootScope.$on("$firebaseSimpleLogin:error", function(event, error) {
                console.log("Error logging user in: ", error);
            });
        }
    ])
    .controller('myListCtrl', function($rootScope, $scope, $window, $ionicModal, $firebase, $location) {
        $rootScope.show("Please wait... Processing");
        $scope.list = [];
        var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
        bucketListRef.on('value', function(snapshot) {
            var data = snapshot.val();
            $scope.list = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    if (data[key].isCompleted == false) {
                        data[key].key = key;
                        $scope.list.push(data[key]);
                    }
                }
            }

            if ($scope.list.length == 0) {
                $scope.noData = true;
            } else {
                $scope.noData = false;
            }
            $rootScope.hide();
        });

        $ionicModal.fromTemplateUrl('templates/newItem.html', function(modal) {
            $scope.newTemplate = modal;
        });

        $scope.newTask = function() {
            $scope.newTemplate.show();
        };

        // Logs a user out
        $scope.logout = function() {
            var firebase = new Firebase($rootScope.baseUrl);
            firebase.unauth();
            $location.path("/");
        };

    })
    .controller("MapCtrl", function($scope, uiGmapGoogleMapApi, $location) {
            // check if current user is authenticated
            var url = 'https://findPark.firebaseio.com/';
            var firebaseRef = new Firebase(url);
            var authData = firebaseRef.getAuth();
            if (authData) {
                console.log("User " + authData.uid + " is logged in with " + authData.provider);
                uiGmapGoogleMapApi.then(function(maps) {
                    $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
                });
            } else {
                console.log("User is logged out");
                $location.href = ('#/auth/signin');
            }


        });