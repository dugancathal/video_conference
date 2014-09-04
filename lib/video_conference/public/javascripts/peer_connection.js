angular.module('video_conference')
  .factory('PeerConnection', ['Signaler', '$rootScope', function (Signaler, $rootScope) {
    return function PeerConnection(config, peerId) {
      var connection = new RTCPeerConnection(config);

      connection.onicecandidate = function onicecandidate(event) {
        if (!event.candidate) { return; }
        Signaler.sendToPeer(peerId, {
          type: 'IceCandidateMessage',
          id: event.candidate.sdpMid,
          label: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate
        });
      };

      connection.onaddstream = function onaddstream(event) {
        $rootScope.$broadcast('rtc.addstream', event, this);
      };

      return connection;
    };
  }]);