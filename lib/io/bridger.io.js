var Server    = require('socket.io');
var msgRouter = require('./msgrouter.io');

/*
 * The standard socket.io options:
 *
 * opts {
 *    ...
 * }
 */
function BridgerIO(srv, opts) {
    "use strict";
    if (!(this instanceof BridgerIO))  { return new BridgerIO(srv, opts); }

    Server.call(this, srv, opts);

    var allServices = this.services    = {};

    this.on('connection', function(socket) {
        Object.keys(allServices).forEach(function(routeName) {
            allServices[routeName].route(socket);
        });

        // Keep an eye on this
        //
        // Normally, when sending a message that isn't handled by the server, it is just
        // silently swallowed.
        //
        // This logic overrides that behavior and attempts to send an error when an attempt
        // to call a method that isn't registered is made.
        //
        // The source for this socket is in: socket.io/lib/socket.js
        var real_onevent = socket.onevent;
        var ignore = { "message": true, "disconnect": true, "error": true };
        socket.onevent = function(packet) {
            if(packet.data && packet.data.length) {
                if(this._events[packet.data[0]]) {
                    return real_onevent.call(this, packet);
                } else if(!ignore[packet.data[0]]) {
                    return this.ack(packet.id)({ error: { message: "Invalid request" }});
                }
            }

            real_onevent.call(this, packet);
        };

        socket.on('describe', function(msg, cb) {
            if(typeof msg === "function") {
                cb  = msg;
                msg = Object.keys(allServices);
            }

            if(msg === 'all') { msg = Object.keys(allServices); }
            else if(typeof msg === "string") { msg = [msg]; }

            var retVal = {};
            msg.forEach(function(service) {
                retVal[service] = (allServices[service] || { describe: function() {} }).describe(service);
            });

            cb({ result: retVal });
        });
    });
}

/*
 * Inherit from socket.io Server
 */
BridgerIO.prototype = Object.create(Server.prototype);
BridgerIO.prototype.constructor = BridgerIO;

/*
 * "A service defines a set of resources and actions that can be accessed via URI endpoints"
 *
 * In this case:
 * - Service is the logical name for a set of resources
 * - Resources is one or more API's (api being a set of methods or methods exposed on an object)
 * - URI endpoints corresponds to the individual methods on the provided Resource/API
 *
 * @param service   - logical name for the service
 * @param resources - Set of one or more APIs keyed by name
 * @param routerFn  - optional function that generates a new router that can be used to replace the
 *                    default router (msg) with ArgsRouter or one of your own. If supplied, each
 *                    call to expose **MUST** pass in a new instance of a Router
 * @param routes    - optional set of route handlers that can be used to enhance/override the base
 *                    route handling behavior
 *
 */
BridgerIO.prototype.expose = function expose(service, resources, routerFn, routes) {
    "use strict";
    var args = Array.prototype.slice.call(arguments);
    var router;

    if(typeof service   !== "string"  ) { throw new Error("Invalid service name"); }
    if(typeof resources !== "object"  ) { throw new Error("Invalid resource object"); }

    if(typeof routerFn  !== "function" && args.length === 3) {
        routes = routerFn;
        routerFn = msgRouter;
    }

    router = (routerFn || msgRouter)(service);
    router.expose(resources, routes);

    this.services[service] = router;
};

module.exports = BridgerIO;