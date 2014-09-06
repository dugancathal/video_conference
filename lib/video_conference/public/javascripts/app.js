angular.module('video_conference', [])
  .constant('FAYE_URL', '/faye/faye')
  .value('SAFE_MESSAGES', ['IceCandidateMessage', 'OfferDescriptionMessage', 'AnswerDescriptionMessage', 'AnnouncementMessage'])
  .service('Faye', function () {
    return Faye;
  })
  .controller('MainCtrl', ['$scope', '$sce', 'UserMedia', 'Signaler',
    function ($scope, $sce, UserMedia, Signaler) {
      $scope.streamUrls = [];

      UserMedia.get().then(function (stream) {
        $scope.url = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));

        Signaler.init('/test').then(function success() {
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
