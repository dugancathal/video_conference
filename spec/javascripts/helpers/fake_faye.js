function installFakeFaye(angularModule, angularInject) {
  var fayeClient = {};
  var Faye = {
    Client: function () {
      return fayeClient;
    }
  };

  angularModule(function ($provide) {
    $provide.value('Faye', Faye);
    $provide.constant('FAYE_URL', '/faye/url');
  });
  angularInject(function ($q) {
    fayeClient.subscribe = function () {
      this.subscription = $q.defer();
      return this.subscription.promise;
    };
    fayeClient.publish = jasmine.createSpy('publishSpy');
    fayeClient._clientId = 'fakeClientId';
  });

  return {Faye: Faye, fayeClient: fayeClient};
};
