function escapeEmailAddress(email) {
    if (!email) return false
    // Replace '.' (not allowed in a Firebase key) with ','
    email = email.toLowerCase();
    email = email.replace(/\./g, ',');
    return email.trim();
}

angular.module('findPark.controllers', [])
    .controller('SignUpCtrl', [
        '$scope', '$rootScope', '$firebaseAuth', '$window',
        function ($scope, $rootScope, $firebaseAuth, $window) {
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
        '$scope', '$rootScope', '$window',
        function ($scope, $rootScope, $window, $firebaseSimpleLogin) {

            //TODO check if an auth session is already open

            // Logs a user out
            $scope.logout = function() {
                $scope.auth.$logout();
            };

            // Create a Firebase Simple Login object
            $scope.auth = $rootScope.auth;

            // Initially set no user to be logged in
            $scope.user = null;

            // Logs a user in with inputted provider
            $scope.login = function(provider) {
                var credentials = {};
                if (provider == 'password') {
                    if ((this.user.email == null) || (this.user.password == null))
                        return;
                    credentials.email = this.user.email;
                    credentials.password = this.user.password;
                    $rootScope.auth.$login(provider, credentials)
                        .then(function (user) {
                            $rootScope.hide();
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
                    firebaseRef.onAuth(function(authData) {
                        $window.location.href = ('#/parking/map');
                        return;
                    });
                    firebaseRef.authWithOAuthRedirect(provider, function(error) {
                        if (error) {
                            console.log("Login Failed!", error);
                        } else {

                            console.log("Login OK!", error);
                            // We'll never get here, as the page will redirect on success.
                            $rootScope.hide();
                            $window.location.href = ('#/parking/map');
                        }
                    });
                }
            };

            // Logs a user out
            $scope.logout = function() {
                $scope.auth.$logout();
            };

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

        $scope.markCompleted = function(key) {
            $rootScope.show("Please wait... Updating List");
            var itemRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail)) + '/' + key;
            itemRef.update({
                isCompleted: true
            }, function(error) {
                if (error) {
                    $rootScope.hide();
                    $rootScope.notify('Oops! something went wrong. Try again later');
                } else {
                    $rootScope.hide();
                    $rootScope.notify('Successfully updated');
                }
            });
        };

        $scope.deleteItem = function(key) {
            $rootScope.show("Please wait... Deleting from List");
            var itemRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
            bucketListRef.child(key).remove(function(error) {
                if (error) {
                    $rootScope.hide();
                    $rootScope.notify('Oops! something went wrong. Try again later');
                } else {
                    $rootScope.hide();
                    $rootScope.notify('Successfully deleted');
                }
            });
        };
    })
    .controller('newCtrl', function($rootScope, $scope, $window, $firebase) {
        $scope.data = {
            item: ""
        };

        $scope.close = function() {
            $scope.modal.hide();
        };

        $scope.createNew = function() {
            var item = this.data.item;

            if (!item) return;

            $scope.modal.hide();
            $rootScope.show();
            $rootScope.show("Please wait... Creating new");

            var form = {
                item: item,
                isCompleted: false,
                created: Date.now(),
                updated: Date.now()
            };

            var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
            $firebase(bucketListRef).$add(form);
            $rootScope.hide();
        };
    })
    .controller('completedCtrl', function($rootScope, $scope, $window, $firebase) {
        $rootScope.show("Please wait... Processing");
        $scope.list = [];

        var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
        bucketListRef.on('value', function(snapshot) {
            $scope.list = [];
            var data = snapshot.val();

            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    if (data[key].isCompleted == true) {
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

        $scope.deleteItem = function(key) {
            $rootScope.show("Please wait... Deleting from List");
            var itemRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
            bucketListRef.child(key).remove(function(error) {
                if (error) {
                    $rootScope.hide();
                    $rootScope.notify('Oops! something went wrong. Try again later');
                } else {
                    $rootScope.hide();
                    $rootScope.notify('Successfully deleted');
                }
            });
        };
    })
    .controller("mapCtrl", function($scope, uiGmapGoogleMapApi) {
            // Do stuff with your $scope.
            // Note: Some of the directives require at least something to be defined originally!
            // e.g. $scope.markers = []
            uiGmapGoogleMapApi.then(function(maps) {
                $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
            });
            // uiGmapGoogleMapApi is a promise.
            // The "then" callback function provides the google.maps object.

        });