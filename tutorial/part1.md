# Test-Driven WebRTC with AngularJS: GetUserMedia

One of the newest and most exciting web technologies we're working with now-a-days
is WebRTC. In the browsers that support it, this collection of APIs lets
web developers capture audio and video from the browser and stream them peer-to-peer
with no additional plugins.

This series of posts will walk you through the creation of a simple video conferencing
app using both WebRTC and AngularJS, as well as hopefully cover some of the
lesser-explained pieces of WebRTC. Anyone that wants to follow along at the
command line can [clone the repo](https://github.com/dugancathal/video_conference).

## Video on the page

_I'm assuming here that you already have a web server of some sort in place for all of
the code below. If you don't, take a look at the [setup](setup.md) tutorial._

The RTC APIs define one very handy function for retrieving a user's media, aptly
named `getUserMedia`. Of course, it's not so easy most of the time (both Chrome and
Firefox have it under a vendor prefix), but Google provides an `adapter` file that
shims the APIs across Firefox and Chrome

And now ... it's time for a test! Really, there are two things that we need to
make sure of:

1. That we ask for the right permissions in our config.

  ```javascript
  // spec/javascripts/user_media_spec.js
  describe('UserMedia', function () {
    // ...
    describe('.get', function () {
      it("calls getUserMedia with the right config", function () {
        UserMedia.get();
        expect(window.getUserMedia.calls.first().args[0]).toEqual({video: true, audio: true});
      });
    });
  });
  ```

2. That we provide ourselves a hook into the success (or failure) of receiving
   the media. We'll do that using a promise. __Warning: If you've never seen
   Angular-Jasmine specs before, this will be hairy.__

   ```javascript
   // spec/javascripts/user_media_spec.js
   describe('UserMedia', function () {
     // ...
     var FakeGetUserMedia;
     beforeEach(function () {
       // ...
       FakeGetUserMedia = function (config, onSuccess, onFailure) { /*stuff*/ };
       spyOn(window, 'getUserMedia').and.callFake(FakeGetUserMedia);
     });

     describe('.get', function () {
       // ...
       it("calls a promise resolution on success", function () {
          var weDidIt = false;
          UserMedia.get().then(function () { weDidIt = true; });
          successCallback();
          $rootScope.$digest();

          expect(weDidIt).toBeTruthy();
       });
     });
   });
   ```

I've clearly left out some things, but trust me, we're making progress here. We can
now write some Angular that lets us grab the user's camera and microphone.

```javascript
// lib/video_conference/public/javascripts/app.js
angular.module('video_conference', [])
  .service('UserMedia', ['$q', function ($q) {
    return {
      get: function () {  
        var mediaDeferred = $q.defer();
        getUserMedia({video: true, audio: true}, mediaDeferred.resolve, mediaDeferred.reject);
        return mediaDeferred.promise;
      }
    };
  }])
```

Then, we can add a controller to make it appear on the page. Specs first, of course.

```javascript
// spec/javascripts/main_ctrl_spec.js
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
```

There are more specs than this, but these two cover the interesting bits.
The first is that the promise our service returns is resolved with the stream
representing the local user's media. We pass this to the built-in function
`URL.createObjectURL` which returns a blob URL.

By default, Angular does white-listing of any content that actually
makes it out of the controller. One of the things Angular doesn't trust is blob
URLs, like the one we get from WebRTC. In order to set the `src` attribute of
our `<video>`, we need to make Angular trust us. We can do this using Angular's
`$sce` service and its `#trustAsResourceUrl` method.

After we obtain a 'safe' URL for our local media stream, we can place it in a
video element. We'll update our HTML template to show it.

Also, in the event the user decides _not_ to grant us permission to use their media devices,
our promise will be rejected and we let them know they did something silly. The
rejection is also passed an error from RTC, but at this point, we really don't
care _why_ we can't get media, we just care that we didn't.

```javascript
// lib/video_conference/public/javascripts/app.js
// ...
.controller('MainCtrl', ['$scope', '$sce', 'UserMedia',
  function ($scope, $sce, UserMedia) {
    UserMedia.get().then(function (stream) {
      $scope.url = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
    }, function () {
      $scope.errorMessage = "What'd you do?!";
    });
  }
]);
```

```haml
# lib/video_conference/views/index.haml
.container
  #local-video
    %video(ng-if='url' muted='muted' autoplay='autoplay' controls='controls' ng-src='{{url}}')
    %p(ng-if='errorMessage') {{errorMessage}}
```

After starting the server (if you didn't already have it started), you should now
have a browser prompt requesting access to your camera. If you click 'Accept',
you'll then be faced with, well, your face.

## There you have it

The code up to this point is tagged on the repo as `step2` for those following along.

In the next part of the series, we'll work on signaling: the process by which
the browsers will exchange initial information before they actually form a peer-to-peer
connection.
