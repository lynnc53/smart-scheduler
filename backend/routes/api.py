from flask import Blueprint, request, jsonify, make_response
from backend.models.assignment import Assignment
from backend.models.exam import Exam
from backend.models.quiz import Quiz
from backend.models.event import Event
from backend import db  
import ics

api_blueprint = Blueprint('api', __name__)

# ----------------------------
# Test Route
# ----------------------------
@api_blueprint.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'Smart Scheduler backend is running!'})

# Add acorn schedule 


@api_blueprint.route('/api/upload-acorn-ics', methods=['POST'])
def upload_acorn_ics():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    calendar = ics.Calendar(file.read().decode('utf-8'))

    for event in calendar.events:
        title = event.name or "Untitled"
        date = event.begin.datetime
        duration_hours = event.duration.total_seconds() / 3600.0

        new_event = Event(
            title=title,
            date=date,
            duration=duration_hours
        )

        db.session.add(new_event)

    db.session.commit()
    return jsonify({'message': '✅ Timetable imported successfully!'})
# ----------------------------
# Add Assignment
# ----------------------------
@api_blueprint.route('/api/add-assignment', methods=['POST'])
def add_assignment():
    data = request.json
    print("📥 Received assignment data:", data)

    try:
        new_assignment = Assignment(
            course_id=data['course_id'],
            title=data['title'],
            due_date=data['due_date'],
            estimated_hours=int(data.get('estimated_hours', 0)),
            weight=int(data.get('weight', 0))
        )
        db.session.add(new_assignment)
        db.session.commit()
        print("✅ Assignment saved to database.")
        return jsonify({'message': 'Assignment added!', 'data': new_assignment.to_dict()})

    except Exception as e:
        db.session.rollback()
        print("❌ Error saving assignment:", str(e))
        return jsonify({'error': str(e)}), 500

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
    print("Received quiz data:", data)
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
def get_assignments():
    assignments = Assignment.query.all()
    print("📦 Returning", len(assignments), "assignments")
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

## DELETE 
@api_blueprint.route('/api/delete-all-assignments', methods=['POST'])
def delete_all_assignments():
    try:
        Assignment.query.delete()
        db.session.commit()
        return jsonify({'message': 'All assignments deleted.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/api/delete-all-quizzes', methods=['POST'])
def delete_all_quizzes():
    try:
        Quiz.query.delete()
        db.session.commit()
        return jsonify({'message': 'All quizzes deleted.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/api/delete-all-exams', methods=['POST'])
def delete_all_exams():
    try:
        Exam.query.delete()
        db.session.commit()
        return jsonify({'message': 'All exams deleted.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/api/delete-all-events', methods=['POST'])
def delete_all_events():
    try:
        Event.query.delete()
        db.session.commit()
        return jsonify({'message': 'All events deleted.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
