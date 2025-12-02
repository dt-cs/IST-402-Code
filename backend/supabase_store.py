from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List

from supabase import Client
from chatkit.store import NotFoundError, Store
from chatkit.types import Attachment, Page, ThreadItem, ThreadMetadata
from pydantic import TypeAdapter

# Adapter to help convert JSON back into Pydantic objects (Messages)
item_adapter = TypeAdapter(ThreadItem)

class SupabaseStore(Store[dict[str, Any]]):
    """
    Persistent store using Supabase (PostgreSQL) for ChatKit.
    """

    def __init__(self, supabase_client: Client) -> None:
        self.supabase = supabase_client

    # -- Thread Metadata -------------------------------------------------
    
    async def load_thread(self, thread_id: str, context: dict[str, Any]) -> ThreadMetadata:
        response = self.supabase.table("chatkit_threads").select("*").eq("id", thread_id).execute()
        
        if not response.data:
            # If thread doesn't exist, we return a default one (or raise NotFound)
            # Creating a default on load prevents errors for new users
            return ThreadMetadata(id=thread_id, created_at=datetime.now())
            
        row = response.data[0]
        # Reconstruct Metadata from the stored JSON
        return ThreadMetadata(**row["metadata"])

    async def save_thread(self, thread: ThreadMetadata, context: dict[str, Any]) -> None:
        # Prepare data for DB
        data = {
            "id": thread.id,
            "created_at": thread.created_at.isoformat() if thread.created_at else None,
            "metadata": thread.model_dump(mode="json"),
        }
        self.supabase.table("chatkit_threads").upsert(data).execute()

    async def load_threads(
        self,
        limit: int,
        after: str | None,
        order: str,
        context: dict[str, Any],
    ) -> Page[ThreadMetadata]:
        # Basic pagination implementation
        query = self.supabase.table("chatkit_threads").select("*").order("created_at", desc=(order == "desc"))
        
        if limit:
            query = query.limit(limit)
            
        response = query.execute()
        
        threads = [ThreadMetadata(**row["metadata"]) for row in response.data]
        
        return Page(
            data=threads,
            has_more=False, # Simplified for now
            after=None,
        )

    async def delete_thread(self, thread_id: str, context: dict[str, Any]) -> None:
        self.supabase.table("chatkit_threads").delete().eq("id", thread_id).execute()

    # -- Thread Items (Messages) -----------------------------------------

    async def load_thread_items(
        self,
        thread_id: str,
        after: str | None,
        limit: int,
        order: str,
        context: dict[str, Any],
    ) -> Page[ThreadItem]:
        
        query = self.supabase.table("chatkit_items").select("*").eq("thread_id", thread_id)
        
        # Ordering
        query = query.order("created_at", desc=(order == "desc"))
        
        # Pagination (simplified)
        if limit:
            query = query.limit(limit)

        response = query.execute()
        
        # Convert JSON rows back to Pydantic objects
        items = []
        for row in response.data:
            try:
                # item_data contains the full JSON structure
                item = item_adapter.validate_python(row["item_data"])
                items.append(item)
            except Exception as e:
                print(f"Failed to parse item {row['id']}: {e}")

        return Page(data=items, has_more=False, after=None)

    async def add_thread_item(
        self, thread_id: str, item: ThreadItem, context: dict[str, Any]
    ) -> None:
        # Ensure thread exists first (Foreign Key constraint)
        # We try to get the thread; if it fails, we assume we need to create it.
        # Ideally, save_thread should be called explicitly, but for safety:
        try:
            await self.load_thread(thread_id, context)
        except:
            # Create a dummy thread entry if it doesn't exist to satisfy FK
            await self.save_thread(ThreadMetadata(id=thread_id, created_at=datetime.now()), context)

        data = {
            "id": item.id,
            "thread_id": thread_id,
            "created_at": datetime.now().isoformat(), # Use current time for sorting
            "item_data": item.model_dump(mode="json"),
        }
        self.supabase.table("chatkit_items").upsert(data).execute()

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict[str, Any]) -> None:
        await self.add_thread_item(thread_id, item, context)

    async def load_item(self, thread_id: str, item_id: str, context: dict[str, Any]) -> ThreadItem:
        response = self.supabase.table("chatkit_items").select("*").eq("id", item_id).single().execute()
        if not response.data:
            raise NotFoundError(f"Item {item_id} not found")
        
        return item_adapter.validate_python(response.data["item_data"])

    async def delete_thread_item(
        self, thread_id: str, item_id: str, context: dict[str, Any]
    ) -> None:
        self.supabase.table("chatkit_items").delete().eq("id", item_id).execute()

    # -- Attachments (Unsupported) ---------------------------------------
    async def save_attachment(self, attachment: Attachment, context: dict[str, Any]) -> None:
        pass

    async def load_attachment(self, attachment_id: str, context: dict[str, Any]) -> Attachment:
        raise NotImplementedError("Attachments not supported")

    async def delete_attachment(self, attachment_id: str, context: dict[str, Any]) -> None:
        pass