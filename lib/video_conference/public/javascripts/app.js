angular.module('video_conference', [])
  .constant('FAYE_URL', '/faye/faye')
  .service('Faye', function () {
    return Faye;
  })
  .factory('Message', function () {
    return function (data) {
      if(!data) {
        throw {name: 'EmptyMessageError', message: 'Messages must have content'};
      }
      this.data = data.data || data;
      this.from = data.from;
      this.to = data.to;
    };
  })
  .service('Channel', ['Faye', function (Faye) {
    return {
      init: function (url, room) {
        this.room = room;
        this.faye = new Faye.Client(url);
      },
      subscribe: function (onMessage) {
        return this.faye.subscribe(this.room, onMessage);
      },
      publish: function (message) {
        return this.faye.publish(this.room, message);
      },
      getRoom: function () {
        return this.room;
      },
      clientId: function () {
        return this.faye._clientId;
      }
    };
  }])
  .service('Signaler', ['Channel', 'Message', 'FAYE_URL',
    function (Channel, Message, FAYE_URL) {
      return {
        init: function (roomName) {
          Channel.init(FAYE_URL, roomName);
          return Channel.subscribe(function (message) {
            console.log('received', message);
          });
        },
        sendToRoom: function (content) {
          var message = new Message(content);
          message.from = Channel.clientId();
          Channel.publish(message);
        },
        sendToPeer: function (peerId, content) {
          var message = new Message(content);
          message.to = peerId;
          this.sendToRoom(message);
        }
      };
    }
  ])
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
