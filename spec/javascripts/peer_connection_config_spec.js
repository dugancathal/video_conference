describe('PeerConnectionConfig', function () {
  describe('with default config', function () {
    beforeEach(function () {
      angular.module('video_conference').config(function (PeerConnectionConfigProvider) {
        PeerConnectionConfigProvider.setGenerator(undefined);
      });
    });
    beforeEach(module('video_conference'));

    it('returns the Google stun servers', inject(function (PeerConnectionConfig) {
      var config = new PeerConnectionConfig();
      expect(config.iceServers).toEqual([{url: 'stun:stun.l.google.com:19302'}]);
    }));
  });

  describe('with a configured generator', function () {
    beforeEach(function () {
      angular.module('video_conference').config(function (PeerConnectionConfigProvider) {
        PeerConnectionConfigProvider.setGenerator(function () {
          return ['stuff'];
        });
      });
    });
    beforeEach(module('video_conference'));

    it('calls the generator', inject(function (PeerConnectionConfig) {
      var config = new PeerConnectionConfig();
      expect(config.iceServers).toEqual(['stuff']);
    }));
  });

});