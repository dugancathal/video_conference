# Test-Driven WebRTC with AngularJS

## ICE, STUN, and TURN (Oh my!)

It's finally time to dive into ICE (Interactive Connectivity Establishment). This protocol is all about finding way(s) for peers to communicate. In a perfect world, this would be as simple as routing from one computer to another. But today's internet is a veritable highway system of nodes and routes, making this a much more difficult task.

Let's start with a few possible configurations and work through them one by one.

1. Jim and Sally work in the same office and use the same network.

  This is by far the simplest case. ICE takes the simplest path and makes a direct connection, not routed through any external services. Each peer will advertise its address(es) to the other peer and negotiate which ports/addresses to use. Once the negotiation is complete, the connection occurs and communication can begin.

2. Marcy, who lives in California, and Vlad, who lives in Colorado, want to have a video conference from their homes, both behind routers on their home networks.

  Slightly more complex. Because Marcy and Vlad are both on separate networks, their computers don't have external IP addresses. In order to make the connection, ICE will look to an external server called a STUN server.

  > STUN (Session Traversal Utilities for NAT) is a standardized set of methods and a network protocol to allow an end host to discover its public IP address if it is located behind a NAT.
  >
  > http://en.wikipedia.org/wiki/STUN

  To continue the example, Marcy's computer needs to discover its external IP (and potentially port) so it can communicate publicly with Vlad's. It makes a call out to the configured STUN server(s) and requests one. Vlad's computer will do the same and, after they both have publicly discoverable addresses, ICE continues as normal.

3. Dorian, a tech working in a call center (behind a firewall which blocks STUN) needs to have a chat with Diana in her home.

  By far the most complex scenario. Because Dorian is behind a firewall, his system can't use STUN to determine its public information. This situation calls for TURN.

  > Traversal Using Relays around NAT (TURN) is a protocol that allows for a client behind a network address translator (NAT) or firewall to receive incoming data over TCP or UDP connections.
  >
  > http://en.wikipedia.org/wiki/TURN

  As the name suggests, TURN uses a publicly accessible relay server that streams all bandwidth between the peers. So instead of connecting their systems directly, Dorian's and Diana's computers will connect to the TURN server, and all communication between them will relay through there.

## ICE Candidates and SDP

To convey the information between peers,
