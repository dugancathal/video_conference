require 'sinatra/base'

module VideoConference
  class App < Sinatra::Base
    get '/' do
      haml :index
    end
  end
end
