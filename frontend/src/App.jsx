import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState({ course_id: '', title: '', due_date: '', estimated_hours: '', weight: '' });
  const [quiz, setQuiz] = useState({ course_id: '', title: '', date: '', duration: '', weight: '' });
  const [exam, setExam] = useState({ course_id: '', title: '', date: '', duration: '', weight: '' });
  const [event, setEvent] = useState({ title: '', date: '', duration: '' });
  const [icsFile, setIcsFile] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [aRes, qRes, eRes, vRes] = await Promise.all([
          fetch('http://127.0.0.1:5000/api/get-assignments'),
          fetch('http://127.0.0.1:5000/api/get-quizzes'),
          fetch('http://127.0.0.1:5000/api/get-exams'),
          fetch('http://127.0.0.1:5000/api/get-events')
        ]);

        const [aData, qData, eData, vData] = await Promise.all([
          aRes.json(), qRes.json(), eRes.json(), vRes.json()
        ]);

        setAssignments(aData.assignments || []);

        const allBlocks = [];
        const availability = Array(7).fill().map(() => Array(15).fill(true));

        (qData.quizzes || []).forEach(q => {
          const d = getDayIndex(q.date), h = getHourIndex(q.date) - 9;
          if (availability[d] && availability[d][h] !== undefined) availability[d][h] = false;
          allBlocks.push({ day: d, hour: h + 9, title: `${q.course_id}: ${q.title}`, type: 'quiz' });
        });
        
        (eData.exams || []).forEach(ex => {
          const d = getDayIndex(ex.date), h = getHourIndex(ex.date) - 9;
          if (availability[d] && availability[d][h] !== undefined) availability[d][h] = false;
          allBlocks.push({ day: d, hour: h + 9, title: `${ex.course_id}: ${ex.title}`, type: 'exam' });
        });

        (vData.events || []).forEach(ev => {
          const d = getDayIndex(ev.date), h = getHourIndex(ev.date) - 9;
          if (availability[d] && availability[d][h] !== undefined) availability[d][h] = false;
          allBlocks.push({ day: d, hour: h + 9, title: ev.title, type: 'event' });
        });

        
        (aData.assignments || []).forEach(a => {
          allBlocks.push(...allocateStudyTime({ ...a, title: `${a.course_id}: ${a.title}` }, availability));
        });

        setStudyBlocks(allBlocks);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const allocateStudyTime = (task, availability) => {
    const blocks = [];
    const now = new Date();
    const due = new Date(task.due_date);
    const totalHours = parseInt(task.estimated_hours || 1);
    const daysLeft = Math.max(Math.ceil((due - now) / (1000 * 60 * 60 * 24)), 1);
    let remaining = totalHours;

    for (let d = 0; d < daysLeft && remaining > 0; d++) {
      const dayIndex = (now.getDay() + d + 6) % 7;
      for (let h = 0; h < 15 && remaining > 0; h++) {
        if (availability[dayIndex][h]) {
          availability[dayIndex][h] = false;
          blocks.push({ day: dayIndex, hour: h + 9, title: task.title, type: 'assignment' });
          remaining--;
        }
      }
    }
    return blocks;
  };

  const handleAssignmentChange = (e) => setAssignment({ ...assignment, [e.target.name]: e.target.value });
  const handleQuizChange = (e) => setQuiz({ ...quiz, [e.target.name]: e.target.value });
  const handleExamChange = (e) => setExam({ ...exam, [e.target.name]: e.target.value });
  const handleEventChange = (e) => setEvent({ ...event, [e.target.name]: e.target.value });

  const handleIcsSubmit = async (e) => {
    e.preventDefault();
    if (!icsFile) return;
    const formData = new FormData();
    formData.append('file', icsFile);
    await fetch('http://127.0.0.1:5000/api/upload-acorn-ics', { method: 'POST', body: formData });
    window.location.reload();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-assignment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment)
    }).then(() => window.location.reload());
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-quiz', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    }).then(() => window.location.reload());
  };

  const handleExamSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-exam', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    }).then(() => window.location.reload());
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/add-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).then(() => window.location.reload());
  };

  const getDayIndex = (dateStr) => (new Date(dateStr).getDay() + 6) % 7;
  const getHourIndex = (dateStr) => new Date(dateStr).getHours();
  
  return (
    <div className="container">
      <h1>Smart Scheduler</h1>

      <form onSubmit={handleIcsSubmit}>
        <h3>📅 Import ACORN Timetable (.ics)</h3>
        <input type="file" accept=".ics" onChange={e => setIcsFile(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>

      <form onSubmit={handleSubmit}>
        <h3>Add Assignment</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={assignment.course_id} onChange={handleAssignmentChange} required />
        <input type="text" name="title" placeholder="Title" value={assignment.title} onChange={handleAssignmentChange} required />
        <input type="datetime-local" name="due_date" value={assignment.due_date} onChange={handleAssignmentChange} required />
        <input type="number" name="estimated_hours" placeholder="Hours" value={assignment.estimated_hours} onChange={handleAssignmentChange} required />
        <input type="number" name="weight" placeholder="Weight" value={assignment.weight} onChange={handleAssignmentChange} required />
        <button type="submit">Add Assignment</button>
      </form>

      <form onSubmit={handleQuizSubmit}>
        <h3>Add Quiz</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={quiz.course_id} onChange={handleQuizChange} required />
        <input type="text" name="title" placeholder="Quiz Title" value={quiz.title} onChange={handleQuizChange} required />
        <input type="datetime-local" name="date" value={quiz.date} onChange={handleQuizChange} required />
        <input type="number" name="duration" placeholder="Duration" value={quiz.duration} onChange={handleQuizChange} />
        <input type="number" name="weight" placeholder="Weight" value={quiz.weight} onChange={handleQuizChange} />
        <button type="submit">Add Quiz</button>
      </form>

      <form onSubmit={handleExamSubmit}>
        <h3>Add Exam</h3>
        <input type="text" name="course_id" placeholder="Course ID" value={exam.course_id} onChange={handleExamChange} required />
        <input type="text" name="title" placeholder="Exam Title" value={exam.title} onChange={handleExamChange} required />
        <input type="datetime-local" name="date" value={exam.date} onChange={handleExamChange} required />
        <input type="number" name="duration" placeholder="Duration" value={exam.duration} onChange={handleExamChange} />
        <input type="number" name="weight" placeholder="Weight" value={exam.weight} onChange={handleExamChange} />
        <button type="submit">Add Exam</button>
      </form>

      <form onSubmit={handleEventSubmit}>
        <h3>Add Event</h3>
        <input type="text" name="title" placeholder="Event Title" value={event.title} onChange={handleEventChange} required />
        <input type="datetime-local" name="date" value={event.date} onChange={handleEventChange} required />
        <input type="number" name="duration" placeholder="Duration" value={event.duration} onChange={handleEventChange} />
        <button type="submit">Add Event</button>
      </form>

      <div className="calendar">
        <div className="calendar-header">
          <div className="time-label"></div>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
            const today = new Date();
            const offset = (i - 0 + 1 + 7) % 7;  // shift Monday to be first
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + offset);
            const label = `${day} ${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return (
              <div className="calendar-day-header" key={day}>{label}</div>
            );
          })}
        </div>

        <div className="calendar-body">
          {[...Array(15)].map((_, i) => {
            const hour = i + 9;
            return (
              <div className="calendar-row" key={hour}>
                <div className="time-label">{hour}:00</div>
                {[...Array(7)].map((_, j) => {
                  const cellBlocks = studyBlocks.filter(b => b.day === j && b.hour === hour);
                  return (
                    <div className="calendar-cell" key={j}>
                      {cellBlocks.map((b, idx) => (
                        <div className={`study-block ${b.type}`} key={idx}>{b.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
