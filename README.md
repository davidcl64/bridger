# bridger

A way to easily expose apis over socket.io (and perhaps in the future: sockjs and rest)

The code that exists currently "works for me" but is likely to change dramatically 
as this module progresses with no attempts being made to preserve backwards
compatiblity.

Currently the server supports one client initialization `BridgerIO_Client().bind(...)` per connection which for 
most use cases is just fine.  Calling it multiple times **may** work but hasn't been thoroughly tested and may 
provide unexpected results.

####You can do this:

    BridgerIO_Client().bind(socket, function(client) {...}

####You *might* be able to do this (untested at the moment):

    BridgerIO_Client().bind(socket, "svc1", function(client) {...}
    BridgerIO_Client().bind(socket, "svc2", function(client) {...}

####You **should definitely not** do this:

    // binds all services twice
    BridgerIO_Client().bind(socket, function(client1) {...}
    BridgerIO_Client().bind(socket, function(client2) {...}
    
####or this

    // binds all the same service twice
    BridgerIO_Client().bind(socket, "svc1" function(client1) {...}
    BridgerIO_Client().bind(socket, "svc1" function(client2) {...}

###Installing

The normal npm install will work however, this module relies on the upcoming 1.0 release of
socket.io.  You will need to install that manually!

###To Dos 

There is a lot left to do - with more that will come up as development progresses, but some near term items include

- Add hook (global and/or per method) capability to the routing logic to allow things like
  - access control
  - pre-call injection
  - post-call scrubbing
  - more...
- Add auto serving of client(s) with configuration (something like what socket.io provides)
- Bulletproof multiple clients/bind requests to either allow or fail fast (and in an obvious way)


###Contributions

Contributions of any kind (feature request, bug reports/fixes, pull requests, complaints, 
comments, 'why don't you just use x module instead') are all welcome.