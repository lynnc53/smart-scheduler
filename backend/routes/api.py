# routes/api.py 

from flask import Blueprint, request, jsonify
from models.assignment import Assignment
from models.exam import Exam 
from models.quiz import Quiz 
from models.event import Event 
from __init__ import db

api_blueprint = Blueprint('api', __name__)

# ----------------------------
# Test Route
# ----------------------------
@api_blueprint.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'Smart Scheduler backend is running!'})

# ----------------------------
# Database-backed Assignment Route
# ----------------------------
@api_blueprint.route('/api/add-assignment', methods=['POST'])
def add_assignment():
    data = request.json
    print("📥 Received assignment data:", data)  # DEBUGGING PRINT
    new_assignment = Assignment(
        course_id=data['course_id'],
        title=data['title'],
        due_date=data['due_date'],
        estimated_hours=data.get('estimated_hours'),
        weight=data.get('weight')
    )
    db.session.add(new_assignment)
    db.session.commit()
    return jsonify({'message': 'Assignment added!', 'assignment': new_assignment.to_dict()})

# ----------------------------
# Database-backed Exams Route
# ----------------------------
@api_blueprint.route('/api/add-exam', methods=['POST'])
def add_exam():
    data = request.json
    print("📥 Received Exam data:", data)  # DEBUGGING PRINT
    new_exam = Exam(
        course_id=data['course_id'],
        title=data['title'],
        date=data['date'],
        duration=data.get('duration'),
        weight=data.get('weight')
    )
    db.session.add(new_exam)
    db.session.commit()
    return jsonify({'message': 'Assignment added!', 'assignment': new_exam.to_dict()})

# ----------------------------
# Database-backed Quiz Route
# ----------------------------
@api_blueprint.route('/api/add-quiz', methods=['POST'])
def add_quiz():
    data = request.json
    print("📥 Received Quiz data:", data)  # DEBUGGING PRINT
    new_quiz = Quiz(
        course_id=data['course_id'],
        title=data['title'],
        date=data['date'],
        duration=data.get('duration'),
        weight=data.get('weight')
    )
    db.session.add(new_quiz)
    db.session.commit()
    return jsonify({'message': 'Assignment added!', 'assignment': new_quiz.to_dict()})

# ----------------------------
# Database-backed Event Route
# ----------------------------
@api_blueprint.route('/api/add-Event', methods=['POST'])
def add_event():
    data = request.json
    print("📥 Received Event data:", data)  # DEBUGGING PRINT
    new_event = Event(
        title=data['title'],
        date=data['date'],
        duration=data.get('duration'),
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Assignment added!', 'assignment': new_event.to_dict()})

# ----------------------------
# Get All Assignments
# ----------------------------
@api_blueprint.route('/api/get-assignments', methods=['GET'])
def get_assignments():
    assignments = Assignment.query.all()
    return jsonify({'assignments': [a.to_dict() for a in assignments]})

# ----------------------------
# Get All Exams
# ----------------------------
@api_blueprint.route('/api/get-exams', methods=['GET'])
def get_exams():
    exams = Exam.query.all()
    return jsonify({'exams': [a.to_dict() for a in exams]})

# ----------------------------
# Get All Quizzes
# ----------------------------
@api_blueprint.route('/api/get-quiz', methods=['GET'])
def get_quiz():
    quiz = Quiz.query.all()
    return jsonify({'quiz': [a.to_dict() for a in quiz]})

# ----------------------------
# Get All Events
# ----------------------------
@api_blueprint.route('/api/get-quiz', methods=['GET'])
def get_quiz():
    events = Event.query.all()
    return jsonify({'events': [a.to_dict() for a in events]})