angular.module('video_conference', [])
  .config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode(true);
  }])
  .constant('FAYE_URL', '/faye/faye')
  .value('SAFE_MESSAGES', ['IceCandidateMessage', 'OfferDescriptionMessage', 'AnswerDescriptionMessage', 'AnnouncementMessage'])
  .service('Faye', function () {
    return Faye;
  })
  .factory('ROOM_NAME', ['$location', function ($location) {
    return function () {
      return $location.url().match(/(\/\w+)$/)[1];
    };
  }])
  .controller('MainCtrl', ['$scope', '$sce', 'UserMedia', 'Signaler', 'ROOM_NAME',
    function ($scope, $sce, UserMedia, Signaler, ROOM_NAME) {
      $scope.streamUrls = [];

      UserMedia.get().then(function (stream) {
        $scope.url = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));

        Signaler.init(ROOM_NAME()).then(function success() {
          Signaler.sendToRoom({type: 'AnnouncementMessage'});
        });
      }, function () {
        $scope.errorMessage = "Uh oh, we couldn't get access to your camera. What'd you do?"
      });

      $scope.addStream = function addStream(stream) {
        var streamUrl = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
        $scope.streamUrls.push(streamUrl);
      };

      $scope.$on('rtc.addstream', function (e, remoteMedia) {
        $scope.addStream(remoteMedia.stream);
        $scope.$digest();
      });
    }
  ]);
