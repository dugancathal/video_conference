describe('MainCtrl', function () {
  var $scope, FakeUserMedia, Signaler, initDeferred, mediaDeferred, roomNameFactory;

  beforeEach(module('video_conference', function ($provide) {
    Signaler = {
      init: function () {},
      sendToRoom: function () {}
    };
    roomNameFactory = jasmine.createSpy('ROOM_NAME');
    $provide.value('Signaler', Signaler);
    $provide.value('ROOM_NAME', roomNameFactory);
  }));

  beforeEach(inject(function ($rootScope, _$controller_, $q) {
    $scope = $rootScope.$new();

    Signaler.init = function init() {
      return (initDeferred = $q.defer()).promise;
    };

    FakeUserMedia = {
      get: function () {
        mediaDeferred = $q.defer();
        return mediaDeferred.promise;
      }
    };

    $controller = _$controller_;
  }));

  describe('User media retrieval', function () {
    it("retrieves the user's media", function () {
      spyOn(FakeUserMedia, 'get').and.callThrough();
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});
      expect(FakeUserMedia.get).toHaveBeenCalled();
    });

    it('gets the url after media is retrieved', function () {
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});

      expect($scope.url).toBeFalsy();

      var stream = new Blob();
      mediaDeferred.resolve(stream);
      $scope.$digest();

      expect($scope.url).toBeTruthy();
    });

    it('uses $sce to trust the URL', function () {
      var fakeSce = jasmine.createSpyObj('$sce', ['trustAsResourceUrl']);
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia, $sce: fakeSce});

      var stream = new Blob();
      mediaDeferred.resolve(stream);
      $scope.$digest();

      expect(fakeSce.trustAsResourceUrl.calls.first().args[0]).toMatch(/^blob/)
    });

    it('sends an announcement message', function () {
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia, Signaler: Signaler});

      spyOn(Signaler, 'sendToRoom');

      mediaDeferred.resolve(new Blob());
      $scope.$digest();

      initDeferred.resolve();
      $scope.$digest();

      expect(Signaler.sendToRoom).toHaveBeenCalledWith({type: 'AnnouncementMessage'});
    });

    it('uses the ROOM_NAME to init the Signaler', function () {
      spyOn(Signaler, 'init').and.callThrough();
      roomNameFactory.and.returnValue('/room-name');

      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});
      mediaDeferred.resolve(new Blob());
      $scope.$digest();

      expect(Signaler.init).toHaveBeenCalledWith('/room-name');
    });

    describe('when the user declines', function () {
      it('sets a warning message', function () {
        $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});

        mediaDeferred.reject();
        $scope.$digest();

        expect($scope.errorMessage).toEqual("Uh oh, we couldn't get access to your camera. What'd you do?");
      });
    });
  });

  describe('addStream', function () {
    it('adds the stream URL to the list', function () {
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});

      spyOn(window.URL, 'createObjectURL').and.returnValue('stream');
      $scope.addStream('stream');

      expect($scope.streamUrls[0].$$unwrapTrustedValue()).toEqual('stream');
    });
  });

  describe('on rtc.addstream', function () {
    it('calls addStream', function () {
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});
      spyOn($scope, 'addStream');

      var media = {stream: 'stuff'};
      $scope.$broadcast('rtc.addstream', media);
      $scope.$digest();

      expect($scope.addStream).toHaveBeenCalledWith('stuff');
    });
  });
});
