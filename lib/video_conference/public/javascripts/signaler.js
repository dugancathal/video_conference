angular.module('video_conference')
  .service('Signaler', ['Channel', 'Message', 'FAYE_URL',
    function (Channel, Message, FAYE_URL) {
      return {
        init: function (roomName) {
          Channel.init(FAYE_URL, roomName);
          return Channel.subscribe(function (message) {
            return Message.build(message).exec();
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
  ]);