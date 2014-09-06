describe('Message', function () {
  var FakeMessage, Message, PeerConnectionConfig;

  beforeEach(module('video_conference', function ($provide) {
    FakeMessage = function FakeMessage() {};
    PeerConnectionConfig = jasmine.createSpy('PeerConnectionConfig');
    $provide.value('FakeMessage', FakeMessage);
    $provide.value('PeerConnectionConfig', PeerConnectionConfig);
    $provide.value('Faye', {});
    $provide.value('SAFE_MESSAGES', ['FakeMessage']);
  }));

  describe('Message.build', function () {
    beforeEach(inject(function (_Message_) {
      Message = _Message_;
    }));

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

  describe('AnnouncementMessage', function () {
    describe('#exec', function () {
      it('calls PeerConnector.createOffer', inject(function(AnnouncementMessage, PeerConnector) {
        var m = new AnnouncementMessage({to: 'you', from: 'me'});
        spyOn(PeerConnector, 'createOffer');

        PeerConnectionConfig.and.returnValue({config: 'value'});

        m.exec();

        expect(PeerConnector.createOffer).toHaveBeenCalledWith({config: 'value'}, 'me');
      }));
    });
  });

  describe('AnswerDescriptionMessage', function () {
    describe('#exec', function () {
      it('calls PeerConnector.connect', inject(function(AnswerDescriptionMessage, PeerConnector) {
        var m = new AnswerDescriptionMessage({to: 'you', from: 'me', description: 'imma description'});
        spyOn(PeerConnector, 'connect');

        m.exec();

        expect(PeerConnector.connect).toHaveBeenCalledWith('me', 'imma description');
      }));
    });
  });

  describe('OfferDescriptionMessage', function () {
    describe('#exec', function () {
      it('calls PeerConnector.createAnswer', inject(function(OfferDescriptionMessage, PeerConnector) {
        var m = new OfferDescriptionMessage({to: 'you', from: 'me', description: 'imma description'});
        spyOn(PeerConnector, 'createAnswer');

        PeerConnectionConfig.and.returnValue({config: 'value'});

        m.exec();

        expect(PeerConnector.createAnswer).toHaveBeenCalledWith({config: 'value'}, 'me', 'imma description');
      }));
    });
  });

  describe('IceCandidateMessage', function () {
    describe('#exec', function () {
      it('calls PeerConnector.addIceCandidateTo', inject(function(IceCandidateMessage, PeerConnector) {
        var m = new IceCandidateMessage({to: 'you', from: 'me', candidate: 'imma candidate'});
        spyOn(PeerConnector, 'addIceCandidateTo');

        m.exec();

        expect(PeerConnector.addIceCandidateTo).toHaveBeenCalledWith('me', {to: 'you', from: 'me', candidate: 'imma candidate'});
      }));
    });
  });
});
