import os
import json
import asyncio
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import AsyncOpenAI
from supabase import Client
from dotenv import load_dotenv

# Load env vars if running locally for testing
load_dotenv() 

# Initialize OpenAI Client
aclient = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def index_meeting_transcript(meeting_id: str, transcript: str, supabase_client: Client) -> str:
    """
    Full RAG Pipeline:
    1. Fetches meeting metadata from DB.
    2. Splits and Embeds the transcript.
    3. Merges metadata into chunks.
    4. Deletes OLD chunks for this meeting (Prevention).
    5. Inserts NEW chunks into DB.
    """
    if not transcript:
        return "No transcript to process."

    # --- 1. Fetch Metadata from 'meetinglist' ---
    print(f"🔍 Fetching metadata for meeting {meeting_id}...")
    try:
        meta_response = supabase_client.table("meetinglist").select("metadata").eq("id", meeting_id).single().execute()
        existing_metadata = meta_response.data.get("metadata", {}) if meta_response.data else {}
    except Exception as e:
        print(f"⚠️ Failed to fetch metadata: {e}. Proceeding with empty metadata.")
        existing_metadata = {}

    # --- 2. Split Text ---
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", "!", "?"],
    )
    docs = splitter.create_documents([transcript])
    chunks_text = [doc.page_content for doc in docs]

    if not chunks_text:
        return "Transcript too short to chunk."

    # --- 3. Generate Embeddings ---
    print(f"🧠 Generating embeddings for {len(chunks_text)} chunks...")
    try:
        response = await aclient.embeddings.create(
            input=chunks_text,
            model="text-embedding-3-small"
        )
    except Exception as e:
        return f"OpenAI Embedding Error: {e}"

    # --- 4. Prepare Rows with Metadata ---
    processed_chunks = []
    for i, (text_content, embedding_data) in enumerate(zip(chunks_text, response.data)):
        
        chunk_metadata = {
            "source": "transcript",
            "chunk_index": i,
            **existing_metadata 
        }

        processed_chunks.append({
            # CHANGED: 'meeting_id' -> 'transcript_id' to match your DB schema
            "transcript_id": meeting_id,
            "chunk_index": i,
            "content": text_content,
            "embedding": embedding_data.embedding,
            "metadata": chunk_metadata 
        })

    # --- 5. Clean Up Old Chunks (Prevent Duplicates) ---
    print(f"🧹 Removing old chunks for meeting {meeting_id}...")
    try:
        # CHANGED: .eq("meeting_id") -> .eq("transcript_id")
        supabase_client.table("transcript_chunks").delete().eq("transcript_id", meeting_id).execute()
    except Exception as e:
        # We log but don't stop, just in case table is empty or permission issue
        print(f"Warning during cleanup: {e}")

    # --- 6. Bulk Insert ---
    print(f"💾 Saving {len(processed_chunks)} chunks to Supabase...")
    try:
        supabase_client.table("transcript_chunks").insert(processed_chunks).execute()
        return f"Successfully indexed {len(processed_chunks)} chunks with metadata."
    except Exception as e:
        return f"Database Insert Error: {e}"