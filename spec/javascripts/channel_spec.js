describe('Channel', function () {
  beforeEach(module('video_conference'));

  var Channel, Faye, fayeClient;

  beforeEach(function () {
    var installation = installFakeFaye(module, inject);
    Faye = installation.Faye, fayeClient = installation.fayeClient;

    inject(function (_Channel_) {
      Channel = _Channel_;
    });
  });

  describe('.init', function () {
    it('sets the room', function () {
      Channel.init(null, '/my/room');

      expect(Channel.getRoom()).toEqual('/my/room');
    });

    it('creates the Faye Client', function () {
      spyOn(Faye, 'Client');
      Channel.init('/my/faye');

      expect(Faye.Client).toHaveBeenCalledWith('/my/faye');
    });
  });

  describe('.subscribe', function () {
    it('subscribes to the current room and sets the handler', function () {
      spyOn(fayeClient, 'subscribe');
      Channel.init(null, '/my/room');
      var messageHandler = {imma: 'spy'};
      Channel.subscribe(messageHandler);

      expect(fayeClient.subscribe).toHaveBeenCalledWith('/my/room', {imma: 'spy'});
    });
  });

  describe('.publish', function () {
    it('publishes the message to the current room', function () {
      Channel.init(null, '/my/room');
      var message = {imma: 'spy'};
      Channel.publish(message);

      expect(fayeClient.publish).toHaveBeenCalledWith('/my/room', {imma: 'spy'});
    });
  });

  describe('.clientId', function () {
    it('returns the clientId', function () {
      Channel.init();

      expect(Channel.clientId()).toEqual('fakeClientId');
    });
  });
});
