describe('PeerConnector', function () {
  beforeEach(module('video_conference'));

  var PeerConnector, PeerConnection, Signaler, Faye, fayeClient, fakePeerConnection, $scope, UserMedia;
  var offerDeferred, answerDeferred, setLocalDescriptionDeferred, setRemoteDescriptionDeferred;

  beforeEach(function () {
    PeerConnection = jasmine.createSpy('PeerConnection');
    fakePeerConnection = {};
    PeerConnection.and.returnValue(fakePeerConnection);

    module(function ($provide) {
      $provide.value('PeerConnection', PeerConnection)
    });

    var installation = installFakeFaye(module, inject);
    Faye = installation.Faye, fayeClient = installation.fayeClient;
  });

  beforeEach(inject(function (_PeerConnector_, _Signaler_, $q, $rootScope, _UserMedia_) {
    PeerConnector = _PeerConnector_;
    Signaler = _Signaler_;
    UserMedia = _UserMedia_;
    $scope = $rootScope.$new();

    fakePeerConnection.createOffer = function createOffer() {
      offerDeferred = $q.defer();
      return offerDeferred.promise;
    };
    fakePeerConnection.createAnswer = function createAnswer() {
      answerDeferred = $q.defer();
      return answerDeferred.promise;
    };
    fakePeerConnection.setLocalDescription = function setLocalDescription() {
      setLocalDescriptionDeferred = $q.defer();
      return setLocalDescriptionDeferred.promise;
    };
    fakePeerConnection.setRemoteDescription = function setRemoteDescription() {
      setRemoteDescriptionDeferred = $q.defer();
      return setRemoteDescriptionDeferred.promise;
    };
    fakePeerConnection.addStream = jasmine.createSpy('addStream');

    fakePeerConnection.addIceCandidate = jasmine.createSpy('addIceCandidate');
  }));

  describe('.createOffer', function () {
    beforeEach(function () {
      spyOn(Signaler, 'sendToPeer');
    });

    it('creates a peerConnection for the peerId', function () {
      PeerConnector.createOffer({my: 'config'}, 'peer-id');

      expect(PeerConnection).toHaveBeenCalledWith({my: 'config'}, 'peer-id');
    });

    it('adds the peerConnection to the list of peers', function () {
      PeerConnector.createOffer(null, 'my-peer-id');

      expect(PeerConnector.peers['my-peer-id']).toEqual(fakePeerConnection);
    });

    it('calls addStream with the UserMedia stream', function () {
      spyOn(UserMedia, 'getStream').and.returnValue('stream');
      PeerConnector.createOffer(null, 'my-peer-id');
      expect(fakePeerConnection.addStream).toHaveBeenCalledWith('stream');
    });

    it('calls createOffer on the peerConnection', function () {
      spyOn(fakePeerConnection, 'createOffer').and.callThrough();
      PeerConnector.createOffer();

      expect(fakePeerConnection.createOffer).toHaveBeenCalled();
    });

    it('sets the local description of the connection on resolution', function () {
      PeerConnector.createOffer();

      spyOn(fakePeerConnection, 'setLocalDescription').and.callThrough();
      offerDeferred.resolve({imma: 'local description'});
      $scope.$digest();

      expect(fakePeerConnection.setLocalDescription).toHaveBeenCalledWith({imma: 'local description'});
    });

    it('sends the description to the peerId after it is set locally', function () {
      PeerConnector.createOffer(null, 'peer-id');
      offerDeferred.resolve({imma: 'local description'});
      $scope.$digest();

      expect(Signaler.sendToPeer).not.toHaveBeenCalled();

      setLocalDescriptionDeferred.resolve();
      $scope.$digest();

      expect(Signaler.sendToPeer).toHaveBeenCalledWith('peer-id', {type: 'OfferDescriptionMessage', description: {imma: 'local description'}});
    });
  });

  describe('.createAnswer', function () {
    beforeEach(function () {
      spyOn(Signaler, 'sendToPeer');
    });

    it('creates a peerConnection for the peerId', function () {
      PeerConnector.createAnswer({my: 'config'}, 'peer-id', null);

      expect(PeerConnection).toHaveBeenCalledWith({my: 'config'}, 'peer-id');
    });

    it('adds the peerConnection to the list of peers', function () {
      PeerConnector.createAnswer(null, 'my-peer-id');

      expect(PeerConnector.peers['my-peer-id']).toEqual(fakePeerConnection);
    });

    it('calls addStream with the UserMedia stream', function () {
      spyOn(UserMedia, 'getStream').and.returnValue('stream');
      PeerConnector.createAnswer(null, 'my-peer-id');
      expect(fakePeerConnection.addStream).toHaveBeenCalledWith('stream');
    });

    it('sets the remote description of the connection', function () {
      spyOn(window, 'RTCSessionDescription').and.returnValue({fake: 'description'});
      spyOn(fakePeerConnection, 'setRemoteDescription').and.callThrough();
      PeerConnector.createAnswer(null, null, {imma: 'remote description'});

      expect(window.RTCSessionDescription).toHaveBeenCalledWith({imma: 'remote description'});
      expect(fakePeerConnection.setRemoteDescription).toHaveBeenCalledWith({fake: 'description'});
    });

    it('creates the answer after the remote description is set', function () {
      spyOn(fakePeerConnection, 'createAnswer').and.callThrough();
      PeerConnector.createAnswer(null, null, {imma: 'remote description'});

      setRemoteDescriptionDeferred.resolve();
      $scope.$digest();

      expect(fakePeerConnection.createAnswer).toHaveBeenCalled();
    });

    it('sets the answer as the local description', function () {
      spyOn(fakePeerConnection, 'setLocalDescription').and.callThrough();
      PeerConnector.createAnswer(null, null, {imma: 'remote description'});

      setRemoteDescriptionDeferred.resolve();
      $scope.$digest();

      answerDeferred.resolve({imma: 'local description'});
      $scope.$digest();

      expect(fakePeerConnection.setLocalDescription).toHaveBeenCalledWith({imma: 'local description'});
    });

    it('sends the answer to the peerId after it is set locally', function () {
      PeerConnector.createAnswer(null, 'peer-id');

      setRemoteDescriptionDeferred.resolve();
      $scope.$digest();

      answerDeferred.resolve({imma: 'local description'});
      $scope.$digest();

      expect(Signaler.sendToPeer).not.toHaveBeenCalled();

      setLocalDescriptionDeferred.resolve();
      $scope.$digest();

      expect(Signaler.sendToPeer).toHaveBeenCalledWith('peer-id', {type: 'AnswerDescriptionMessage', description: {imma: 'local description'}});
    });
  });

  describe('connect', function () {
    it('sets the remote description for a peer', function () {
      spyOn(window, 'RTCSessionDescription').and.returnValue({fake: 'description'});
      spyOn(fakePeerConnection, 'setRemoteDescription').and.callThrough();

      PeerConnector.peers['peer-id'] = fakePeerConnection;

      PeerConnector.connect('peer-id', {imma: 'remote description'});

      expect(window.RTCSessionDescription).toHaveBeenCalledWith({imma: 'remote description'});
      expect(fakePeerConnection.setRemoteDescription).toHaveBeenCalledWith({fake: 'description'});
    });
  });

  describe('addIceCandidateTo', function () {
    it('adds an ICE candidate for a peer', function () {
      spyOn(window, 'RTCIceCandidate').and.returnValue({fake: 'candidate'});

      PeerConnector.peers['peer-id'] = fakePeerConnection;

      PeerConnector.addIceCandidateTo('peer-id', {imma: 'candidate'});

      expect(window.RTCIceCandidate).toHaveBeenCalledWith({imma: 'candidate'});
      expect(fakePeerConnection.addIceCandidate).toHaveBeenCalledWith({fake: 'candidate'});
    });
  });
});