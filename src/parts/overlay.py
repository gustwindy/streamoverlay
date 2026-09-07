import asyncio
import datetime
import json

import twitchio
from twitchio.ext import commands, routines

import config
from utils.communicator import Communicator

class Overlay(commands.Component):
    def __init__(self,socket ,bot) -> None:
        self.socket: Communicator = socket
        self.bot: commands.Bot = bot
        self.streamer: twitchio.User | None = None
        
        self.userCache = {}
        
        self.check_viewers.start()
        self.song_thing.start()
        super().__init__()
    
    @commands.command()
    async def ping(self, ctx: commands.Context[commands.Bot]) -> None:
        await ctx.reply(f"pong")
    
    @commands.command()
    async def setNote(self, ctx: commands.Context[commands.Bot]) -> None:
        if not ctx.chatter.moderator: # pyright: ignore[reportAttributeAccessIssue]
            return
        await self.socket.send_message("note"," ".join(ctx.message.text.split(" ")[1:])) # pyright: ignore[reportOptionalMemberAccess]
        await ctx.reply(f"done!")
    
    @commands.Component.listener("message")
    async def consume(self, message: twitchio.ChatMessage):
        print(message)
        await self.socket.send_message("message",{
            "author": message.chatter.name,
            "mod": message.chatter.admin,
            "content": message.text,
            "color": message.color.code, # prob unused cos queer # pyright: ignore[reportOptionalMemberAccess] # gay
        })
    
    @commands.Component.listener("follow")
    async def on_follow(self, follow: twitchio.ChannelFollow):
        await self.socket.send_message("follow",{
            "user": follow.user.display_name
        })
        await follow.broadcaster.send_message(f"ty for follow {follow.user.name}!!",self.bot.bot_id)
    
    @routines.routine(delta=datetime.timedelta(seconds=5))
    async def song_thing(self):
        with open("/home/guhw/now_playing.json","r") as f:
            await self.socket.send_message("nowPlaying",json.loads(f.read()))
    
    @routines.routine(delta=datetime.timedelta(seconds=30))
    async def check_viewers(self):
        if not self.streamer:
            self.streamer = await self.bot.fetch_user(id=config.twitch["owner_id"])

        if self.streamer:
            chatters: twitchio.Chatters = await self.streamer.fetch_chatters(moderator=self.bot.user) # pyright: ignore[reportArgumentType]
            
            users = []
            async for i in chatters.users:
                users.append(await i.user())
                await asyncio.sleep(0)
            
            await self.socket.send_message("userList",[{"name": i.name, "url": i.profile_image.base_url} for i in users])