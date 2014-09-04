describe('Message', function () {
  describe('Message.build', function () {
    var FakeMessage, Message;
    beforeEach(function () {
      module('video_conference', function ($provide) {
        FakeMessage = function FakeMessage() {};
        $provide.value('FakeMessage', FakeMessage);
        $provide.value('Faye', {});
        $provide.value('SAFE_MESSAGES', ['FakeMessage']);
      });

      inject(function (_Message_) {
        Message = _Message_;
      });
    });

    it('returns a message of the given type', function () {
      var m = Message.build({type: 'FakeMessage'});
      expect(m).toEqual(jasmine.any(FakeMessage));
    });

    it('ignores unknown types', function () {
      var m = Message.build({type: 'Unknown'});
      expect(m).toBeUndefined();
    });

    it('also ignores non-message types', function () {
      spyOn(window, 'RTCPeerConnection');
      var m = Message.build({type: 'PeerConnection'});
      expect(m).toBeUndefined();
    });
  });
});
