angular.module('video_conference')
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
  }]);
