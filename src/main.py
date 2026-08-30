from twitchio import authentication, eventsub
from twitchio.ext import commands
import twitchio
import asyncio
import logging
import config
import json

from parts.overlay import Overlay
from utils.communicator import Communicator

LOGGER: logging.Logger = logging.getLogger(__name__)
socket = Communicator()

class Bot(commands.Bot):
    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)

    async def setup_hook(self) -> None:
        await self.add_component(Overlay(socket,self))

        with open(".tio.tokens.json", "rb") as fp:
            tokens = json.load(fp)

        for user_id in tokens:
            if user_id == config.twitch["bot_id"]:
                continue
            
            chat = eventsub.ChatMessageSubscription(broadcaster_user_id=str(user_id), user_id=config.twitch["bot_id"])
            await self.subscribe_websocket(chat)

    async def event_ready(self) -> None:
        LOGGER.info("Logged in as: %s", self.user)

    async def event_oauth_authorized(self, payload: authentication.UserTokenPayload) -> None:
        await self.add_token(payload.access_token, payload.refresh_token)
        
        if payload.user_id == config.twitch["bot_id"]:
            return

        chat = eventsub.ChatMessageSubscription(broadcaster_user_id=payload.user_id, user_id=config.twitch["bot_id"])
        await self.subscribe_websocket(chat)

twitchio.utils.setup_logging(level=logging.INFO)

async def runner() -> None:
    bot = Bot(
        client_id=config.twitch["client_id"],
        client_secret=config.twitch["client_secret"],
        bot_id=config.twitch["bot_id"],
        owner_id=config.twitch["owner_id"],
        prefix="!",
    )

    try:
        await bot.start()
    finally:
        await bot.close()

async def main():
    async with asyncio.TaskGroup() as tasks:
        tasks.create_task(runner())
        tasks.create_task(socket.run_websocket())

asyncio.run(main())