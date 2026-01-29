import json
import boto3
from pinecone import Pinecone
import uuid
import os

# ----------------------------
# CONFIGURATION
# ----------------------------
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
INDEX_NAME = "mislam-embeddings"

PERSONA_PROMPT = """
You are Donald Trump. Respond confidently, humorously, and with ego.
You are aware of Mary's past marriage context from retrieved passages.
Use the given context to answer questions in Trump's style.

Here are some examples:

Example 1:
Context: Mary had a failed marriage and struggles with communication.
User: How should I handle misunderstandings with my spouse?
Trump Answer: "Let me tell you, communication is key — nobody knows it better than me. Huge misunderstandings? Very simple, be strong, be smart, make a deal, the best deal."

Example 2:
Context: Mary was often overwhelmed by daily life stress.
User: How can I manage stress better?
Trump Answer: "Stress? Look, I handle stress all the time. You just need confidence, focus, and the best people around you — that's how you win."

Now respond to the user question using the context provided:
"""

# ----------------------------
# INITIALIZE CLIENTS
# ----------------------------
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

# ----------------------------
# HELPER FUNCTIONS
# ----------------------------
def titan_embed(text):
    """Get Titan embedding for a single text"""
    payload = {"inputText": text}
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v1",  # This is correct for embeddings
        body=json.dumps(payload)
    )
    embedding = json.loads(response["body"].read())["embedding"]
    return embedding

def query_pinecone(query_text, top_k=3):
    """Query Pinecone index to get top chunks"""
    q_embed = titan_embed(query_text)
    response = index.query(
        vector=q_embed,
        top_k=top_k,
        include_metadata=True
    )
    # Extract text from metadata
    chunks = [item["metadata"]["text"] for item in response["matches"]]
    return chunks

def rag_answer(user_question):
    """Full RAG answer: retrieve + LLM"""
    chunks = query_pinecone(user_question)
    context_text = "\n".join(chunks)

    full_prompt = f"""
{PERSONA_PROMPT}

Context:
{context_text}

User: {user_question}
Trump Answer:
"""
    
    # FIXED: Use Claude for text generation, not Titan embedding model
    response = bedrock.invoke_model(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",  # Text generation model
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 200,
            "messages": [
                {
                    "role": "user",
                    "content": full_prompt
                }
            ]
        })
    )
    
    result = json.loads(response["body"].read())
    completion = result["content"][0]["text"]
    return completion

# ----------------------------
# LAMBDA HANDLER
# ----------------------------
def lambda_handler(event, context):
    """
    Expected event format:
    {
        "question": "Why did my marriage fail?"
    }
    """
    question = event.get("question")
    if not question:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing 'question' in request"})
        }

    try:
        answer = rag_answer(question)
        return {
            "statusCode": 200,
            "body": json.dumps({"answer": answer})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }