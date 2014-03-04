
function methods(module) {
    "use strict";
    return Object.keys(module).filter(function(name) { return typeof module[name] === "function"; });
}

function handler(resources, api) {
    "use strict";
    return function handler(method, args, socket, cb) {
        if(!resources[api][method]) {
            return cb({error: {message: "Invalid request to unknown endpoint"}});
        }

        args = args.slice();
        args.push(function(err, result) {
            cb({ error: err, result: result });
        });

        resources[api][method].apply(resources[api], args);
    };
}

// Because args router relies on a single 'invoke' message', it needs to keep track of
// routes globally.
var allRoutes = {};

function Router(serviceName) {
    "use strict";
    if(!this instanceof Router) { return new Router(serviceName); }

    this.serviceName = serviceName;
}

Router.prototype.constructor = Router;

/*
 * @param model  - mongoquick model
 * @param routes - optional, path to routes that override default behavior
 */
Router.prototype.expose = function expose(resources, routes) {
    "use strict";
    this.resources = resources;

    allRoutes[this.serviceName] = allRoutes[this.serviceName] || {};
    var self = this;
    Object.keys(resources)
        .filter(function(api) { return resources[api].expose; })
        .forEach(function(api) {
            var curModule;

            // If there is a module under routes, it is overriding some or all of
            // the default behavior.
            curModule = routes ? require(routes) : {};

            allRoutes[self.serviceName][api] = {
                handler:    curModule.handler || handler(resources, api),
                methods:    curModule.methods || methods(resources[api])
            };

            if(curModule.init) {
                curModule.init(resources);
            }
        });
};

Router.prototype.route = function route(socket) {
    "use strict";
    if(!socket._events['invoke']) {
        socket.on('invoke', function(msg, cb) {
            allRoutes[msg.service][msg.resource].handler(msg.method, msg.args, socket, cb);
        });
    }
};

Router.prototype.describe = function describe() {
    "use strict";
    var serviceName = this.serviceName;
    var routes      = allRoutes[this.serviceName];
    var resources   = this.resources;
    var retVal      = {};

    Object.keys(routes).forEach(function(routeName) {
        var api = routes[routeName];

        retVal[routeName] = {};

        api.methods.forEach(function(methodName) {
            retVal[routeName][methodName]          = {};
            retVal[routeName][methodName].service  = serviceName;
            retVal[routeName][methodName].resource = routeName;
            retVal[routeName][methodName].method   = methodName;
            retVal[routeName][methodName].params   = resources[routeName][methodName].params;
        });
    });

    return retVal;
};

/*
 * @param serviceName - Required.  The name of the service this router is associated with.
 */
function newRouter(serviceName) {
    return new Router(serviceName);
}

module.exports = newRouter;