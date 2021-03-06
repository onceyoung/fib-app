const test = require('test');
test.setup();

const testAppInfo = require('../').getRandomSqliteBasedApp();
const testSrvInfo = require('../').mountAppToSrv(testAppInfo.app, {appPath: '/api'});
testSrvInfo.server.run(() => void 0)

const { check_result } = require('./_utils');

const http = require('http');

describe("reverse", () => {
    after(() => testAppInfo.cleanSqliteDB())
    
    describe("1:n", () => {
        var msg_id;
        var room_id;
        var user_id;

        before(() => {
            var rep = http.post(testSrvInfo.appUrlBase + '/chatroom', {
                json: {
                    name: "room1"
                }
            });

            room_id = rep.json().id;

            var rep = http.post(testSrvInfo.appUrlBase + '/user', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }
            });

            user_id = rep.json().id;

            http.post(testSrvInfo.serverBase + '/set_session', {
                json: {
                    id: user_id
                }
            });
        });

        it("create message", () => {
            var rep = http.post(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages`, {
                json: {
                    msg: "hello"
                }
            });

            msg_id = rep.json().id;
        });

        it("get", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello",
                createdby_id: user_id,
                room_id: room_id
            });
        });

        it("get reserve", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/chatmessage/${msg_id}/room/${room_id}`);
            check_result(rep.json(), {
                id: room_id,
                name: "room1"
            });
        });

        it("list", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages`);
            check_result(rep.json(), [{
                id: msg_id,
                msg: "hello",
                createdby_id: user_id,
                room_id: room_id
            }]);
        });

        it("update", () => {
            var rep = http.put(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages/${msg_id}`, {
                json: {
                    msg: 'hello 2'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello 2",
                createdby_id: user_id,
                room_id: room_id
            });
        });

        xit("delete", () => {
            var rep = http.del(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages/${msg_id}`);
            assert.equal(rep.statusCode, 200);

            var rep = http.get(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello 2",
                createdby_id: user_id,
                room_id: room_id
            });
        });

        it("link reserve", () => {
            var rep = http.post(testSrvInfo.appUrlBase + `/chatmessage`, {
                json: {
                    msg: "hello 1"
                }
            });

            var msg_id = rep.json().id;

            var rep = http.put(testSrvInfo.appUrlBase + `/chatmessage/${msg_id}/room`, {
                json: {
                    id: room_id
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(testSrvInfo.appUrlBase + `/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello 1",
                createdby_id: user_id,
                room_id: room_id
            });
        });
    });

    describe("m:n", () => {
        var room1_id;
        var room2_id;
        var user1_id;
        var user2_id;

        before(() => {
            var rep = http.post(testSrvInfo.appUrlBase + '/chatroom', {
                json: [{
                    name: "room1"
                }, {
                    name: "room2"
                }]
            });

            var data = rep.json();
            room1_id = data[0].id;
            room2_id = data[1].id;

            var rep = http.post(testSrvInfo.appUrlBase + '/user', {
                json: [{
                    name: 'lion 1',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }, {
                    name: 'lion 2',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }]
            });

            var data = rep.json();
            user1_id = data[0].id;
            user2_id = data[1].id;
        });

        it("put extends", () => {
            var rep = http.put(testSrvInfo.appUrlBase + `/chatroom/${room1_id}/mambers`, {
                json: {
                    id: user1_id
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.put(testSrvInfo.appUrlBase + `/user/${user2_id}/rooms`, {
                json: {
                    id: room2_id
                }
            });
            assert.equal(rep.statusCode, 200);
        });

        it("del", () => {
            var rep = http.del(testSrvInfo.appUrlBase + `/chatroom/${room1_id}/mambers/${user1_id}`);
            assert.equal(rep.statusCode, 200);

            var rep = http.del(testSrvInfo.appUrlBase + `/user/${user2_id}/rooms/${room2_id}`);
            assert.equal(rep.statusCode, 200);
        });

        it("create", () => {
            var rep = http.post(testSrvInfo.appUrlBase + `/chatroom/${room1_id}/mambers`, {
                json: {
                    name: 'lion 3',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }
            });
            assert.equal(rep.statusCode, 201);

            var rep = http.post(testSrvInfo.appUrlBase + `/user/${user2_id}/rooms`, {
                json: {
                    name: "room3"
                }
            });
            assert.equal(rep.statusCode, 201);
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
