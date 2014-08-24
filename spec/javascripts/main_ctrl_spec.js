describe('MainCtrl', function () {
  beforeEach(module('video_conference'));

  var $scope, FakeUserMedia;

  beforeEach(inject(function ($rootScope, _$controller_, $q) {
    $scope = $rootScope.$new();

    FakeUserMedia = {
      get: function () {
        mediaDeferred = $q.defer();
        return mediaDeferred.promise;
      }
    };

    $controller = _$controller_;
  }));

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

  describe('when the user declines', function () {
    it('sets a warning message', function () {
      $controller('MainCtrl', {$scope: $scope, UserMedia: FakeUserMedia});

      mediaDeferred.reject();
      $scope.$digest();

      expect($scope.errorMessage).toEqual("Uh oh, we couldn't get access to your camera. What'd you do?");
    });
  });
});
