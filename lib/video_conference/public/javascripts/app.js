angular.module('video_conference', [])
  .constant('FAYE_URL', '/faye/faye')
  .value('SAFE_MESSAGES', ['IceCandidateMessage', 'OfferDescriptionMessage', 'AnswerDescriptionMessage', 'AnnouncementMessage'])
  .service('Faye', function () {
    return Faye;
  })
  .controller('MainCtrl', ['$scope', '$sce', 'UserMedia',
    function ($scope, $sce, UserMedia) {
      UserMedia.get().then(function (stream) {
        $scope.url = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
      }, function () {
        $scope.errorMessage = "Uh oh, we couldn't get access to your camera. What'd you do?"
      });
    }
  ]);
