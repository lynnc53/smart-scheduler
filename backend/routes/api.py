# routes/api.py 

from flask import Blueprint, jsonify 
from flask import request 
from models.task import Task

tasks = []

api_blueprint = Blueprint('api', __name__)

@api_blueprint.route('/api/ping', methods = ['GET'])
def ping():
    return jsonify({'message': 'Smart Scheduler backend is running!'})

@api_blueprint.route('/api/add-task', methods = ['POST'])
def add_task():
    data = request.json 
    name = data.get('name')
    due_date = data.get('due_date')
    priority = data.get('priority')
    
    task = Task(name, due_date, priority)
    tasks.append(task)
    
    return {"message": "Task added successfully"}, 201

@api_blueprint.route('/api/get-tasks', methods=['GET'])
def get_tasks():
    return {"tasks": [task.to_dict() for task in tasks]}

@api_blueprint.route('/api/generate-schedule', methods=['GET'])
def generate_schedule():
    schedule = {
        "Monday": [],
        "Tuesday": [],
        "Wednesday": [],
        "Thursday": [],
        "Friday": [],
        "Saturday": [],
        "Sunday": []
    }

    # Basic logic: assign tasks in order to each day
    for i, task in enumerate(tasks):
        day = list(schedule.keys())[i % 7]  # rotate through weekdays
        schedule[day].append(task.to_dict())

    return {"schedule": schedule}
