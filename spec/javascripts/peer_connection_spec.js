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
      pc.connection.onaddstream({stream: 1});

      expect(addStreamSpy.calls.mostRecent().args[0].name).toEqual('rtc.addstream');
      expect(addStreamSpy.calls.mostRecent().args[1]).toEqual({stream: 1});
      expect(addStreamSpy.calls.mostRecent().args[2]).toEqual(pc);
    });
  });

  describe('onicecandidate', function () {
    it('ignores empty candidates', function () {
      var pc = new PeerConnection({config: 'data'}, 14);
      spyOn(Signaler, 'sendToPeer');
      pc.connection.onicecandidate({});
      
      expect(Signaler.sendToPeer).not.toHaveBeenCalled();
    });

    it('sends valid candidates to its peer', function () {
      var pc = new PeerConnection({config: 'data'}, 14);
      spyOn(Signaler, 'sendToPeer');
      pc.connection.onicecandidate({candidate: {sdpMLineIndex: 4, sdpMid: 3, candidate: 'some long sdp'}});
      
      expect(Signaler.sendToPeer).toHaveBeenCalledWith(14, {
        type: 'IceCandidateMessage',
        id: 3,
        label: 4,
        candidate: 'some long sdp'
      });
    });
  });

  describe('createOffer', function () {
    it('creates a promise for connection.createOffer', function () {
      var onSuccess, onError;
      fakeRtcPeerConnection.createOffer = function createOffer(success, error) {
        onSuccess = success;
        onError = error;
      };

      var pc = new PeerConnection({}, 12);
      var successFn = jasmine.createSpy('successCallback'), errorFn = jasmine.createSpy('errorCallback');

      pc.createOffer().then(successFn, null);

      onSuccess();
      $scope.$digest();
      expect(successFn).toHaveBeenCalled();

      pc.createOffer().then(null, errorFn);

      onError();
      $scope.$digest();
      expect(errorFn).toHaveBeenCalled();
    });
  });

  describe('createAnswer', function () {
    it('creates a promise for connection.createAnswer', function () {
      var onSuccess, onError;
      fakeRtcPeerConnection.createAnswer = function createAnswer(success, error) {
        onSuccess = success;
        onError = error;
      };

      var pc = new PeerConnection({}, 12);
      var successFn = jasmine.createSpy('successCallback'), errorFn = jasmine.createSpy('errorCallback');

      pc.createAnswer().then(successFn, null);

      onSuccess();
      $scope.$digest();
      expect(successFn).toHaveBeenCalled();

      var pc = new PeerConnection({}, 12);
      pc.createAnswer().then(null, errorFn);

      onError();
      $scope.$digest();
      expect(errorFn).toHaveBeenCalled();
    });
  });

  describe('setLocalDescription', function () {
    it('creates a promise for connection.setLocalDescription', function () {
      var description, onSuccess, onError;
      fakeRtcPeerConnection.setLocalDescription = function setLocalDescription(descr, success, error) {
        description = descr;
        onSuccess = success;
        onError = error;
      };

      var pc = new PeerConnection({}, 12);
      var successFn = jasmine.createSpy('successCallback'), errorFn = jasmine.createSpy('errorCallback');

      pc.setLocalDescription('description').then(successFn, null);

      expect(description).toEqual('description');

      onSuccess();
      $scope.$digest();
      expect(successFn).toHaveBeenCalled();

      pc.setLocalDescription().then(null, errorFn);

      onError();
      $scope.$digest();
      expect(errorFn).toHaveBeenCalled();
    });
  });

  describe('setRemoteDescription', function () {
    it('creates a promise for connection.setRemoteDescription', function () {
      var description, onSuccess, onError;
      fakeRtcPeerConnection.setRemoteDescription = function setRemoteDescription(descr, success, error) {
        description = descr;
        onSuccess = success;
        onError = error;
      };

      var pc = new PeerConnection({}, 12);
      var successFn = jasmine.createSpy('successCallback'), errorFn = jasmine.createSpy('errorCallback');

      pc.setRemoteDescription('description').then(successFn, null);

      expect(description).toEqual('description');

      onSuccess();
      $scope.$digest();
      expect(successFn).toHaveBeenCalled();

      pc.setRemoteDescription().then(null, errorFn);

      onError();
      $scope.$digest();
      expect(errorFn).toHaveBeenCalled();
    });
  });

  describe('addIceCandidate', function () {
    it('adds an ICE candidate to the connection', function () {
      fakeRtcPeerConnection.addIceCandidate = function () {};
      spyOn(fakeRtcPeerConnection, 'addIceCandidate');

      var pc = new PeerConnection({}, 12);
      pc.addIceCandidate({candidate: 'sdp'});

      expect(fakeRtcPeerConnection.addIceCandidate).toHaveBeenCalledWith({candidate: "sdp"});
    });
  });

  describe('afterDescriptionSent', function () {
    describe('on offering peer', function () {
      it('uses the offer deferred', function () {
        var onSuccess;
        fakeRtcPeerConnection.createOffer = function createOffer(success) {
          onSuccess = success;
        };

        var pc = new PeerConnection();
        var successFn = jasmine.createSpy('successCallback');

        pc.createOffer();
        pc.afterDescriptionSent().then(successFn);

        onSuccess();
        $scope.$digest();
        expect(successFn).toHaveBeenCalled();
      });
    });

    describe('on answering machine', function () {
      it('uses the answer deferred', function () {
        var onSuccess;
        fakeRtcPeerConnection.createAnswer = function createAnswer(success) {
          onSuccess = success;
        };

        var pc = new PeerConnection();
        var successFn = jasmine.createSpy('successCallback');

        pc.afterDescriptionSent().then(successFn);

        expect(successFn).not.toHaveBeenCalled();
        pc.createAnswer();

        onSuccess();
        $scope.$digest();
        expect(successFn).toHaveBeenCalled();
      });
    });
  });
});
