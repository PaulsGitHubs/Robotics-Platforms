# ai_integration/ai_integration.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIEngine:
    """
    Main AI interface for the Digital Twin.
    Converts user text → actions, code, camera follow-ups etc.
    """

    @staticmethod
    def process_query(query: str):
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.responses.create(
                model="gpt-4.1",
                input=query
            )

            # Extract the AI’s generated text
            result = response.output_text
            return result

        except Exception as e:
            return f"AI Error: {e}"






