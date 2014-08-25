# Test-Driven WebRTC with AngularJS

## Getting started

This section will walk you through getting a simple Ruby web app in place to host our
RTC project.

First, we'll start with some boilerplate. I'm running __Ruby 2.1.2__.

__Note: While it's not necessary at all to do this within a gem, I just like that
I get all the structure for free.__

```bash
bundle gem video_conference
cd video_conference
```

Add Sinatra, Thin, and Haml to your gemspec. You could start with WEBrick for now,
but we'll be needing Thin later, so might as well get that now. I also added Jasmine
and left the other defaults in place.

```ruby
spec.add_dependency 'sinatra', '~> 1.4.5'
spec.add_dependency 'thin', '~> 1.6.2'
spec.add_dependency 'haml', '~> 4.0.5'

spec.add_development_dependency "jasmine", "~> 2.0.2"
```

You'll also need a `config.ru` in the top level of the "gem".

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

And now, we can finally begin writing some RTC code.
