# GlovesLink

GlovesLink is a WebSocket communication library designed for seamless interaction between clients and servers.

[Main repo](https://github.com/wxn0brP/GlovesLink) |
[Client repo](https://github.com/wxn0brP/GlovesLink-client) |
[Server repo](https://github.com/wxn0brP/GlovesLink-server)

## Features

### General
- **WebSocket Communication**: Establish real-time communication between clients and servers.
- **Automatic Reconnection**: Automatically reconnects after disconnection.
- **Authentication Support**: Token-based authentication for secure connections.
- **Logging**: Optional logging for debugging and monitoring.
- **Rooms**: Organize communication within specific rooms for better organization and control.

### Communication
- **Event Emission**: Send events with arbitrary data.
- **Callbacks**: Handle server/client responses with callback functions.

## Installation

```bash
npm i @wxn0brp/gloves-link-server @wxn0brp/falcon-frame
```

## Usage

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link-server';
import { FalconFrame } from '@wxn0brp/falcon-frame';

const app = new FalconFrame();
const httpServer = app.listen(3000);

const glovesLink = new GlovesLinkServer({ logs: true });
glovesLink.attachToHttpServer(httpServer);
glovesLink.falconFrame(app);

const namespace = glovesLink.of("/");

namespace.auth(async ({ token }) => {
    if (token === "valid-token") {
        return { status: 200, user: { _id: "user1", name: "Alice" } };
    }
    return { status: 401, msg: "Invalid token" };
});

namespace.onConnect((socket, authData, authResult) => {
    console.log('New connection:', socket.id, 'User:', socket.user?.name);

    socket.on('exampleEvent', (data) => {
        console.log('Received data:', data);
        socket.emit('response', 'Hello from server');
    });
});
```

## License

MIT License

## Contributing

Contributions are welcome!
