angular.module('video_conference', [])
  .constant('FAYE_URL', '/faye/faye')
  .value('SAFE_MESSAGES', ['IceCandidateMessage', 'OfferDescriptionMessage', 'AnswerDescriptionMessage', 'AnnouncementMessage'])
  .service('Faye', function () {
    return Faye;
  })
  .factory('Message', ['SAFE_MESSAGES', '$injector', function (SAFE_MESSAGES, $injector) {
    var Message = function (data) {
      if(!data) {
        throw {name: 'EmptyMessageError', message: 'Messages must have content'};
      }
      this.data = data.data || data;
      this.from = data.from;
      this.to = data.to;
    };

    Message.build = function (data) {
      if(SAFE_MESSAGES.indexOf(data.type) === -1) { return; }
      try {
        return new ($injector.get(data.type))(data);
      } catch(e) {};
    };

    return Message;
  }])
  .factory('AnnouncmentMessage', ['Message', function (Message) {
    return function AnnouncementMessage(data) {
      Message.call(this, data);
    }
  }])
  .factory('IceCandidateMessage', ['Message', function (Message) {
    return function IceCandidateMessage(data) {
      Message.call(this, data);
    }
  }])
  .factory('OfferDescriptionMessage', ['Message', function (Message) {
    return function OfferDescriptionMessage(data) {
      Message.call(this, data);
    }
  }])
  .factory('AnswerDescriptionMessage', ['Message', function (Message) {
    return function AnswerDescriptionMessage(data) {
      Message.call(this, data);
    }
  }])
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
            return Message.build(message);
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
