angular.module('video_conference')
  .service('UserMedia', ['$q', function ($q) {
    return {
      get: function () {
        var mediaDeferred = $q.defer();
        getUserMedia({video: true, audio: true}, mediaDeferred.resolve, mediaDeferred.reject);
        return mediaDeferred.promise;
      }
    };
  }]);