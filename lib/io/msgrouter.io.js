
function methods(module) {
    "use strict";
    return Object.keys(module).filter(function(name) { return name !== 'expose'; });
}

function handler(resources, api) {
    "use strict";
    return function handler(method, msg, socket, cb) {
        var params = msg || {};
        var args   = [];
        var fn     = resources[api][method];

        if(!fn) {
            return cb({error: {message: "Invalid request to unknown endpoint"}});
        }

        (fn.params || []).forEach(function(paramName) {
            if(params.hasOwnProperty(paramName)) {
                args.push(params[paramName]);
            }
        });

        // If params wasn't specified on the method to be called, it is
        // expecting the incoming params.
        if(args.length === 0 && !fn.params) { args.push(params); }

        // Add the callback as the last argument
        args.push(function(err, result) {
            cb({ error: err, result: result });
        });

        return fn.apply(resources[api], args);
    };
}


function Router(serviceName) {
    "use strict";
    if(!this instanceof Router) { return new Router(serviceName); }

    this.serviceName = serviceName;
    this.routes = {};
}

Router.prototype.constructor = Router;

/*
 * @param model  - mongoquick model
 * @param routes - optional, path to routes that override default behavior
 */
Router.prototype.expose = function expose(resources, routes) {
    "use strict";
    this.resources = resources;

    var self = this;
    Object.keys(resources)
        .filter(function(api) { return resources[api].expose; })
        .forEach(function(api) {
            var curModule;

            // If there is a module under routes, it is overriding some or all of
            // the default behavior.
            curModule = routes ? require(routes) : {};

            self.routes[api] = {
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
    var serviceName   = this.serviceName;
    var publishedAPIs = this.routes;

    Object.keys(publishedAPIs).forEach(function(apiName) {
        var api = publishedAPIs[apiName];

        api.methods.forEach(function(methodName) {
            var path   = [serviceName, apiName, methodName].join('/');

            //console.info('Adding route: %s', path);
            socket.on(path, function(msg, cb) {
                api.handler(methodName, msg, socket, cb);
            });
        });
    });
};

Router.prototype.describe = function describe() {
    "use strict";
    var serviceName = this.serviceName;
    var routes      = this.routes;
    var resources   = this.resources;
    var retVal      = {};

    Object.keys(routes).forEach(function(routeName) {
        var api = routes[routeName];

        retVal[routeName] = {};

        api.methods.forEach(function(methodName) {
            retVal[routeName][methodName]         = {};
            retVal[routeName][methodName].path    = [serviceName, routeName, methodName].join('/');
            retVal[routeName][methodName].params  = resources[routeName][methodName].params;
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