export class Namespace {
    name;
    server;
    onConnectEvent = () => { };
    authFn = () => false;
    room;
    constructor(name, server) {
        this.name = name;
        this.server = server;
        const roomName = `gls-namespace-${name}`;
        this.room = this.server.room(roomName);
    }
    onConnect(handler) {
        this.onConnectEvent = handler;
        return this;
    }
    auth(authFn) {
        this.authFn = authFn;
        return this;
    }
    get onConnectHandler() {
        return this.onConnectEvent;
    }
    emit(event, ...args) {
        this.room.emit(event, ...args);
    }
    emitWithoutSelf(socket, event, ...args) {
        this.room.emitWithoutSelf(socket, event, ...args);
    }
}
