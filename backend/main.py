from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# Create FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request structure
class TopicRequest(BaseModel):
    topic: str
    level: str
    history: list

# AI route
@app.post("/explain")
def explain(data: TopicRequest):

    try:

        # Build conversation history
        conversation_history = ""

        for msg in data.history:
            conversation_history += f"{msg['role']}: {msg['content']}\n"

        # Prompt
        prompt = f"""
        You are a helpful AI tutor.

        Previous Conversation:
        {conversation_history}

        Current User Question:
        {data.topic}

        Explain based on level:
        {data.level}

        Rules:
        - Kid → use very simple words and fun analogies
        - Student → explain clearly with practical examples
        - Engineer → explain technically and in detail

        IMPORTANT:
        - Do not mention the learning level
        - Continue the conversation naturally
        - Keep explanations engaging and easy to understand
        """

        # Generate AI response
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )

        answer = chat_completion.choices[0].message.content

        return {
            "response": answer
        }

    except Exception as e:

        return {
            "response": f"Error: {str(e)}"
        }