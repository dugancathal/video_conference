angular.module('video_conference')
  .provider('PeerConnectionConfig', [function PeerConnectionConfigProvider() {
    var generator;
    var defaultGenerator = function () {
      return [{url: 'stun:stun.l.google.com:19302'}];
    };
    this.setGenerator = function (gen) { generator = gen; };

    this.$get = [function () {
      return function PeerConnectionConfig() {
        return {iceServers: (generator || defaultGenerator)()};
      };
    }];
  }]);