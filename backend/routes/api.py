from flask import Blueprint, request, jsonify, make_response
from flask_cors import cross_origin
from backend.models.assignment import Assignment
from backend.models.exam import Exam
from backend.models.quiz import Quiz
from backend.models.event import Event
from backend import db  # ✅ Correct way to import db

api_blueprint = Blueprint('api', __name__)

# ----------------------------
# Test Route
# ----------------------------
@api_blueprint.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'Smart Scheduler backend is running!'})

# ----------------------------
# CORS Test Route
# ----------------------------
@api_blueprint.route('/api/cors-test')
def cors_test():
    response = make_response({'message': 'CORS test passed!'})
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    return response

# ----------------------------
# Add Assignment
# ----------------------------
@api_blueprint.route('/api/add-assignment', methods=['POST'])
def add_assignment():
    data = request.json
    print("📥 Received assignment data:", data)
    new_assignment = Assignment(
        course_id=data['course_id'],
        title=data['title'],
        due_date=data['due_date'],
        estimated_hours=data.get('estimated_hours'),
        weight=data.get('weight')
    )
    db.session.add(new_assignment)
    db.session.commit()
    return jsonify({'message': 'Assignment added!', 'data': new_assignment.to_dict()})

# ----------------------------
# Add Exam
# ----------------------------
@api_blueprint.route('/api/add-exam', methods=['POST'])
def add_exam():
    data = request.json
    print("📥 Received exam data:", data)
    new_exam = Exam(
        course_id=data['course_id'],
        title=data['title'],
        date=data['date'],
        duration=data.get('duration'),
        weight=data.get('weight')
    )
    db.session.add(new_exam)
    db.session.commit()
    return jsonify({'message': 'Exam added!', 'data': new_exam.to_dict()})

# ----------------------------
# Add Quiz
# ----------------------------
@api_blueprint.route('/api/add-quiz', methods=['POST'])
def add_quiz():
    data = request.json
    print("📥 Received quiz data:", data)
    new_quiz = Quiz(
        course_id=data['course_id'],
        title=data['title'],
        date=data['date'],
        duration=data.get('duration'),
        weight=data.get('weight')
    )
    db.session.add(new_quiz)
    db.session.commit()
    return jsonify({'message': 'Quiz added!', 'data': new_quiz.to_dict()})

# ----------------------------
# Add Event
# ----------------------------
@api_blueprint.route('/api/add-event', methods=['POST'])
def add_event():
    data = request.json
    print("📥 Received event data:", data)
    new_event = Event(
        title=data['title'],
        date=data['date'],
        duration=data.get('duration'),
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Event added!', 'data': new_event.to_dict()})

# ----------------------------
# Get All Assignments
# ----------------------------
@api_blueprint.route('/api/get-assignments', methods=['GET'])
@cross_origin(origin='http://localhost:3000')  # ✅ This enables CORS
def get_assignments():
    assignments = Assignment.query.all()
    return jsonify({'assignments': [a.to_dict() for a in assignments]})

# ----------------------------
# Get All Exams
# ----------------------------
@api_blueprint.route('/api/get-exams', methods=['GET'])
def get_exams():
    exams = Exam.query.all()
    return jsonify({'exams': [e.to_dict() for e in exams]})

# ----------------------------
# Get All Quizzes
# ----------------------------
@api_blueprint.route('/api/get-quizzes', methods=['GET'])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify({'quizzes': [q.to_dict() for q in quizzes]})

# ----------------------------
# Get All Events
# ----------------------------
@api_blueprint.route('/api/get-events', methods=['GET'])
def get_events():
    events = Event.query.all()
    return jsonify({'events': [e.to_dict() for e in events]})
