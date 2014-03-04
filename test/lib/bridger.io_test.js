var io   = require('../../node_modules/socket.io/node_modules/socket.io-client');

var chai   = require('chai');
var expect = chai.expect;

chai.expect();
chai.should();

var server = require('http').Server();
var BridgerIO_Client = require('../../lib/io/bridger.io-client/bridger.io.js');

describe('bridger.io', function(){
    var resources = {};
    var bridger_io;
    var socket;

    this.timeout(0);

    before(function(done) {
        resources.test = require("./resources/test");
        resources.test.expose = true;

        bridger_io = require('../../lib/io/bridger.io.js')(server);
        bridger_io.expose("test1", resources);
        server.listen(3005)
            .on('disconnect', function() {
                "use strict";
                console.log('server socket disconnected');
            });

        process.nextTick(done);
    });


    after(function(done) {
        server.close();

        process.nextTick(done);
    });

    beforeEach(function(done) {
        socket = io.connect('http://localhost:3005', {
            'reconnection delay' : 0,
            'reopen delay' : 0,
            'force new connection' : true,  // pre 1.0
            'forceNew': true                // 1.0
        });

        socket.on('connect', function() {
            socket.emit('describe', 'all', function() {
                done();
            });
        });

        socket.on('disconnect', function() {});
    });

    afterEach(function(done) {
        if(socket.connected) {
            socket.disconnect();
        }

        process.nextTick(done);
    });

    describe('#setup', function() {
        this.timeout(0);
        it('should be setup correctly', function(done) {
            expect(resources.test).to.exist;

            socket.emit('describe', 'all', function(msg) {
                expect(msg.error).to.not.exist;
                expect(msg.result).to.exist;
                expect(msg.result.test1).to.exist;
                expect(msg.result.test1.test).to.exist;

                done();
            });
        });
    });

    describe('#Using raw emit', function(){
        describe('#Msg Router - test resource', function(){
            it('should say hello', function(done){
                socket.emit('test1/test/hello', { name: "Bob"
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;

                    expect(msg.result).to.equal("Hello Bob");
                    done();
                });
            });

            it('should getInfo on hobbies', function(done) {
                socket.emit('test1/test/getInfo', { info: "hobbies"
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;

                    expect(msg.result.length).to.equal(4);
                    expect(msg.result).to.deep.equal(['skiing', 'swimming', 'running', 'reading']);

                    done();
                });
            });

            it('should getInfo on personal', function(done) {
                socket.emit('test1/test/getInfo', { info: "personal"
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;

                    expect(msg.result).to.deep.equal({age: "42", status: "married"});
                    done();
                });
            });

            it('should send an error back getInfo on "unknown"', function(done) {
                socket.emit('test1/test/getInfo', { info: "unknown"
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.exist;
                    expect(msg.result).to.not.exist;

                    done();
                });
            });

            it('should send an error back when calling an unknown method', function(done) {
                socket.emit('test1/test/foobar', { info: "unknown"
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.exist;
                    expect(msg.result).to.not.exist;

                    done();
                });
            });
        });

        describe('#Args Router - test resource', function(){
            this.timeout(0);

            it('should setup an arguments based router', function(done) {
                var argsRouter = require('../../lib')["argsRouter.io"];
                bridger_io.expose("test2", resources, argsRouter);
                socket.emit('describe', 'test2', function(msg) {
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;
                    expect(msg.result.test2).to.exist;
                    expect(msg.result.test2.test).to.exist;

                    done();
                });
            });

            it('should say hello', function(done){
                socket.emit('invoke', { service: 'test2', resource: 'test', method: 'hello', args: ["Bob"] },
                function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;

                    expect(msg.result).to.equal("Hello Bob");
                    done();
                });
            });

            it('should getInfo on hobbies', function(done) {
                socket.emit('invoke', { service: 'test2', resource: 'test', method: 'getInfo', args: ["hobbies"]
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;

                    expect(msg.result.length).to.equal(4);
                    expect(msg.result).to.deep.equal(['skiing', 'swimming', 'running', 'reading']);

                    done();
                });
            });

            it('should getInfo on personal', function(done) {
                socket.emit('invoke', { service: 'test2', resource: 'test', method: 'getInfo', args: ["personal"]
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;

                    expect(msg.result).to.deep.equal({age: "42", status: "married"});
                    done();
                });
            });

            it('should send an error back getInfo on "unknown"', function(done) {
                socket.emit('invoke', { service: 'test2', resource: 'test', method: 'getInfo', args: ["unknown"]
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.exist;
                    expect(msg.result).to.not.exist;

                    done();
                });
            });

            it('should send an error back when calling an unknown method', function(done) {
                socket.emit('invoke', { service: 'test2', resource: 'test', method: 'unknown', args: ["unknown"]
                }, function(msg) {
                    expect(msg).to.exist;
                    expect(msg.error).to.exist;
                    expect(msg.result).to.not.exist;

                    done();
                });
            });

            it('should setup an additional arguments based router', function(done) {
                var argsRouter = require('../../lib')["argsRouter.io"];
                resources.test2 = require('./resources/test2');
                resources.test2.expose = true;
                bridger_io.expose("test3", resources, argsRouter);
                socket.emit('describe', 'all', function(msg) {
                    expect(msg.error).to.not.exist;
                    expect(msg.result).to.exist;
                    expect(msg.result.test3).to.exist;
                    expect(msg.result.test3.test2).to.exist;

                    socket.emit('invoke', { service: 'test3', resource: 'test', method: 'hello', args: ["Bob"] },
                        function(msg) {
                            expect(msg).to.exist;
                            expect(msg.error).to.not.exist;
                            expect(msg.result).to.exist;

                            expect(msg.result).to.equal("Hello Bob");
                            socket.emit('invoke', { service: 'test3', resource: 'test2', method: 'goodbye', args: ["Bob"] },
                                function(msg) {
                                    expect(msg).to.exist;
                                    expect(msg.error).to.not.exist;
                                    expect(msg.result).to.exist;

                                    expect(msg.result).to.equal("Goodbye Bob");
                                    done();
                                });
                        });
                });
            });
        });
    });

    describe('#Using bridger.io client', function(){
        describe('#bridger.io client bind', function() {
            it('should discover all services', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    expect(Object.keys(client)).to.include.members(["test1", "test2", "test3"]);
                    done();
                });
            });

            it('should discover a single service', function(done) {
                new BridgerIO_Client().bind(socket, "test2", function(client) {
                    expect(Object.keys(client)).to.include.members(["test2"]);
                    expect(Object.keys(client)).to.not.include.members(["test1", "test3"]);
                    done();
                });
            });

            it('should discover two services', function(done) {
                new BridgerIO_Client().bind(socket, ["test1", "test3"], function(client) {
                    expect(Object.keys(client)).to.not.include.members(["test2"]);
                    expect(Object.keys(client)).to.include.members(["test1", "test3"]);
                    done();
                });
            });
        });

        describe('#Msg Router - test resource', function(){
            it('should say hello', function(done){
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test1.test.hello("Bob", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result).to.equal("Hello Bob");
                        done();
                    });
                });
            });

            it('should getInfo on hobbies', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test1.test.getInfo("hobbies", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result.length).to.equal(4);
                        expect(result).to.deep.equal(['skiing', 'swimming', 'running', 'reading']);
                        done();
                    });
                });
            });

            it('should getInfo on personal', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test1.test.getInfo("personal", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result).to.deep.equal({age: "42", status: "married"});
                        done();
                    });
                });
            });

            it('should send an error back getInfo on "unknown"', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test1.test.getInfo("unknown", function(err, result) {
                        expect(err).to.exist;
                        expect(result).to.not.exist;
                        done();
                    });
                });
            });
        });

        describe('#Args Router - test resource', function(){

            this.timeout(0);

            it('should say hello', function(done){
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test2.test.hello("Bob", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result).to.equal("Hello Bob");
                        done();
                    });
                });
            });

            it('should getInfo on hobbies', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test2.test.getInfo("hobbies", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result.length).to.equal(4);
                        expect(result).to.deep.equal(['skiing', 'swimming', 'running', 'reading']);
                        done();
                    });
                });
            });

            it('should getInfo on personal', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test2.test.getInfo("personal", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result).to.deep.equal({age: "42", status: "married"});
                        done();
                    });
                });
            });

            it('should send an error back getInfo on "unknown"', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test2.test.getInfo("unknown", function(err, result) {
                        expect(err).to.exist;
                        expect(result).to.not.exist;
                        done();
                    });
                });
            });

            it('should be able to call the third service', function(done) {
                new BridgerIO_Client().bind(socket, function(client) {
                    client.test3.test2.goodbye("Bob", function(err, result) {
                        expect(err).to.not.exist;
                        expect(result).to.exist;

                        expect(result).to.equal("Goodbye Bob");
                        done();
                    });
                });
            });
        });
    });
});