angular.module('video_conference')
  .factory('PeerConnection', ['Signaler', '$rootScope', '$q', function (Signaler, $rootScope, $q) {
    return function PeerConnection(config, peerId) {
      var PC = this;
      this.peerId = peerId;
      this.connection = new RTCPeerConnection(config);

      this.connection.onicecandidate = function onicecandidate(event) {
        if (!event.candidate) { return; }
        Signaler.sendToPeer(PC.peerId, {
          type: 'IceCandidateMessage',
          id: event.candidate.sdpMid,
          label: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate
        });
      };

      this.connection.onaddstream = function onaddstream(event) {
        $rootScope.$broadcast('rtc.addstream', event, PC);
      };

      this.addStream = function addStream(stream) {
        this.connection.addStream(stream);
      };

      this.createOffer = function createOffer() {
        var offerDeferred = $q.defer();
        this.connection.createOffer(offerDeferred.resolve, offerDeferred.reject);
        return offerDeferred.promise;
      };

      this.createAnswer = function createOffer() {
        var answerDeferred = $q.defer();
        this.connection.createAnswer(answerDeferred.resolve, answerDeferred.reject);
        return answerDeferred.promise;
      };

      this.setLocalDescription = function setLocalDescription(description) {
        var setLocalDeferred = $q.defer();
        this.connection.setLocalDescription(description, setLocalDeferred.resolve, setLocalDeferred.reject);
        return setLocalDeferred.promise;
      };

      this.setRemoteDescription = function setRemoteDescription(description) {
        var setRemoteDeferred = $q.defer();
        this.connection.setRemoteDescription(description, setRemoteDeferred.resolve, setRemoteDeferred.reject);
        return setRemoteDeferred.promise;
      };

      this.addIceCandidate = function addIceCandidate(candidate) {
        this.connection.addIceCandidate(candidate);
      };
    };
  }
]);