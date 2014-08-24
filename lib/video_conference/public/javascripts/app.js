angular.module('video_conference', [])
  .service('UserMedia', ['$q', function ($q) {
    return {
      get: function () {  
        var mediaDeferred = $q.defer();
        getUserMedia({video: true, audio: true}, mediaDeferred.resolve, mediaDeferred.reject);
        return mediaDeferred.promise;
      }
    };
  }])
  .controller('MainCtrl', ['$scope', '$sce', 'UserMedia',
    function ($scope, $sce, UserMedia) {
      UserMedia.get().then(function (stream) {
        $scope.url = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
      }, function () {
        $scope.errorMessage = "Uh oh, we couldn't get access to your camera. What'd you do?"
      });
    }
  ]);
