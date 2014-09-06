angular.module('video_conference')
  .service('UserMedia', ['$q', function ($q) {
    return {
      get: function get() {
        var mediaDeferred = $q.defer();
        var UserMedia = this;

        getUserMedia(
          {video: true, audio: true},
          function (stream) {
            UserMedia.stream = stream;
            mediaDeferred.resolve(stream);
          },
          mediaDeferred.reject
        );

        return mediaDeferred.promise;
      },
      getStream: function () {
        return this.stream;
      }
    };
  }]);