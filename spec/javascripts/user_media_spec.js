describe('UserMedia', function () {
  beforeEach(module('video_conference'));

  var $rootScope, UserMedia, FakeGetUserMedia, successCallback, failureCallback;

  beforeEach(inject(function (_$rootScope_, _UserMedia_) {
    $rootScope = _$rootScope_;
    UserMedia = _UserMedia_;

    successCallback = undefined, failureCallback = undefined;
    FakeGetUserMedia = function (config, onSuccess, onFailure) {
      successCallback = onSuccess;
      failureCallback = onFailure;
    };
    spyOn(window, 'getUserMedia').and.callFake(FakeGetUserMedia);
  }));

  describe('.get', function () {
    it("retrieves the user's audio and video", function () {
      UserMedia.get();

      expect(window.getUserMedia.calls.first().args[0]).toEqual({audio: true, video: true});
    });

    it('returns a promise for success', function () {
      var didIt = false;
      UserMedia.get().then(function () { didIt = true });
      successCallback();
      $rootScope.$digest();

      expect(didIt).toBeTruthy();
    });

    it('returns a promise for failure', function () {
      var didIt = false;
      UserMedia.get().then(null, function () { didIt = true });
      failureCallback();
      $rootScope.$digest();

      expect(didIt).toBeTruthy();
    });
  });
});
