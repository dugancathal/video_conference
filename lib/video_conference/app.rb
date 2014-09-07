require 'sinatra/base'

module VideoConference
  class App < Sinatra::Base
    get '/' do
      redirect to('/vids/new')
    end

    get '/vids/new' do
      haml :new
    end

    post '/vids' do
      redirect to("/vids/#{params['name']}")
    end

    get '/vids/:name' do
      @name = params[:name]
      haml :show
    end
  end
end
