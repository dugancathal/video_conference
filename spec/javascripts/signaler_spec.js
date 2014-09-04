describe('Signaler', function () {
  beforeEach(module('video_conference'));

  var Signaler, Channel, Message, Faye, subscription;

  beforeEach(function () {
    var installation = installFakeFaye(module, inject);
    Faye = installation.Faye, fayeClient = installation.fayeClient;
  });

  beforeEach(inject(function (_Signaler_, _Channel_, _Message_, $q) {
    Signaler = _Signaler_;
    Channel = _Channel_;
    Message = _Message_;
  }));

  describe('.init', function () {
    it('initializes the channel', function () {
      spyOn(Channel, 'init').and.callThrough();
      Signaler.init('roomName');
      expect(Channel.init).toHaveBeenCalledWith('/faye/url', 'roomName');
    });

    it('subscribes to the channel', function () {
      spyOn(Channel, 'subscribe').and.callThrough();

      Signaler.init('roomName');

      expect(Channel.subscribe).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('returns the promise delivered by the subscription', inject(function ($rootScope) {
      var madeIt = false;
      Signaler.init('roomName').then(function () {
        madeIt = true;
      });

      fayeClient.subscription.resolve();
      $rootScope.$digest();

      expect(madeIt).toBeTruthy();
    }));
  });

  describe('.sendToRoom', function () {
    it('publishes the message to the room from the current clientId', function () {
      spyOn(Channel, 'publish').and.callThrough();

      Signaler.init();
      Signaler.sendToRoom({imma: 'message'});

      var expectedMessage = new Message({imma: 'message'});
      expectedMessage.from = 'fakeClientId';
      expect(Channel.publish).toHaveBeenCalledWith(expectedMessage);
    });

    it('does not duplicate the data attribute', function () {
      spyOn(Channel, 'publish').and.callThrough();
      Signaler.init();

      var message = new Message({imma: 'message'});
      message.to = 'fakePeerId';
      message.from = 'fakeClientId';
      Signaler.sendToRoom(message);

      expect(Channel.publish).toHaveBeenCalledWith(message);
    });
  });

  describe('.sendToPeer', function () {
    it("calls sendToRoom after setting the message's to attribute", function () {
      spyOn(Signaler, 'sendToRoom');

      Signaler.sendToPeer('peerId', {imma: 'message'});

      var expectedMessage = new Message({imma: 'message'});
      expectedMessage.to = 'peerId';
      expect(Signaler.sendToRoom).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe('onMessage', function () {
    it('instantiates the message type', function () {
      spyOn(Message, 'build');

      var onMessage;
      spyOn(Channel, 'subscribe').and.callFake(function (callback) {
        onMessage = callback;
      });

      Signaler.init('/my-room');

      onMessage.call(this, {type: 'IceCandidateMessage', message: 'content'});
      expect(Message.build).toHaveBeenCalledWith({type: 'IceCandidateMessage', message: 'content'});
    });
  });
});
