describe('PeerConnection', function () {
  beforeEach(module('video_conference'));

  var PeerConnection, Signaler, $scope, fakeRtcPeerConnection, Faye, fayeClient;

  beforeEach(function () {
    var installation = installFakeFaye(module, inject);
    Faye = installation.Faye, fayeClient = installation.fayeClient;
  });

  beforeEach(inject(function (_PeerConnection_, _Signaler_, $rootScope) {
    PeerConnection = _PeerConnection_;
    Signaler = _Signaler_;
    $scope = $rootScope.$new();
    fakeRtcPeerConnection = {};
    spyOn(window, 'RTCPeerConnection').and.returnValue(fakeRtcPeerConnection);
  }));

  describe('RTCPeerConnection', function () {
    it('initializes with the passed config', function () {
      new PeerConnection({imma: 'config'});
      expect(RTCPeerConnection).toHaveBeenCalledWith({imma: 'config'});
    });
  });

  describe('onaddstream', function () {
    it('broadcasts rtc.addstream', function () {
      var pc = new PeerConnection({config: 'data'}, 14);

      var addStreamSpy = jasmine.createSpy('addStream');

      $scope.$on('rtc.addstream', addStreamSpy);
      pc.onaddstream({stream: 1});

      expect(addStreamSpy.calls.mostRecent().args[0].name).toEqual('rtc.addstream');
      expect(addStreamSpy.calls.mostRecent().args[1]).toEqual({stream: 1});
      expect(addStreamSpy.calls.mostRecent().args[2]).toEqual(pc);
    });
  });

  describe('onicecandidate', function () {
    it('ignores empty candidates', function () {
      var pc = new PeerConnection({config: 'data'}, 14);
      spyOn(Signaler, 'sendToPeer');
      pc.onicecandidate({});
      
      expect(Signaler.sendToPeer).not.toHaveBeenCalled();
    });

    it('sends valid candidates to its peer', function () {
      var pc = new PeerConnection({config: 'data'}, 14);
      spyOn(Signaler, 'sendToPeer');
      pc.onicecandidate({candidate: {sdpMLineIndex: 4, sdpMid: 3, candidate: 'some long sdp'}});
      
      expect(Signaler.sendToPeer).toHaveBeenCalledWith(14, {
        type: 'IceCandidateMessage',
        id: 3,
        label: 4,
        candidate: 'some long sdp'
      });
    });
  });
});
