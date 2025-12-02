from __future__ import annotations

import logging
from typing import Any, AsyncIterator

from dotenv import load_dotenv

#agentops
import agentops

# ChatKit & Agent Imports
from agents import Runner
from chatkit.agents import stream_agent_response
from chatkit.server import ChatKitServer
from chatkit.store import Store
from chatkit.types import (
    ThreadMetadata,
    UserMessageItem,
    ThreadStreamEvent
)
from openai.types.responses import (
    EasyInputMessageParam,
    ResponseInputContentParam,
    ResponseInputTextParam,
)

# Local Imports
from thread_item_converter import BasicThreadItemConverter
# Import the new Agent and Context
from custom_agents.transcript_maker import transcript_maker_agent, MeetingAgentContext

from request_context import RequestContext

load_dotenv()
logger = logging.getLogger(__name__)

#initialize agentops
agentops.init("089a2cfa-b3cb-4d0c-9f9d-de9e6694cc17")

class MyChatKitServer(ChatKitServer):
    def __init__(self, data_store: Store, file_store: Any | None = None):
        super().__init__(data_store, file_store)
        self.thread_item_converter = BasicThreadItemConverter()

    async def respond(
        self,
        thread: ThreadMetadata,
        item: UserMessageItem | None,
        context: RequestContext,
    ) -> AsyncIterator[ThreadStreamEvent]:

        # 1. Load Recent Thread Items
        items_page = await self.store.load_thread_items(
            thread.id,
            after=None,
            limit=20,
            order="desc",
            context=context,
        )
        items = list(reversed(items_page.data))
        input_items = await self.thread_item_converter.to_agent_input(items)

        # 2. Setup the Agent Context
        # We now use the custom MeetingAgentContext defined in the agent file
        agent_context = MeetingAgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )
        agent = transcript_maker_agent


        # 3. Run the Agent (Logic + Tool Calling is handled here automatically)
        result = Runner.run_streamed(
            agent,
            input_items,
            context=agent_context,
        )

        # 4. Stream the Agent's thoughts/tools/response back to Frontend
        async for event in stream_agent_response(agent_context, result):
            yield event

        return

    async def to_message_content(self, input: FilePart | ImagePart) -> ResponseInputContentParam:
        raise NotImplementedError()