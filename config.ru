require 'video_conference/app'
require 'faye'
require 'newrelic_rpm'
require 'new_relic/agent/instrumentation/rack'
NewRelic::Agent.after_fork(:force_reconnect => true)
GC::Profiler.enable

Faye::WebSocket.load_adapter('thin')

class NewRelicMiddleWare < Struct.new(:app)
  def call(env)
    app.call(env)
  end
  include ::NewRelic::Agent::Instrumentation::Rack
end

map '/faye' do
  faye = Faye::RackAdapter.new(:mount => '/faye', :timeout => 25)
  use NewRelicMiddleWare
  run faye
end

map '/' do
  run VideoConference::App
end
