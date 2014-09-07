require 'video_conference/app'
require 'faye'
require 'newrelic_rpm'
NewRelic::Agent.after_fork(:force_reconnect => true)
GC::Profiler.enable

Faye::WebSocket.load_adapter('thin')

map '/faye' do
  faye = Faye::RackAdapter.new(:mount => '/faye', :timeout => 25)
  run faye
end

map '/' do
  run VideoConference::App
end
