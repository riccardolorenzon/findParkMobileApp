function escapeEmailAddress(email) {
    if (!email) return false
    // Replace '.' (not allowed in a Firebase key) with ','
    email = email.toLowerCase();
    email = email.replace(/\./g, ',');
    return email.trim();
}

function chronometer() {
    var startTime = 0
    var start = 0
    var end = 0
    var diff = 0
    var timerID = 0

    function chrono(start) {
        end = new Date()
        diff = end - start
        diff = new Date(diff)
        var msec = diff.getMilliseconds()
        var sec = diff.getSeconds()
        var min = diff.getMinutes()
        var hr = diff.getHours() - 1
        if (min < 10) {
            min = "0" + min
        }
        if (sec < 10) {
            sec = "0" + sec
        }
        if (msec < 10) {
            msec = "00" + msec
        }
        else if (msec < 100) {
            msec = "0" + msec
        }
        document.getElementById("chronotime").innerHTML = hr + ":" + min + ":" + sec + ":" + msec
        timerID = setTimeout("chrono()", 10)
    }

    function chronoStart() {
        document.chronoForm.startstop.value = "stop!"
        document.chronoForm.startstop.onclick = chronoStop
        document.chronoForm.reset.onclick = chronoReset
        start = new Date()
        chrono()
    }

    function chronoContinue() {
        document.chronoForm.startstop.value = "stop!"
        document.chronoForm.startstop.onclick = chronoStop
        document.chronoForm.reset.onclick = chronoReset
        start = new Date() - diff
        start = new Date(start)
        chrono()
    }

    function chronoReset() {
        document.getElementById("chronotime").innerHTML = "0:00:00:000"
        start = new Date()
    }

    function chronoStopReset() {
        document.getElementById("chronotime").innerHTML = "0:00:00:000"
        document.chronoForm.startstop.onclick = chronoStart
    }

    function chronoStop() {
        document.chronoForm.startstop.value = "start!"
        document.chronoForm.startstop.onclick = chronoContinue
        document.chronoForm.reset.onclick = chronoStopReset
        clearTimeout(timerID)
    }
}


angular.module('findPark.controllers', ['ngCookies'])
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
        '$scope', '$rootScope', '$window', '$firebaseSimpleLogin', '$location', '$cookies',
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
                   // window.localStorage.set("uid", $rootScope.user);
                    $window.location.href = ('#/parking/map');
                    $cookies.uid = authData.uid;
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

    .controller('myListCtrl', function($rootScope, $scope, $window, $ionicModal, $firebase, $location, $cookies) {
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

    .controller("MapCtrl", function($scope, $rootScope, uiGmapGoogleMapApi, $location, $cookies) {
        // check if current user is authenticated
        var url = 'https://findPark.firebaseio.com/';
        var firebaseRef = new Firebase(url);
        var authData = firebaseRef.getAuth();
        if (authData) {
            $rootScope.user = authData.uid;
            $cookies.uid = authData.uid;
            //window.localStorage.set("uid", $rootScope.user);

        } else {
            window.location.href = ('#/auth/signin');
        }
        $scope.parking_left = function(){
            window.location.href = ('#/parking/park-history');
        };

        $scope.parking_parked = function(){
            current_datetime = new Date().getUTCDate();
            var firebaseRef = new Firebase('https://findPark.firebaseio.com/web/data/parkingsports');
            var parkingSpotsRef = firebaseRef.child($rootScope.user);
            parkingSpotsRef.set({
                latitude : 0.00000,
                longitude: 0.00000,
                status: 'engaged',
                last_status_change_datetime: current_datetime.toString(),
                creation_datetime: current_datetime.toString(),
                address: 'lombard street 123, SF USA'
            });
            window.location.href = ('#/parking/park-status');
        };

        $scope.showPosition = function (position) {
            $scope.lat = position.coords.latitude;
            $scope.lng = position.coords.longitude;
            $scope.accuracy = position.coords.accuracy;
            $scope.$apply();
            var latlng = new google.maps.LatLng($scope.lat, $scope.lng);
            $scope.map = { center: { latitude: $scope.lat, longitude: $scope.lng }, zoom: 16 };
            $scope.marker = {
                id:0,
                coords: {
                    latitude: $scope.lat,
                    longitude: $scope.lng
            },};
        };

        $scope.showError = function (error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    $scope.error = "User denied the request for Geolocation."
                    break;
                case error.POSITION_UNAVAILABLE:
                    $scope.error = "Location information is unavailable."
                    break;
                case error.TIMEOUT:
                    $scope.error = "The request to get user location timed out."
                    break;
                case error.UNKNOWN_ERROR:
                    $scope.error = "An unknown error occurred."
                    break;
            }
            $scope.$apply();
        }

        $scope.getLocation = function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
            }
            else {
                $scope.error = "Geolocation is not supported by this browser.";
            }
        }

        $scope.getLocation();
    })

    .controller("ParkStatusCtrl", function($scope, $rootScope) {
        $scope.parkingLeft = function(){
            current_datetime = new Date().getUTCDate();
            var firebaseRef = new Firebase('https://findPark.firebaseio.com/web/data/parkingsports');
            var parkingSpotsRef = firebaseRef.child($rootScope.user);
            parkingSpotsRef.update({
                status: 'free',
                last_status_change_datetime: current_datetime.toString()
            });
            window.location.href = ("#/parking/map");
        };
    })

    .controller("ParkHistoryCtrl", function($scope, $rootScope, $cookies) {
        $scope.parkingspots = [];
        var ref = new Firebase(encodeURI("https://findPark.firebaseio.com/web/data/parkingsports/" +  $cookies.uid));
        ref.on("value", function(parkingspots) {
            $scope.parkingspots = parkingspots;
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    })

    .controller("ContentCtrl", function($scope, $ionicSideMenuDelegate) {
        $scope.attendees = [
            { firstname: 'Nicolas', lastname: 'Cage' },
            { firstname: 'Jean-Claude', lastname: 'Van Damme' },
            { firstname: 'Keanu', lastname: 'Reeves' },
            { firstname: 'Steven', lastname: 'Seagal' }
        ];

        $scope.toggleLeft = function() {
            $ionicSideMenuDelegate.toggleLeft();
        };
    });