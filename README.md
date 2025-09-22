# AI Career Path - Career Assessment & Guidance SaaS

An AI-powered career assessment platform that helps users discover their ideal career path through personality analysis and personalized AI guidance.

## Features

### MVP Features
- **Career Personality Assessment**: 8-question interactive quiz
- **Personalized Results**: Detailed personality analysis with career recommendations
- **AI Career Chatbot**: OpenAI-powered career advisor
- **Resume Upload**: Optional resume analysis for personalized advice
- **Responsive Design**: Works on desktop and mobile devices

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Backend**: Python Flask
- **Database**: SQLite
- **AI/ML**: OpenAI GPT-3.5-turbo, LangChain
- **Deployment**: Render (Backend), GitHub Pages (Frontend)

## Quick Start

### Prerequisites
- Python 3.8+
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-career
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open the frontend**
   - Open `frontend/index.html` in your web browser
   - Or serve it using a local server (e.g., Live Server extension in VS Code)

## Project Structure

```
ai-career/
├── backend/
│   ├── app.py                 # Flask application
│   ├── assessment_engine.py   # Assessment logic and scoring
│   ├── chatbot.py            # AI chatbot implementation
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── uploads/             # Resume upload directory
├── frontend/
│   ├── index.html           # Main application page
│   ├── styles.css           # Custom styles
│   └── script.js            # Frontend JavaScript
├── project_planning.txt     # Project requirements and planning
└── README.md               # This file
```

## API Endpoints

### Assessment
- `GET /api/questions` - Get assessment questions
- `POST /api/submit-assessment` - Submit answers and get results

### Chat
- `POST /api/chat` - Send message to AI career advisor

### File Upload
- `POST /api/upload-resume` - Upload and parse resume

## Personality Types

The assessment identifies three main career personality types:

1. **Strategic Analyst**: Detail-oriented, analytical, thrives on problem-solving
2. **Dynamic Leader**: Action-oriented, decisive, excels at driving results
3. **Relationship Builder**: People-focused, collaborative, builds strong teams

## Development

### Adding New Questions
Edit `backend/assessment_engine.py` and add questions to the `_load_questions()` method.

### Customizing Personality Types
Modify the `_load_personality_types()` method in `assessment_engine.py` to add new personality types or update existing ones.

### Styling Changes
Update `frontend/styles.css` for custom styling or modify Bootstrap classes in the HTML.

## Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables (OPENAI_API_KEY)
3. Deploy with automatic builds

### Frontend (GitHub Pages)
1. Push frontend files to GitHub
2. Enable GitHub Pages in repository settings
3. Update API_BASE_URL in `script.js` to point to your backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the GitHub repository.
