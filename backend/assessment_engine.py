"""
Assessment Engine for Career Personality Analysis
Handles questions, scoring, and personality type determination
"""

class AssessmentEngine:
    def __init__(self):
        self.questions = self._load_questions()
        self.personality_types = self._load_personality_types()
    
    def _load_questions(self):
        """Load assessment questions with scoring weights"""
        return [
            {
                "id": 1,
                "question": "When working on a project, you prefer to:",
                "options": [
                    {"text": "Work independently and focus deeply", "weights": {"Analyst": 3, "Leader": 1, "Collaborator": 0}},
                    {"text": "Lead a team and make decisions", "weights": {"Analyst": 0, "Leader": 3, "Collaborator": 1}},
                    {"text": "Collaborate closely with others", "weights": {"Analyst": 1, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 2,
                "question": "Your ideal work environment is:",
                "options": [
                    {"text": "Quiet office with minimal interruptions", "weights": {"Analyst": 3, "Leader": 1, "Collaborator": 0}},
                    {"text": "Dynamic office with lots of meetings", "weights": {"Analyst": 0, "Leader": 3, "Collaborator": 2}},
                    {"text": "Flexible workspace with team collaboration", "weights": {"Analyst": 1, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 3,
                "question": "When facing a problem, you:",
                "options": [
                    {"text": "Analyze data and research thoroughly", "weights": {"Analyst": 3, "Leader": 1, "Collaborator": 1}},
                    {"text": "Take charge and find quick solutions", "weights": {"Analyst": 1, "Leader": 3, "Collaborator": 1}},
                    {"text": "Discuss with team and brainstorm together", "weights": {"Analyst": 1, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 4,
                "question": "You're most motivated by:",
                "options": [
                    {"text": "Solving complex puzzles and discovering patterns", "weights": {"Analyst": 3, "Leader": 0, "Collaborator": 0}},
                    {"text": "Achieving goals and driving results", "weights": {"Analyst": 0, "Leader": 3, "Collaborator": 1}},
                    {"text": "Building relationships and helping others succeed", "weights": {"Analyst": 0, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 5,
                "question": "Your communication style is:",
                "options": [
                    {"text": "Detailed and data-driven", "weights": {"Analyst": 3, "Leader": 1, "Collaborator": 0}},
                    {"text": "Direct and action-oriented", "weights": {"Analyst": 1, "Leader": 3, "Collaborator": 1}},
                    {"text": "Warm and relationship-focused", "weights": {"Analyst": 0, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 6,
                "question": "In meetings, you typically:",
                "options": [
                    {"text": "Listen carefully and provide detailed analysis", "weights": {"Analyst": 3, "Leader": 0, "Collaborator": 1}},
                    {"text": "Take initiative and drive the agenda", "weights": {"Analyst": 0, "Leader": 3, "Collaborator": 1}},
                    {"text": "Facilitate discussion and ensure everyone contributes", "weights": {"Analyst": 1, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 7,
                "question": "You enjoy tasks that involve:",
                "options": [
                    {"text": "Research, analysis, and problem-solving", "weights": {"Analyst": 3, "Leader": 1, "Collaborator": 0}},
                    {"text": "Strategy, planning, and execution", "weights": {"Analyst": 1, "Leader": 3, "Collaborator": 1}},
                    {"text": "Team building, mentoring, and collaboration", "weights": {"Analyst": 0, "Leader": 1, "Collaborator": 3}}
                ]
            },
            {
                "id": 8,
                "question": "When learning something new, you prefer to:",
                "options": [
                    {"text": "Study materials independently and deeply", "weights": {"Analyst": 3, "Leader": 1, "Collaborator": 0}},
                    {"text": "Jump in and learn through experience", "weights": {"Analyst": 1, "Leader": 3, "Collaborator": 1}},
                    {"text": "Learn with others and share knowledge", "weights": {"Analyst": 1, "Leader": 1, "Collaborator": 3}}
                ]
            }
        ]
    
    def _load_personality_types(self):
        """Load personality type descriptions and career recommendations"""
        return {
            "Analyst": {
                "name": "The Strategic Analyst",
                "description": "You're detail-oriented, analytical, and thrive on solving complex problems through research and data analysis.",
                "characteristics": [
                    "Highly analytical and methodical",
                    "Prefer working independently",
                    "Excel at research and data interpretation",
                    "Value accuracy and precision",
                    "Enjoy deep, focused work"
                ],
                "career_matches": [
                    "Data Scientist",
                    "Research Analyst",
                    "Software Engineer",
                    "Financial Analyst",
                    "Business Intelligence Analyst",
                    "Product Manager (Technical)",
                    "Consultant (Strategy/Analytics)"
                ],
                "strengths": [
                    "Critical thinking",
                    "Problem-solving",
                    "Attention to detail",
                    "Data analysis",
                    "Research skills"
                ],
                "development_areas": [
                    "Public speaking",
                    "Team leadership",
                    "Networking",
                    "Quick decision-making"
                ]
            },
            "Leader": {
                "name": "The Dynamic Leader",
                "description": "You're action-oriented, decisive, and excel at driving results through leadership and strategic thinking.",
                "characteristics": [
                    "Natural leadership abilities",
                    "Goal-oriented and results-driven",
                    "Comfortable making decisions",
                    "Thrive in dynamic environments",
                    "Excellent at motivating others"
                ],
                "career_matches": [
                    "Project Manager",
                    "Sales Manager",
                    "Marketing Director",
                    "Entrepreneur",
                    "Operations Manager",
                    "Team Lead",
                    "Business Development Manager"
                ],
                "strengths": [
                    "Leadership",
                    "Decision-making",
                    "Strategic thinking",
                    "Communication",
                    "Goal achievement"
                ],
                "development_areas": [
                    "Patience with details",
                    "Collaborative decision-making",
                    "Technical skills",
                    "Active listening"
                ]
            },
            "Collaborator": {
                "name": "The Relationship Builder",
                "description": "You're people-focused, collaborative, and excel at building relationships and fostering team success.",
                "characteristics": [
                    "Excellent interpersonal skills",
                    "Team-oriented approach",
                    "Strong communication abilities",
                    "Empathetic and supportive",
                    "Thrive in collaborative environments"
                ],
                "career_matches": [
                    "Human Resources Specialist",
                    "Customer Success Manager",
                    "Marketing Coordinator",
                    "Training & Development",
                    "Community Manager",
                    "Account Manager",
                    "Social Worker"
                ],
                "strengths": [
                    "Relationship building",
                    "Communication",
                    "Team collaboration",
                    "Empathy",
                    "Conflict resolution"
                ],
                "development_areas": [
                    "Data analysis",
                    "Independent work",
                    "Technical skills",
                    "Direct feedback delivery"
                ]
            }
        }
    
    def get_questions(self):
        """Return formatted questions for frontend"""
        formatted_questions = []
        for q in self.questions:
            formatted_questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": [{"text": opt["text"], "value": i} for i, opt in enumerate(q["options"])]
            })
        return formatted_questions
    
    def calculate_personality(self, answers):
        """Calculate personality type based on answers"""
        scores = {"Analyst": 0, "Leader": 0, "Collaborator": 0}
        
        for answer in answers:
            question_id = answer.get("question_id")
            option_index = answer.get("option_index")
            
            if question_id and option_index is not None:
                question = next((q for q in self.questions if q["id"] == question_id), None)
                if question and 0 <= option_index < len(question["options"]):
                    option = question["options"][option_index]
                    for personality, weight in option["weights"].items():
                        scores[personality] += weight
        
        # Return the personality type with the highest score
        return max(scores, key=scores.get)
    
    def get_personality_results(self, personality_type):
        """Get detailed results for a personality type"""
        return self.personality_types.get(personality_type, {})
