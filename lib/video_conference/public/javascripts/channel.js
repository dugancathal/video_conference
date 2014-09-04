angular.module('video_conference')
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
  }]);