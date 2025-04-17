console.log("✅ JS is running");

const BACKEND_URL = "http://localhost:5000";

const assignmentList = document.getElementById("assignment-list");
const loadingIndicator = document.getElementById("loading");

fetch(`${BACKEND_URL}/api/get-assignments`)
  .then(res => res.json())
  .then(data => {
    loadingIndicator.style.display = 'none';

    if (data.assignments.length === 0) {
      assignmentList.innerHTML = "<p>No assignments yet.</p>";
      return;
    }

    data.assignments.forEach(assignment => {
      const div = document.createElement('div');
      div.className = 'assignment';
      div.innerHTML = `
        <h3>${assignment.title}</h3>
        <p><strong>Due:</strong> ${new Date(assignment.due_date).toLocaleString()}</p>
        <p><strong>Course ID:</strong> ${assignment.course_id}</p>
        <p><strong>Estimated Hours:</strong> ${assignment.estimated_hours || 'N/A'}</p>
        <p><strong>Weight:</strong> ${assignment.weight || 'N/A'}</p>
      `;
      assignmentList.appendChild(div);
    });
  })
  .catch(error => {
    loadingIndicator.textContent = "Failed to load assignments.";
    console.error("Error fetching assignments:", error);
  });
