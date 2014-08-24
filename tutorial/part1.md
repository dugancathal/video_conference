# Test-Driven WebRTC with AngularJS

One of the newest and most exciting web technologies we're working with now-a-days
is WebRTC. In the browsers that support it, this collection of APIs lets
web developers capture audio and video from the browser and stream them peer-to-peer
with no additional plugins.

This series of posts will walk you through the creation of a simple video conferencing
app using both WebRTC and AngularJS, as well as hopefully cover some of the
lesser-explained pieces of WebRTC. Anyone that wants to follow along at the
command line can [clone the repo](https://github.com/dugancathal/video_conference).

## Getting started

First, we'll start with some boilerplate; let's get a simple web-app going. I'm
running __Ruby 2.1.2__.

__Note: While it's not necessary at all to do this within a gem, I just like that
I get all the structure for free.__

```bash
bundle gem video_conference
cd video_conference
```

Add Sinatra, Thin, and Haml to your gemspec. You could start with WEBrick for now,
but we'll be needing Thin later, so might as well start there. I also added Jasmine
and left the defaults in place.

```ruby
spec.add_dependency 'sinatra', '~> 1.4.5'
spec.add_dependency 'thin', '~> 1.6.2'
spec.add_dependency 'haml', '~> 4.0.5'

spec.add_development_dependency "jasmine", "~> 2.0.2"
```

You'll also need a `config.ru` in the top level of our "gem".

```ruby
require 'video_conference/app'

map '/' do
  run VideoConference::App
end
```

As you can tell from that previous snippet, we'll need an App class. Let's add that now.

```ruby
# lib/video_conference/app.rb
require 'sinatra/base'

module VideoConference
  class App < Sinatra::Base
    get '/' do
      haml :index
    end
  end
end
```

This makes a few assumptions about the structure of our project, and gives a few
things for free:

1. There is a `views` directory in at the same level as our App class.
2. There is a `public` directory at the same level as our App class that will get
   served directly.
3. There is an `index.haml` file in our `views` directory that will get served
   when we visit '/'.
4. There is an (optional) `layout.haml` file in our `views` directory that calls
   `yield` somewhere in it.

Let's go ahead and make a simple `layout.haml` and `index.haml`.

```haml
# lib/video_conference/views/layout.haml
!!! html
%html
  %head
    %title Video Conference
    %link(href='/stylesheets/app.css' rel='stylesheet' type='text/css')

    %script(src='/javascripts/vendor/jquery.js' type='text/javascript')
    %script(src='/javascripts/vendor/adapter.js' type='text/javascript')
    %script(src='/javascripts/vendor/angular.js' type='text/javascript')
  %body
    %h1 Video Conference
    = yield
```

```haml
# lib/video_conference/views/index.haml
.container
  #local-video
```

You may have noticed up above that we've got a few vendored JS files including
[jquery](http://code.jquery.com/jquery-2.1.1.min.js), [angular](https://code.angularjs.org/1.3.0-beta.19/angular.js), and something weird called [adapter](https://webrtc.googlecode.com/svn/stable/samples/js/base/adapter.js).
This adapter is a polyfill that gets all browsers on the same page (or at least Chrome
and Firefox). You can download all these with a few curl commands:

```bash
curl https://webrtc.googlecode.com/svn/stable/samples/js/base/adapter.js > lib/video_conference/public/javascripts/vendor/adapter.js
curl https://code.angularjs.org/1.3.0-beta.19/angular.js > lib/video_conference/public/javascripts/vendor/angular.js
curl https://code.jquery.com/jquery-2.1.1.min.js > lib/video_conference/public/javascripts/vendor/jquery.js
```

Now, if you run `rackup -p 9292`, you can see our handiwork in action at
`http://localhost:9292`.

For those that don't feel like typing, you can see the app so far by cloning the repo
and checking out the `step1` tag.

## The fun stuff

Now that we have a place to put our videos, we can actually get on to the
real work.

### Well, almost.

Let's get Jasmine set up first.

    jasmine init

Then we'll need to update the location of your `src_files` so Jasmine can find
our code. Leave all the other defaults in place.

```yaml
# spec/javascripts/support/jasmine.yml
# ...
src_files:
  - lib/video_conference/public/javascripts/**/*.js
# ...
```

We can finally begin writing some RTC code.

### Video on the page

The RTC APIs define one very handy function for retrieving a user's media, aptly
named `getUserMedia`. Of course, it's not so easy most of the time (both Chrome and
Firefox have it under a vendor prefix), but because of the `adapter` we included
earlier, we can ignore that.

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
video element. We'll update our `index.haml` template to show it. (Don't forget
to add a script tag to the `layout.haml` to include our JS code).

Also, in the event the user decides _not_ to grant us permission to use their media devices,
our promise will be rejected and we let them know they did something silly. The
rejection is passed an error from RTC, but at this point, we really don't care _why_
we can't get media, we just care that we didn't.

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

And there it is, part 1 complete in two steps - kind of. This is tagged on the repo
as `step2` for those following along.

In the next part of the series, we'll work on signalling: the process by which
the browsers will exchange initial information before they actually form a peer-to-peer
connection.
