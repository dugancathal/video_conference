angular.module('video_conference')
  .service('PeerConnector', ['PeerConnection', 'Signaler', 'UserMedia', 'PeerConnectionConfig',
    function (PeerConnection, Signaler, UserMedia, PeerConnectionConfig) {
      var peers = {};

      return {
        createOffer: function createOffer(peerId) {
          var connection = this.getPeer(peerId);

          connection.createOffer().then(function (description) {
            connection.setLocalDescription(description).then(function () {
              Signaler.sendToPeer(peerId, {type: 'OfferDescriptionMessage', description: description});
            });
          });
        },
        createAnswer: function createAnswer(peerId, remoteDescription) {
          var connection = this.getPeer(peerId);

          var remoteDescr = new RTCSessionDescription(remoteDescription);
          connection.setRemoteDescription(remoteDescr).then(function () {
            connection.createAnswer().then(function (localDescription) {
              connection.setLocalDescription(localDescription).then(function () {
                Signaler.sendToPeer(peerId, {type: 'AnswerDescriptionMessage', description: localDescription});
              });
            });
          });
        },
        connect: function connect(peerId, remoteDescription) {
          var remoteDescr = new RTCSessionDescription(remoteDescription);
          this.getPeer(peerId).setRemoteDescription(remoteDescr);
        },
        addIceCandidateTo: function addIceCandidateTo(peerId, candidate) {
          var that = this;
          this.getPeer(peerId).afterDescriptionSent().then(function () {
            var iceCandidate = new RTCIceCandidate(candidate);
            that.getPeer(peerId).addIceCandidate(iceCandidate);
          });
        },
        getPeer: function getPeer(peerId) {
          if(peers[peerId]) { return peers[peerId]; }

          peers[peerId] = new PeerConnection(new PeerConnectionConfig(), peerId);
          peers[peerId].addStream(UserMedia.getStream());
          return peers[peerId];
        }
      };
    }
  ]);