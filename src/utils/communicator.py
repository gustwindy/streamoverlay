import asyncio
import json
from websockets.asyncio.server import serve

class Communicator():
    def __init__(self) -> None:
        self.clients = []

    async def connected(self,client):
        self.clients.append(client)
        try:
            await client.wait_closed()
        finally:
            self.clients.remove(client)

    async def send_message(self,key,data):
        print(key,data)
        for i in self.clients:
            try:
                await i.send(json.dumps({
                    "type": key,
                    "data": data
                }))
            except:
                pass

    async def run_websocket(self):
        server = await serve(self.connected, "localhost", 61310)
        
        await server.serve_forever()