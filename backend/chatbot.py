"""
Career Chatbot using OpenAI API and LangChain
Provides personalized career advice based on assessment results and resume data
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Load environment variables
load_dotenv()

class CareerChatbot:
    def __init__(self):
        # Initialize LangChain components (only if API key is available)
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",  # Modern chat model
                temperature=0.5,
                max_tokens=500,
                openai_api_key=api_key
            )
        else:
            self.llm = None
        
        # Create prompt template for career advice
        self.career_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a professional career counselor with expertise in career development and personality assessment.
            
            Based on the user's personality type and background, provide personalized career advice that is:
            1. Specific and actionable
            2. Aligned with their personality strengths
            3. Realistic and practical
            4. Encouraging and supportive
            
            Keep your response concise (2-3 paragraphs) and focus on the most relevant advice for their situation."""),
            ("human", """User's Career Personality Type: {personality_type}
            Resume/Background Information: {resume_data}
            User's Question: {user_message}""")
        ])
        
        # Create LLM chain (only if LLM is available)
        if self.llm:
            self.career_chain = self.career_prompt | self.llm | StrOutputParser()
        else:
            self.career_chain = None
    
    def get_career_advice(self, message, personality_type="", resume_data=""):
        """
        Get career advice based on user message, personality type, and resume data
        
        Args:
            message (str): User's question or message
            personality_type (str): User's assessed personality type
            resume_data (str): Resume or background information
            
        Returns:
            str: AI-generated career advice
        """
        try:
            # If no OpenAI API key is set or LLM is not available, return a default response
            if not self.career_chain:
                return self._get_default_response(message, personality_type)
            
            # Generate response using LangChain
            response = self.career_chain.invoke({
                "personality_type": personality_type or "General",
                "resume_data": resume_data or "No resume information provided",
                "user_message": message
            })
            
            return response.strip()
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return self._get_default_response(message, personality_type)
    
    def _get_default_response(self, message, personality_type):
        """
        Fallback response when OpenAI API is not available
        """
        personality_responses = {
            "Analyst": {
                "greeting": "Hello! As a Strategic Analyst, you excel at deep thinking and problem-solving.",
                "advice": "Consider roles that leverage your analytical strengths like data science, research, or technical consulting. Focus on developing your communication skills to better share your insights with others."
            },
            "Leader": {
                "greeting": "Hello! As a Dynamic Leader, you have natural leadership abilities and drive results.",
                "advice": "Look for opportunities to take on leadership roles in project management, sales, or business development. Consider developing your technical skills to complement your leadership abilities."
            },
            "Collaborator": {
                "greeting": "Hello! As a Relationship Builder, you excel at working with people and building teams.",
                "advice": "Consider careers in human resources, customer success, or account management. Focus on developing some technical or analytical skills to broaden your career options."
            }
        }
        
        default_response = personality_responses.get(personality_type, {
            "greeting": "Hello! I'm here to help with your career development.",
            "advice": "Based on your assessment, I recommend exploring careers that align with your interests and strengths. Consider taking additional assessments or speaking with a career counselor for more personalized guidance."
        })
        
        return f"{default_response['greeting']}\n\n{default_response['advice']}\n\nFeel free to ask me specific questions about career paths, skill development, or job search strategies!"
    
    def get_career_roadmap(self, personality_type, current_role="", target_role=""):
        """
        Generate a career roadmap based on personality type and goals
        
        Args:
            personality_type (str): User's personality type
            current_role (str): Current job title or career stage
            target_role (str): Desired career goal
            
        Returns:
            str: Career roadmap with actionable steps
        """
        roadmaps = {
            "Analyst": {
                "steps": [
                    "1. Strengthen technical skills (programming, data analysis tools)",
                    "2. Build a portfolio of analytical projects",
                    "3. Develop presentation skills to share insights effectively",
                    "4. Network with other analysts and data professionals",
                    "5. Consider certifications in your field of interest"
                ]
            },
            "Leader": {
                "steps": [
                    "1. Take on leadership opportunities in current role",
                    "2. Develop strategic thinking through courses or mentoring",
                    "3. Build a track record of successful project deliveries",
                    "4. Network with senior leaders in your industry",
                    "5. Consider MBA or leadership development programs"
                ]
            },
            "Collaborator": {
                "steps": [
                    "1. Develop expertise in relationship management",
                    "2. Build strong communication and facilitation skills",
                    "3. Gain experience in team coordination and project management",
                    "4. Network across different departments and industries",
                    "5. Consider roles that bridge technical and business teams"
                ]
            }
        }
        
        roadmap = roadmaps.get(personality_type, roadmaps["Analyst"])
        
        return f"Here's a career development roadmap tailored for your {personality_type} personality:\n\n" + "\n".join(roadmap["steps"])
