# Northwestern Mutual Enhanced Assessment System

A comprehensive, AI-powered assessment platform designed to evaluate financial advisor candidates through behavioral analysis, psychological profiling, and practical simulations.

## 🚀 Features

### Core Assessment Capabilities
- **Multi-Phase Assessment Flow**: Contact → Warmup → Psychological → Contradiction Check → Simulation → Rapid Fire → Day Simulation
- **Behavioral Tracking**: Real-time mouse movements, keyboard patterns, stress detection, and confidence scoring
- **Adaptive Questioning**: Dynamic difficulty adjustment based on candidate performance and stress levels
- **Contradiction Detection**: Identifies inconsistent responses across related questions
- **Comprehensive Scoring**: Multi-dimensional evaluation including ethical integrity, stress resilience, and practical skills

### Question Types
- **Psychological Scenarios**: Real-world financial advisor dilemmas
- **Timed Responses**: Pressure-based decision making
- **Email Simulations**: Client communication assessment
- **Priority Matrix**: Drag-and-drop task prioritization
- **Slider Matrix**: Work style preference analysis
- **Rapid Fire**: Quick instinct-based decisions
- **Day Simulation**: Full workday scenario simulation

### Behavioral Analytics
- **Mouse Tracking**: Movement patterns, hesitations, and click analysis
- **Keyboard Analysis**: Typing speed, deletions, pauses, and copy-paste detection
- **Stress Monitoring**: Real-time stress level assessment and adaptation
- **Confidence Scoring**: Dynamic confidence meter with behavioral correlation
- **Anomaly Detection**: Developer tools, tab switching, and suspicious behavior monitoring

## 🏗️ Architecture

### Frontend (JavaScript ES6)
```
assessment-system/frontend/
├── index.html              # Main assessment interface
├── js/
│   ├── behavior-tracker.js # Behavioral data collection
│   ├── question-bank.js    # Question database and management
│   ├── adaptive-flow.js    # Assessment flow control
│   ├── analytics.js        # Data analysis and scoring
│   └── assessment-engine.js # Main orchestration engine
└── css/                    # Styling and animations
```

### Backend (Node.js + Express)
```
assessment-system/backend/
├── api/
│   ├── assessment-controller.js # REST API endpoints
│   ├── scoring-engine.js        # Assessment scoring algorithms
│   └── candidate-profile.js     # Profile generation
└── database/
    └── schema.sql               # MySQL database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assessment-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start the system**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📊 Assessment Flow

### Phase 1: Contact Information
- Collect candidate details
- Analyze typing patterns and form behavior
- Establish baseline behavioral metrics

### Phase 2: Warmup Questions
- Simple scenarios to build confidence
- Establish baseline response patterns
- Calibrate behavioral tracking

### Phase 3: Psychological Assessment
- Ethical dilemmas and boundary testing
- Stress management under pressure
- Decision-making style analysis

### Phase 4: Contradiction Detection
- Paired questions to identify inconsistencies
- Behavioral pattern validation
- Authenticity assessment

### Phase 5: Practical Simulations
- Email response to client panic
- Task prioritization matrix
- Work style preference sliders

### Phase 6: Rapid Fire Round
- Quick instinct-based decisions
- Pressure handling assessment
- Response consistency analysis

### Phase 7: Day Simulation
- Full workday scenario simulation
- Multiple decision points
- Work-life balance assessment

## 🔍 Behavioral Metrics

### Confidence Scoring
- **Real-time Updates**: Continuous confidence level monitoring
- **Behavioral Correlation**: Mouse hesitations, typing patterns, response times
- **Stress Interaction**: Confidence changes under stress conditions

### Stress Detection
- **Physiological Indicators**: Rapid clicking, erratic mouse movement
- **Behavioral Patterns**: Tab switching, form hesitation, timeout frequency
- **Adaptive Response**: Question difficulty adjustment based on stress levels

### Authenticity Monitoring
- **Developer Tools Detection**: Automatic detection of browser dev tools
- **Tab Switching Tracking**: Monitoring for external research
- **Copy-Paste Detection**: Identifying copied responses
- **Right-Click Prevention**: Discouraging context menu usage

## 📈 Scoring Algorithm

### Overall Score Calculation
```
Overall Score = (Behavioral Score × 0.4) + (Response Score × 0.6)
```

### Behavioral Score Components
- **Confidence (25%)**: Self-assurance and decision consistency
- **Stress Management (25%)**: Performance under pressure
- **Attention (20%)**: Focus and engagement levels
- **Honesty (20%)**: Authenticity and integrity indicators
- **Engagement (10%)**: Participation and completion rates

### Response Score Components
- **Ethical Integrity (30%)**: Moral decision-making and boundaries
- **Decision Making (25%)**: Problem-solving approach and quality
- **Communication (20%)**: Professional communication skills
- **Problem Solving (15%)**: Analytical and strategic thinking
- **Teamwork (10%)**: Collaboration and team orientation

## 🎯 Recommendations

### Strong Hire (90+)
- Outstanding performance across all dimensions
- Strong ethical foundation
- Excellent stress management
- Fast-track to final interview

### Hire (80-89)
- Solid performance with minor development areas
- Good cultural fit
- Proceed to next interview round
- Consider probationary period

### Conditional (70-79)
- Potential candidate requiring development
- Address specific concerns
- Additional evaluation needed
- Provide targeted resources

### No Hire (<70)
- Does not meet minimum requirements
- Critical concerns identified
- Thank for time and consideration
- Consider for other roles if appropriate

## 🔧 Configuration

### System Settings
```sql
-- Assessment timeout (minutes)
assessment_timeout_minutes: 120

-- Confidence update interval (ms)
confidence_update_interval: 1000

-- Stress detection threshold
stress_detection_threshold: 60

-- Ethical concern threshold
ethical_concern_threshold: 70

-- Tab switch penalty
tab_switch_penalty: 5

-- Developer tools penalty
dev_tools_penalty: 50
```

### Scoring Weights
```json
{
  "ethical_integrity": 0.30,
  "stress_resilience": 0.25,
  "client_focus": 0.20,
  "consistency": 0.15,
  "adaptability": 0.10
}
```

## 📊 Analytics & Reporting

### Candidate Profiles
- **Personal Information**: Contact details and experience level
- **Assessment Results**: Overall scores and breakdowns
- **Behavioral Analysis**: Confidence, stress, and engagement patterns
- **Psychological Profile**: Decision style, risk tolerance, ethical framework
- **Recommendations**: Hire decision with confidence level and next steps

### Analytics Dashboard
- **Completion Rates**: Assessment success and abandonment metrics
- **Score Distributions**: Performance across candidate pool
- **Stress Patterns**: Stress level distribution and trends
- **Contradiction Analysis**: Inconsistency detection rates
- **Time Analysis**: Completion time patterns and optimization

## 🔒 Security & Privacy

### Data Protection
- **Session Isolation**: Unique session IDs for each assessment
- **Behavioral Anonymization**: Aggregated behavioral data for analysis
- **Secure Storage**: Encrypted database storage
- **Access Control**: Role-based API access

### Assessment Integrity
- **Anti-Cheating Measures**: Developer tools detection, tab switching monitoring
- **Behavioral Validation**: Pattern analysis for authenticity
- **Contradiction Detection**: Response consistency validation
- **Real-time Monitoring**: Continuous behavioral tracking

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=nm_assessment_system
   ```

2. **Database Optimization**
   ```sql
   -- Enable query caching
   SET GLOBAL query_cache_size = 67108864;
   
   -- Optimize table performance
   OPTIMIZE TABLE assessment_sessions;
   OPTIMIZE TABLE behavioral_data;
   ```

3. **Load Balancing**
   - Use Nginx for reverse proxy
   - Implement session stickiness
   - Configure SSL certificates

### Monitoring & Maintenance
- **Performance Metrics**: Response times, database query performance
- **Error Tracking**: Application errors and behavioral anomalies
- **Data Backup**: Automated database backups
- **System Updates**: Regular security and feature updates

## 🤝 Contributing

### Development Guidelines
- Follow ES6+ JavaScript standards
- Use meaningful variable and function names
- Include comprehensive error handling
- Write unit tests for critical functions
- Document complex algorithms and business logic

### Code Structure
- **Modular Design**: Separate concerns into focused modules
- **Event-Driven Architecture**: Use event listeners for loose coupling
- **Promise-Based**: Async operations with proper error handling
- **Configuration-Driven**: Externalize system settings

## 📚 API Documentation

### Assessment Endpoints

#### Start Session
```http
POST /api/assessment/session/start
Content-Type: application/json

{
  "assessmentId": "nm_advisor_2024"
}
```

#### Submit Assessment
```http
POST /api/assessment/submit
Content-Type: application/json

{
  "sessionId": "session_1234567890_abc123",
  "data": {
    "behaviorData": {...},
    "responses": {...},
    "contradictions": [...]
  }
}
```

#### Get Results
```http
GET /api/assessment/results/{sessionId}
```

#### Get Profile
```http
GET /api/assessment/profile/{sessionId}
```

#### Export Data
```http
GET /api/assessment/export/{sessionId}?format=csv
```

### Analytics Endpoints

#### Summary Analytics
```http
GET /api/assessment/analytics/summary
```

#### Timeframe Analytics
```http
GET /api/assessment/analytics/candidates/{timeframe}
```

## 🔮 Future Enhancements

### Planned Features
- **AI-Powered Question Generation**: Dynamic question creation based on candidate responses
- **Video Response Analysis**: Facial expression and body language analysis
- **Advanced Stress Detection**: Heart rate variability and biometric integration
- **Predictive Analytics**: Candidate success prediction models
- **Mobile Optimization**: Responsive design for mobile devices

### Integration Opportunities
- **ATS Integration**: Applicant tracking system connectivity
- **CRM Integration**: Customer relationship management systems
- **Learning Management**: Development resource recommendations
- **Reporting Tools**: Advanced analytics and visualization
- **API Ecosystem**: Third-party integrations and webhooks

## 📞 Support

### Technical Support
- **Documentation**: Comprehensive system documentation
- **Code Examples**: Sample implementations and use cases
- **Troubleshooting**: Common issues and solutions
- **Performance Tuning**: Optimization guidelines

### Business Support
- **Assessment Design**: Custom question development
- **Scoring Customization**: Industry-specific scoring algorithms
- **Training**: System administration and user training
- **Consulting**: Assessment strategy and implementation

---

**Northwestern Mutual Enhanced Assessment System** - Building the future of financial advisor recruitment through intelligent behavioral analysis and comprehensive candidate evaluation.

*Version 1.0.0 | Last Updated: 2024*
