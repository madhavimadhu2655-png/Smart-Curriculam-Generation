from fastapi import FastAPI, APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
import os
import uuid
import logging
import asyncio
import bcrypt
import jwt
# from composio import Composio
# from composio_openai import OpenAIProvider
import httpx
import json

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(
    title="LearnQuest AI - Learning Path Generator & Progress Tracker",
    description="AI-powered learning path generation with attendance tracking",
    version="1.0.0"
)

# API Router with /api prefix
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# API Keys and Configuration
##GOOGLE_API_KEY = "AIzaSyAMBQJqXVyagFux2lJLHYycU48an_VhQBg"
##EMERGENT_LLM_KEY = "sk-emergent-8Fd925cC7644a35Cd5"
##SECRET_KEY = "your-secret-key-for-jwt-tokens"
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
SECRET_KEY = os.environ.get('SECRET_KEY', '')

# Initialize Composio client
# composio_client = Composio(provider=OpenAIProvider(), api_key=EMERGENT_LLM_KEY)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)
    role: str = Field(default="student", pattern="^(teacher|student)$")

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

class LearningPathCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    topic: str = Field(..., min_length=3, max_length=100)
    duration_days: int = Field(default=7, ge=1, le=30)
    difficulty_level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")
    max_videos_per_day: int = Field(default=3, ge=1, le=10)
    target_hours_per_day: float = Field(default=2.0, ge=0.5, le=8.0)
    assigned_student_ids: List[str] = Field(default=[])  # For teachers assigning to students

class VideoContent(BaseModel):
    id: str
    title: str
    url: str
    channel: str
    duration: str
    description: str
    thumbnail: str
    quality_score: float

class DailySchedule(BaseModel):
    day_number: int
    topic: str
    videos: List[VideoContent]
    estimated_duration_minutes: int
    target_hours: float
    notes: str = ""

class LearningPathResponse(BaseModel):
    id: str
    title: str
    topic: str
    creator_id: str
    creator_name: str
    duration_days: int
    difficulty_level: str
    status: str
    created_at: datetime
    daily_schedule: List[DailySchedule]
    google_drive_link: Optional[str] = None
    notion_page_id: Optional[str] = None
    total_estimated_hours: float

class ProgressUpdate(BaseModel):
    learning_path_id: str
    day_number: int
    video_id: str
    completed: bool
    study_time_minutes: int = 0
    notes: str = ""

class ProgressResponse(BaseModel):
    learning_path_id: str
    student_id: str
    student_name: str
    total_progress_percentage: float
    total_study_time_hours: float
    current_day: int
    daily_progress: List[Dict[str, Any]]

# =============================================================================
# AUTHENTICATION UTILITIES
# =============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str, role: str) -> str:
    """Create JWT access token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        email = payload.get("email")
        role = payload.get("role")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# YOUTUBE INTEGRATION WITH COMPOSIO
# =============================================================================

class YouTubeManager:
    def __init__(self):
        self.google_api_key = GOOGLE_API_KEY

    async def search_educational_videos(self, query: str, max_results: int = 10) -> List[VideoContent]:
        """Search for educational videos using YouTube Data API"""
        try:
            url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                'key': self.google_api_key,
                'q': f"{query} tutorial learn",
                'part': 'snippet',
                'maxResults': max_results,
                'type': 'video',
                'videoDefinition': 'high',
                'videoDuration': 'medium',
                'order': 'relevance'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code != 200:
                    logger.error(f"YouTube search failed: {response.status_code}")
                    return []
                
                data = response.json()
                videos = []
                
                for item in data.get('items', []):
                    video_id = item['id']['videoId']
                    video_details = await self.get_video_details(video_id)
                    
                    if self.is_educational_content(video_details):
                        videos.append(VideoContent(
                            id=video_id,
                            title=item['snippet']['title'],
                            url=f"https://www.youtube.com/watch?v={video_id}",
                            channel=item['snippet']['channelTitle'],
                            duration=video_details.get('duration', 'PT0S'),
                            description=item['snippet']['description'][:300] + "...",
                            thumbnail=item['snippet']['thumbnails']['high']['url'],
                            quality_score=self.calculate_quality_score(video_details)
                        ))
                
                return videos
        except Exception as e:
            logger.error(f"YouTube search error: {str(e)}")
            return []

    async def get_video_details(self, video_id: str) -> Dict:
        """Get detailed video information"""
        try:
            url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                'key': self.google_api_key,
                'id': video_id,
                'part': 'snippet,contentDetails,statistics'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code != 200:
                    return {}
                
                data = response.json()
                if not data.get('items'):
                    return {}
                
                video = data['items'][0]
                return {
                    'duration': video['contentDetails']['duration'],
                    'view_count': int(video['statistics'].get('viewCount', 0)),
                    'like_count': int(video['statistics'].get('likeCount', 0)),
                    'comment_count': int(video['statistics'].get('commentCount', 0)),
                    'tags': video['snippet'].get('tags', [])
                }
        except Exception as e:
            logger.error(f"Failed to get video details: {str(e)}")
            return {}

    def is_educational_content(self, video_details: Dict) -> bool:
        """Filter educational content"""
        view_count = video_details.get('view_count', 0)
        like_count = video_details.get('like_count', 0)
        
        if view_count < 1000:
            return False
        
        engagement_ratio = like_count / max(view_count, 1)
        return engagement_ratio > 0.01

    def calculate_quality_score(self, video_details: Dict) -> float:
        """Calculate video quality score"""
        view_count = video_details.get('view_count', 0)
        like_count = video_details.get('like_count', 0)
        comment_count = video_details.get('comment_count', 0)
        
        score = 0.0
        if view_count > 10000:
            score += 2.0
        if like_count > 100:
            score += 1.0
        if comment_count > 50:
            score += 0.5
        
        return min(score + 5.0, 10.0)  # Base score of 5.0, max 10.0

    def parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to minutes"""
        import re
        match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 60 + minutes + seconds // 60

# =============================================================================
# LEARNING PATH GENERATOR
# =============================================================================

class LearningPathGenerator:
    def __init__(self):
        self.youtube_manager = YouTubeManager()

    async def generate_learning_path(
        self, 
        topic: str, 
        duration_days: int, 
        difficulty_level: str,
        max_videos_per_day: int,
        target_hours_per_day: float
    ) -> List[DailySchedule]:
        """Generate comprehensive learning path"""
        try:
            # Generate topic progression based on difficulty
            daily_topics = self.generate_topic_progression(topic, duration_days, difficulty_level)
            daily_schedule = []
            
            for day_num, day_topic in enumerate(daily_topics, 1):
                # Search for videos for this topic
                search_query = f"{topic} {day_topic} {difficulty_level}"
                videos = await self.youtube_manager.search_educational_videos(
                    search_query, max_results=max_videos_per_day
                )
                
                # Calculate total duration
                total_duration = sum(
                    self.youtube_manager.parse_duration(video.duration) 
                    for video in videos
                )
                
                daily_schedule.append(DailySchedule(
                    day_number=day_num,
                    topic=day_topic,
                    videos=videos,
                    estimated_duration_minutes=total_duration,
                    target_hours=target_hours_per_day,
                    notes=f"Focus on {day_topic} concepts and practice"
                ))
            
            return daily_schedule
        except Exception as e:
            logger.error(f"Learning path generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate learning path")

    def generate_topic_progression(self, topic: str, duration_days: int, difficulty_level: str) -> List[str]:
        """Generate progressive topic breakdown"""
        topic_lower = topic.lower()
        
        # Basic progression templates
        if "python" in topic_lower:
            base_topics = [
                "Python Basics", "Variables and Data Types", "Control Structures",
                "Functions", "Lists and Dictionaries", "File Handling",
                "Object-Oriented Programming", "Modules and Packages",
                "Error Handling", "Libraries and APIs"
            ]
        elif "javascript" in topic_lower:
            base_topics = [
                "JavaScript Fundamentals", "Variables and Types", "Functions",
                "DOM Manipulation", "Events", "Async Programming",
                "ES6 Features", "APIs and Fetch", "Frameworks", "Best Practices"
            ]
        elif "data science" in topic_lower:
            base_topics = [
                "Data Science Introduction", "Statistics Basics", "Python for Data Science",
                "Pandas and NumPy", "Data Visualization", "Data Cleaning",
                "Machine Learning Basics", "Model Evaluation", "Advanced ML", "Projects"
            ]
        else:
            # Generic progression
            base_topics = [
                f"{topic} Introduction", f"{topic} Fundamentals", f"{topic} Basics",
                f"Intermediate {topic}", f"Advanced {topic}", f"{topic} Projects",
                f"{topic} Best Practices", f"{topic} Real World", f"{topic} Mastery"
            ]
        
        # Adjust based on duration
        if duration_days <= len(base_topics):
            return base_topics[:duration_days]
        else:
            # Repeat and expand topics
            multiplier = duration_days // len(base_topics) + 1
            expanded_topics = base_topics * multiplier
            return expanded_topics[:duration_days]

# =============================================================================
# API ENDPOINTS
# =============================================================================

# Authentication endpoints
@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "role": user_data.role,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        created_at=user_doc["created_at"]
    )

@api_router.post("/auth/login")
async def login_user(user_data: UserLogin):
    """User login"""
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user["_id"], user["email"], user["role"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

# Learning Path endpoints
@api_router.post("/learning-paths", response_model=LearningPathResponse)
async def create_learning_path(
    path_data: LearningPathCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create new learning path"""
    generator = LearningPathGenerator()
    
    # Generate the learning path
    daily_schedule = await generator.generate_learning_path(
        topic=path_data.topic,
        duration_days=path_data.duration_days,
        difficulty_level=path_data.difficulty_level,
        max_videos_per_day=path_data.max_videos_per_day,
        target_hours_per_day=path_data.target_hours_per_day
    )
    
    # Calculate total estimated hours
    total_hours = sum(schedule.target_hours for schedule in daily_schedule)
    
    # Create learning path document
    path_id = str(uuid.uuid4())
    learning_path = {
        "_id": path_id,
        "title": path_data.title,
        "topic": path_data.topic,
        "creator_id": current_user["id"],
        "creator_name": current_user["name"],
        "duration_days": path_data.duration_days,
        "difficulty_level": path_data.difficulty_level,
        "status": "active",
        "created_at": datetime.utcnow(),
        "daily_schedule": [schedule.dict() for schedule in daily_schedule],
        "total_estimated_hours": total_hours,
        "assigned_student_ids": path_data.assigned_student_ids
    }
    
    await db.learning_paths.insert_one(learning_path)
    
    # Initialize progress tracking for assigned students or self
    student_ids = path_data.assigned_student_ids if path_data.assigned_student_ids else [current_user["id"]]
    for student_id in student_ids:
        await initialize_student_progress(path_id, student_id)
    
    # Background task for external integrations (Google Drive, Notion)
    background_tasks.add_task(create_external_integrations, learning_path)
    
    return LearningPathResponse(
        id=path_id,
        title=path_data.title,
        topic=path_data.topic,
        creator_id=current_user["id"],
        creator_name=current_user["name"],
        duration_days=path_data.duration_days,
        difficulty_level=path_data.difficulty_level,
        status="active",
        created_at=learning_path["created_at"],
        daily_schedule=daily_schedule,
        total_estimated_hours=total_hours
    )

async def initialize_student_progress(learning_path_id: str, student_id: str):
    """Initialize progress tracking for a student"""
    progress_doc = {
        "_id": str(uuid.uuid4()),
        "learning_path_id": learning_path_id,
        "student_id": student_id,
        "total_progress_percentage": 0.0,
        "total_study_time_minutes": 0,
        "current_day": 1,
        "daily_progress": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.progress_tracking.insert_one(progress_doc)

async def create_external_integrations(learning_path: dict):
    """Background task for Google Drive and Notion integration"""
    try:
        # TODO: Implement Google Drive document creation
        # TODO: Implement Notion workspace creation
        logger.info(f"External integrations created for learning path {learning_path['_id']}")
    except Exception as e:
        logger.error(f"External integration failed: {str(e)}")

@api_router.get("/learning-paths", response_model=List[LearningPathResponse])
async def get_learning_paths(current_user: dict = Depends(get_current_user)):
    """Get learning paths for current user"""
    if current_user["role"] == "teacher":
        # Teachers see paths they created
        cursor = db.learning_paths.find({"creator_id": current_user["id"]})
    else:
        # Students see paths assigned to them or created by them
        cursor = db.learning_paths.find({
            "$or": [
                {"creator_id": current_user["id"]},
                {"assigned_student_ids": current_user["id"]}
            ]
        })
    
    learning_paths = await cursor.to_list(100)
    
    return [
        LearningPathResponse(
            id=path["_id"],
            title=path["title"],
            topic=path["topic"],
            creator_id=path["creator_id"],
            creator_name=path["creator_name"],
            duration_days=path["duration_days"],
            difficulty_level=path["difficulty_level"],
            status=path["status"],
            created_at=path["created_at"],
            daily_schedule=[DailySchedule(**schedule) for schedule in path["daily_schedule"]],
            google_drive_link=path.get("google_drive_link"),
            notion_page_id=path.get("notion_page_id"),
            total_estimated_hours=path["total_estimated_hours"]
        )
        for path in learning_paths
    ]

@api_router.post("/progress/update")
async def update_progress(
    progress_data: ProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update learning progress"""
    # Find existing progress record
    progress_record = await db.progress_tracking.find_one({
        "learning_path_id": progress_data.learning_path_id,
        "student_id": current_user["id"]
    })
    
    if not progress_record:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    # Update daily progress
    daily_progress = progress_record.get("daily_progress", [])
    
    # Find or create daily progress entry
    day_entry = None
    for entry in daily_progress:
        if entry["day_number"] == progress_data.day_number:
            day_entry = entry
            break
    
    if not day_entry:
        day_entry = {
            "day_number": progress_data.day_number,
            "videos_completed": [],
            "total_study_time_minutes": 0,
            "completion_percentage": 0.0,
            "notes": ""
        }
        daily_progress.append(day_entry)
    
    # Update video completion
    video_completed = {
        "video_id": progress_data.video_id,
        "completed": progress_data.completed,
        "study_time_minutes": progress_data.study_time_minutes,
        "completed_at": datetime.utcnow().isoformat()
    }
    
    # Remove existing entry for this video and add new one
    day_entry["videos_completed"] = [
        v for v in day_entry["videos_completed"] 
        if v["video_id"] != progress_data.video_id
    ]
    day_entry["videos_completed"].append(video_completed)
    
    # Update total study time for the day
    day_entry["total_study_time_minutes"] = sum(
        v["study_time_minutes"] for v in day_entry["videos_completed"]
    )
    
    # Calculate completion percentage for the day
    total_videos_for_day = len(day_entry["videos_completed"])
    completed_videos = sum(1 for v in day_entry["videos_completed"] if v["completed"])
    day_entry["completion_percentage"] = (completed_videos / total_videos_for_day * 100) if total_videos_for_day > 0 else 0
    
    # Update notes
    if progress_data.notes:
        day_entry["notes"] = progress_data.notes
    
    # Calculate overall progress
    total_study_time = sum(day["total_study_time_minutes"] for day in daily_progress)
    total_days = len(daily_progress)
    overall_progress = sum(day["completion_percentage"] for day in daily_progress) / total_days if total_days > 0 else 0
    
    # Update progress record
    await db.progress_tracking.update_one(
        {"_id": progress_record["_id"]},
        {
            "$set": {
                "daily_progress": daily_progress,
                "total_study_time_minutes": total_study_time,
                "total_progress_percentage": overall_progress,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Progress updated successfully", "progress_percentage": overall_progress}

@api_router.get("/progress/{learning_path_id}", response_model=ProgressResponse)
async def get_progress(learning_path_id: str, current_user: dict = Depends(get_current_user)):
    """Get learning progress for a path"""
    progress_record = await db.progress_tracking.find_one({
        "learning_path_id": learning_path_id,
        "student_id": current_user["id"]
    })
    
    if not progress_record:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    return ProgressResponse(
        learning_path_id=learning_path_id,
        student_id=current_user["id"],
        student_name=current_user["name"],
        total_progress_percentage=progress_record["total_progress_percentage"],
        total_study_time_hours=progress_record["total_study_time_minutes"] / 60,
        current_day=progress_record["current_day"],
        daily_progress=progress_record["daily_progress"]
    )

# =============================================================================
# STUDENT MANAGEMENT ENDPOINTS
# =============================================================================

class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    rollNo: str = Field(..., min_length=1, max_length=50)
    class_name: str = Field(default="", max_length=50, alias="class")
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    username: str = Field(default="", max_length=50)

class StudentResponse(BaseModel):
    id: str
    name: str
    rollNo: str
    class_name: str = Field(alias="class")
    email: str
    username: str
    created_at: datetime
    
    class Config:
        populate_by_name = True

@api_router.post("/students", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new student (for teachers)"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check for duplicate roll number
    existing_roll = await db.students.find_one({"rollNo": student_data.rollNo})
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll number already exists")
    
    # Check for duplicate email
    existing_email = await db.students.find_one({"email": student_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    student_id = str(uuid.uuid4())
    student_doc = {
        "_id": student_id,
        "name": student_data.name,
        "rollNo": student_data.rollNo,
        "class": student_data.class_name,
        "email": student_data.email,
        "username": student_data.username or student_data.rollNo,
        "created_at": datetime.utcnow(),
        "teacher_id": current_user["id"]
    }
    
    await db.students.insert_one(student_doc)
    
    return StudentResponse(
        id=student_id,
        name=student_data.name,
        rollNo=student_data.rollNo,
        class_name=student_data.class_name,
        email=student_data.email,
        username=student_doc["username"],
        created_at=student_doc["created_at"]
    )

@api_router.get("/students", response_model=List[StudentResponse])
async def get_students(current_user: dict = Depends(get_current_user)):
    """Get all students (for teachers)"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    students = await db.students.find({"teacher_id": current_user["id"]}).to_list(1000)
    return [
        StudentResponse(
            id=student["_id"],
            name=student["name"],
            rollNo=student["rollNo"],
            **{"class": student.get("class", "")},  # Use the alias properly
            email=student["email"],
            username=student["username"],
            created_at=student["created_at"]
        )
        for student in students
    ]

@api_router.delete("/students/{student_id}")
async def delete_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a student (for teachers)"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if student exists and belongs to teacher
    student = await db.students.find_one({
        "_id": student_id,
        "teacher_id": current_user["id"]
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete student
    await db.students.delete_one({"_id": student_id})
    
    # Delete related attendance records
    await db.attendance.delete_many({"student_id": student_id})
    
    return {"message": "Student deleted successfully"}

# =============================================================================
# ATTENDANCE TRACKING ENDPOINTS
# =============================================================================

class AttendanceRecord(BaseModel):
    student_id: str
    subject: str
    date: str
    status: str = Field(pattern="^(present|absent)$")
    method: str = Field(default="Manual", pattern="^(QR Scanner|Manual)$")
    time: str
    notes: str = ""

class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_rollNo: str
    subject: str
    date: str
    status: str
    method: str
    time: str
    notes: str
    marked_at: datetime

@api_router.post("/attendance/mark", response_model=AttendanceResponse)
async def mark_attendance(
    attendance_data: AttendanceRecord,
    current_user: dict = Depends(get_current_user)
):
    """Mark attendance for a student"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify student exists and belongs to teacher
    student = await db.students.find_one({
        "_id": attendance_data.student_id,
        "teacher_id": current_user["id"]
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if attendance already marked for this date/subject/student
    existing_attendance = await db.attendance.find_one({
        "student_id": attendance_data.student_id,
        "date": attendance_data.date,
        "subject": attendance_data.subject
    })
    
    attendance_id = str(uuid.uuid4())
    
    if existing_attendance:
        # Update existing record
        await db.attendance.update_one(
            {"_id": existing_attendance["_id"]},
            {
                "$set": {
                    "status": attendance_data.status,
                    "method": attendance_data.method,
                    "time": attendance_data.time,
                    "notes": attendance_data.notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        attendance_id = existing_attendance["_id"]
    else:
        # Create new record
        attendance_doc = {
            "_id": attendance_id,
            "student_id": attendance_data.student_id,
            "subject": attendance_data.subject,
            "date": attendance_data.date,
            "status": attendance_data.status,
            "method": attendance_data.method,
            "time": attendance_data.time,
            "notes": attendance_data.notes,
            "teacher_id": current_user["id"],
            "marked_at": datetime.utcnow()
        }
        
        await db.attendance.insert_one(attendance_doc)
    
    return AttendanceResponse(
        id=attendance_id,
        student_id=attendance_data.student_id,
        student_name=student["name"],
        student_rollNo=student["rollNo"],
        subject=attendance_data.subject,
        date=attendance_data.date,
        status=attendance_data.status,
        method=attendance_data.method,
        time=attendance_data.time,
        notes=attendance_data.notes,
        marked_at=datetime.utcnow()
    )

@api_router.get("/attendance/recent", response_model=List[AttendanceResponse])
async def get_recent_attendance(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get recent attendance records"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get recent attendance with student details
    pipeline = [
        {"$match": {"teacher_id": current_user["id"]}},
        {"$sort": {"marked_at": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "students",
                "localField": "student_id",
                "foreignField": "_id",
                "as": "student"
            }
        },
        {"$unwind": "$student"}
    ]
    
    attendance_records = await db.attendance.aggregate(pipeline).to_list(limit)
    
    return [
        AttendanceResponse(
            id=record["_id"],
            student_id=record["student_id"],
            student_name=record["student"]["name"],
            student_rollNo=record["student"]["rollNo"],
            subject=record["subject"],
            date=record["date"],
            status=record["status"],
            method=record["method"],
            time=record["time"],
            notes=record["notes"],
            marked_at=record["marked_at"]
        )
        for record in attendance_records
    ]

@api_router.get("/attendance/weekly")
async def get_weekly_attendance(current_user: dict = Depends(get_current_user)):
    """Get weekly attendance data for dashboard"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get dates for current week
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    
    weekly_data = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for i, day_name in enumerate(days):
        current_date = monday + timedelta(days=i)
        date_str = current_date.isoformat()
        
        # Count present and absent for this date
        pipeline = [
            {
                "$match": {
                    "teacher_id": current_user["id"],
                    "date": date_str
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        status_counts = await db.attendance.aggregate(pipeline).to_list(10)
        
        present = 0
        absent = 0
        
        for status in status_counts:
            if status["_id"] == "present":
                present = status["count"]
            elif status["_id"] == "absent":
                absent = status["count"]
        
        weekly_data.append({
            "day": day_name,
            "date": date_str,
            "present": present,
            "absent": absent
        })
    
    return weekly_data

@api_router.get("/attendance/qr-scan/{rollNo}")
async def scan_qr_attendance(
    rollNo: str,
    subject: str,
    current_user: dict = Depends(get_current_user)
):
    """Process QR code scan for attendance"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find student by roll number
    student = await db.students.find_one({
        "rollNo": rollNo,
        "teacher_id": current_user["id"]
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Mark attendance automatically
    today = date.today().isoformat()
    current_time = datetime.now().strftime("%H:%M:%S")
    
    attendance_data = AttendanceRecord(
        student_id=student["_id"],
        subject=subject,
        date=today,
        status="present",
        method="QR Scanner",
        time=current_time
    )
    
    # Use existing mark_attendance logic
    existing_attendance = await db.attendance.find_one({
        "student_id": student["_id"],
        "date": today,
        "subject": subject
    })
    
    if existing_attendance:
        return {
            "message": f"{student['name']} already marked present for {subject}",
            "student": student,
            "status": "already_marked"
        }
    
    attendance_id = str(uuid.uuid4())
    attendance_doc = {
        "_id": attendance_id,
        "student_id": student["_id"],
        "subject": subject,
        "date": today,
        "status": "present",
        "method": "QR Scanner",
        "time": current_time,
        "notes": "",
        "teacher_id": current_user["id"],
        "marked_at": datetime.utcnow()
    }
    
    await db.attendance.insert_one(attendance_doc)
    
    return {
        "message": f"{student['name']} marked PRESENT for {subject}",
        "student": student,
        "status": "marked",
        "attendance": attendance_doc
    }

# Health check
@api_router.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "operational",
            "youtube_api": "operational",
            "composio": "operational"
        }
    }

# Include router in main app
app.include_router(api_router)

# Application startup
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("LearnQuest AI API starting up...")
    
    # Create indexes for better performance
    await db.users.create_index("email", unique=True)
    await db.learning_paths.create_index("creator_id")
    await db.progress_tracking.create_index([("learning_path_id", 1), ("student_id", 1)])

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    logger.info("LearnQuest AI API shutting down...")
    client.close()
