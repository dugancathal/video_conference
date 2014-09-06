angular.module('video_conference')
  .factory('Message', ['SAFE_MESSAGES', '$injector', function (SAFE_MESSAGES, $injector) {
    var Message = function (data) {
      if(!data) {
        throw {name: 'EmptyMessageError', message: 'Messages must have content'};
      }
      this.data = data.data || data;
      this.type = this.data.type;
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
  .factory('AnnouncementMessage', ['Message', 'PeerConnector', 'PeerConnectionConfig', function (Message, PeerConnector, PeerConnectionConfig) {
    return function AnnouncementMessage(data) {
      Message.call(this, data);
      this.exec = function () {
        PeerConnector.createOffer(new PeerConnectionConfig(), this.from);
      };
    }
  }])
  .factory('IceCandidateMessage', ['Message', 'PeerConnector', function (Message, PeerConnector) {
    return function IceCandidateMessage(data) {
      Message.call(this, data);
      this.exec = function exec() {
        PeerConnector.addIceCandidateTo(this.from, this.data);
      };
    }
  }])
  .factory('OfferDescriptionMessage', ['Message', 'PeerConnector', 'PeerConnectionConfig', function (Message, PeerConnector, PeerConnectionConfig) {
    return function OfferDescriptionMessage(data) {
      Message.call(this, data);
      this.exec = function () {
        PeerConnector.createAnswer(new PeerConnectionConfig(), this.from, this.data.description);
      };
    }
  }])
  .factory('AnswerDescriptionMessage', ['Message', 'PeerConnector', function (Message, PeerConnector) {
    return function AnswerDescriptionMessage(data) {
      Message.call(this, data);
      this.exec = function () {
        PeerConnector.connect(this.from, this.data.description);
      };
    }
  }]);
