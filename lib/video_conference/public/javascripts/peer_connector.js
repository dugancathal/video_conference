angular.module('video_conference')
  .service('PeerConnector', ['PeerConnection', 'Signaler', 'UserMedia',
    function (PeerConnection, Signaler, UserMedia) {
    var peers = {};
    return {
      createOffer: function createOffer(config, peerId) {
        var connection = new PeerConnection(config, peerId);
        connection.addStream(UserMedia.getStream());
        peers[peerId] = connection;

        connection.createOffer().then(function (description) {
          connection.setLocalDescription(description).then(function () {
            Signaler.sendToPeer(peerId, {type: 'OfferDescriptionMessage', description: description});
          });
        });
      },
      createAnswer: function createAnswer(config, peerId, remoteDescription) {
        var connection = new PeerConnection(config, peerId);
        connection.addStream(UserMedia.getStream());
        peers[peerId] = connection;

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
        peers[peerId].setRemoteDescription(remoteDescr);
      },
      addIceCandidateTo: function addIceCandidateTo(peerId, candidate) {
        var iceCandidate = new RTCIceCandidate(candidate);
        peers[peerId].addIceCandidate(iceCandidate);
      },
      peers: peers
    };
  }
]);