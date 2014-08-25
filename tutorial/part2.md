# Test-Driven WebRTC with AngularJS: signaling

Welcome back to our walkthrough of WebRTC. This time, we'll be discussing _signaling_:
the process by which browsers communicate prior to establishing an RTC connection.

## All in the background

If you ever read through the WebRTC spec (you probably should if you're going to
be doing anything serious with it), you'll notice that there is little to
no information about signaling. This is quite deliberate. By never enforcing a
signaling mechanism upon the developer, the W3C is effectively saying, "Do what's
right for you."

Here, we'll be using WebSockets and the awesome Ruby/JS library: [Faye](http://faye.jcoglan.com).
Faye is a pub-sub library built on the Bayeux protocol with support for Node.js and
Ruby. It's in use all over the place, including Heroku's new Websockets implementation.

Getting Faye setup is pretty simple and their website does a great job documenting
it, but for posterity's sake, here's what my `config.ru` looks like:

```ruby
#config.ru
require 'video_conference/app'
require 'faye'
Faye::WebSocket.load_adapter('thin')

map '/faye' do
  faye = Faye::RackAdapter.new(:mount => '/faye', :timeout => 25)
  run faye
end

map '/' do
  run Ruvidding::App
end
```

Don't forget to add `'faye'` to your `Gemfile`/`gemspec`, too.

_If you're using some other webserver, you just need all the lines relating to faye._

With that in place, you can just `rackup` and things should _almost_ work as expected.
Unfortunately, Faye requires you run it in "production" mode (due to some interesting
 Rack trickery). Since our app is super simple, that's just as easy as tacking `-E production`
 on the end of our `rackup`.

```bash
rackup -p 9292 -E production
```

## Playing around

Websockets can be pretty awesome if you've never played with them. I recommend
spending a few minutes fiddling in your browser console on the app page and familiarizing
yourself with the Faye APIs.

Faye has the concept of a _channel_ which in our WebRTC vernacular we can think of as
a _conference room_. You _subscribe_ to _channels_ with the `#subscribe` method after
you create a new `Faye.Client`. This method accepts both a channel name and a function
that gets called on receipt of each message to that room. It also returns a promise
that represents the _subscription_ to that _channel_.

```javascript
var client = new Faye.Client('/faye/faye');
var subscription = client.subscribe('/my-room', function (data) {
  console.log(data)
}).then(function () {
  console.log("I'm connected!")
});

client.publish('/my-room', {guess: 'what'});

subscription.cancel();
```

As you can see, you can also `#publish` to channels and `#cancel` subscriptions.

Pretty cool, right? Go ahead and play. I'll wait.

## A Faye service in Angular

While we could just initialize Faye outside of Angular and use it as a global,
that's not exactly the best practice. So for the remainder of this tutorial, we'll
get an Angular service in place that behaves like we need it to for our RTC purposes.

First things first, as RTC-ers, we really don't care about Faye - we care about signaling.
In the RTC spec, they talk about signaling over a channel, which is all Faye is to us.
So let's start off by setting something up at the right level of the abstraction stack.

We're going to create a `Channel` that will literally be just a wrapper over Faye.
Once we have this, we can mock it out in our `Signaler` specs easier. Because the
code and specs for this are super simple, I'm going to omit them here, but check out
the repo if you have any issues.

The `Signaler`, then, currently needs know how to do two things.

1. Send messages

  With our channel abstraction, this is really easy. We simply run `Client.publish` with
  the content of our choice. We'll also need to know who messages come from, so we'll include
  that information, too.

2. Listen selectively

  Because all of our peers will be listening to the same room, we need a way for our
  Signaler to only listen to messages sent to us.

Enter, the `Message` object. This Angular factory will be used to provide a common interface
over all messages we receive. It will have exactly three properties: `to`, `from`, and `data`.
Both the `to` and `from` fields will be `clientId`s from their respective Channels, and
the `data` field will just be some content that we need to send.

It's a super-simple data-object and it looks like this:

```javascript
angular.module('video_conference').factory('Message', function () {
  return function (data) {
    this.data = data.data || data;
    this.from = data.from;
    this.to = data.to;
  };
})
```

Right? Nothing to see here. Moving right along. Back to the Signaler.

In our specs, we're going to mock out Faye again. We could mock out Channel, but
we'd basically be implementing all of it over again as a fake, and that just seems
silly. After seeing the dual mocking, though, it's probably time to make a helper
that just does this for us. The code for this is nothing _too_ crazy, but you
do have to pass in the Angular `module` and `inject` functions to get access
to the various services and things we need to mock out Faye.

```javascript
// spec/javascripts/helpers/fake_faye.js
function installFakeFaye(angularModule, angularInject) {
  // make Faye.Client return fayeClient ...

  angularModule(function ($provide) {
    $provide.value('Faye', Faye);
    $provide.constant('FAYE_URL', '/faye/url');
  });
  angularInject(function ($q) {
    // fayeClient.subscribe = ..., etc.
  });

  return {Faye: Faye, fayeClient: fayeClient};
};
```

With this, our Signaler specs fall neatly into place. We basically just test
that Channel gets used correctly and that the Signaler returns the right things
(promises and the like).

```javascript
// spec/javascripts/signaler_spec.js
describe('init', function () {
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

// ...

describe('sendToRoom', function () {
  it('publishes the message to the room from the current clientId', function () {
    spyOn(Channel, 'publish').and.callThrough();

    Signaler.init();
    Signaler.sendToRoom({imma: 'message'});

    var expectedMessage = new Message({imma: 'message'});
    expectedMessage.from = 'fakeClientId';
    expect(Channel.publish).toHaveBeenCalledWith(expectedMessage);
  });
});
```

Our finished Signaler looks like this:

```javascript
angular.module('video_conference').service('Signaler', ['Channel', 'Message', 'FAYE_URL',
  function (Channel, Message, FAYE_URL) {
    return {
      init: function (roomName) {
        Channel.init(FAYE_URL, roomName);
        return Channel.subscribe(function (message) {
          console.log('received', message);
        });
      },
      sendToRoom: function (content) {
        var message = new Message(content);
        message.from = Channel.clientId();
        Channel.publish(message);
      },
      sendToPeer: function (peerId, content) {
        var message = new Message(content);
        message.to = peerId;
        this.sendToRoom(message);
      }
    };
  }
]);
```

For now, all we're going to do on receipt of a message is log it to the console.
Later, we'll add some logic that will let us ignore messages that aren't to us, as
well as act on the content of messages. _It turns out ignoring messages is actually
really important, but you can probably see how it's going to be done._

To test out the Signaler in the browser, you can inject it into the `MainCtrl` we made
earlier and muck around with it. It'll probably look something like:

```javascript
Signaler.init('/my-room-name').then(function () {
  Signaler.sendToRoom({my: 'message'});
});

// console: received Object {data: {my: "message"}, from: "d4bcbqdjijrxit2v9c7xr62380i9qug"}
```

## One step closer

And with that, we're one step closer to our end goal. We now have a signaling mechanism
that lets us send messages to a room or a remote peer. Because Faye is awesome,
this will actually continue to work in a non-websocket environment, too (albeit much
slower).

In the next post, we'll look at the work flow for starting an RTC video using
the Signaler and break down the different messages that we'll be sending.
