import asyncio

import twitchio

import config


async def main() -> None:
    client = twitchio.Client(client_id=config.twitch["client_id"], client_secret=config.twitch["client_secret"], bot_id=config.twitch["owner_id"])
    await client.start()

if __name__ == "__main__":
    asyncio.run(main())