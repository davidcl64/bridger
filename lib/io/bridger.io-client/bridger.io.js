(function(cb) {
    "use strict";
    function argsFunction() {
        var args = Array.prototype.slice.call(arguments);
        var cb   = args.pop();

        if(typeof cb !== "function") {
            args.push(cb);
            cb = function() {};
        }

        this.socket.emit("invoke", {
            service:  this.service,
            resource: this.resource,
            method:   this.method,
            args:     args
        }, function(msg) {
            cb(msg.error, msg.result);
        });
    }

    function msgFunction() {
        var args   = Array.prototype.slice.call(arguments);
        var msg    = {};
        var params = this.params.slice();
        var cb     = args.pop();

        if(typeof cb !== "function") {
            args.push(cb);
            cb = function() {};
        }

        while(params.length && args.length) {
            msg[params.shift()] = args.shift();
        }

        this.socket.emit(this.path, msg, function(msg) {
            cb(msg.error, msg.result);
        });
    }

    function BridgerIOClient() {}

    BridgerIOClient.prototype.bind = function bind(socket, service, cb) {
        var self = this;

        if(typeof service === 'function') { cb = service; service = 'all'; }

        self.socket = socket;
        socket.emit('describe', service, function(msg) {
            if(msg.error) { return cb(msg.error); }

            var methods = function methods(all) {
                var retVal = {};
                for(var key in all) {
                    var curMethod = all[key];

                    if(curMethod.path) { // It is message based
                        retVal[key] = msgFunction.bind({
                            path:   curMethod.path,
                            params: curMethod.params,
                            socket: socket
                        });
                    } else { // It is args based
                        retVal[key] = argsFunction.bind({
                            service:  curMethod.service,
                            resource: curMethod.resource,
                            method:   curMethod.method,
                            params:   curMethod.params,
                            socket:   socket
                        });
                    }
                }

                return retVal;
            };

            var resources = function resources(all) {
                var retVal = {};
                for(var key in all) {
                    retVal[key] = methods(all[key]);
                }

                return retVal;
            };

            for(var key in msg.result) {
                self[key] = resources(msg.result[key]);
            }

            cb(self);
        });
    };

    cb(BridgerIOClient);
})(function(constructorFn) {
    if(typeof module === 'undefined') {
        this['bridger_io'] = constructorFn;
    } else {
        module.exports = constructorFn;
    }
});