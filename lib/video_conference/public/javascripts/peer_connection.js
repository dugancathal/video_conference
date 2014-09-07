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

      this.answerDeferred = $q.defer();

      this.connection.onaddstream = function onaddstream(event) {
        $rootScope.$broadcast('rtc.addstream', event, PC);
      };

      this.addStream = function addStream(stream) {
        this.connection.addStream(stream);
      };

      this.createOffer = function createOffer() {
        this.offerDeferred = $q.defer();
        this.connection.createOffer(this.offerDeferred.resolve, this.offerDeferred.reject);
        return this.offerDeferred.promise;
      };

      this.createAnswer = function createOffer() {
        this.connection.createAnswer(this.answerDeferred.resolve, this.answerDeferred.reject);
        return this.answerDeferred.promise;
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

      this.afterDescriptionSent = function afterDescriptionSent() {
        return (this.offerDeferred || this.answerDeferred).promise;
      }
    };
  }
]);