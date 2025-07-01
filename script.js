const apiUrl = 'http://localhost:8080/api/students';

document.addEventListener('DOMContentLoaded', () => {
    loadStudents();

    const form = document.getElementById('studentForm');
    form.addEventListener('submit', handleSubmit);

    document.getElementById('searchInput').addEventListener('input', loadStudents);
    document.getElementById('courseFilter').addEventListener('input', loadStudents);
    document.getElementById('ageFilter').addEventListener('input', loadStudents);
});

async function loadStudents() {
    const list = document.getElementById('studentList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const courseFilter = document.getElementById('courseFilter').value.toLowerCase();
    const ageFilter = document.getElementById('ageFilter').value;

    list.innerHTML = '';

    try {
        const res = await fetch(apiUrl);
        const students = await res.json();

        students
            .filter(s =>
                (s.name.toLowerCase().includes(searchTerm) || s.course.toLowerCase().includes(searchTerm)) &&
                (!courseFilter || s.course.toLowerCase().includes(courseFilter)) &&
                (!ageFilter || s.age <= parseInt(ageFilter))
            )
            .forEach((s) => {
                const li = document.createElement('li');
                li.className = 'bg-white shadow-md p-4 rounded-md flex justify-between items-center';

                li.innerHTML = `
          <div>
            <p class="font-bold text-lg">${s.name}</p>
            <p>Email: ${s.email}</p>
            <p>Course: ${s.course} | Age: ${s.age}</p>
          </div>
          <div class="space-x-2">
            <button class="bg-yellow-500 text-white px-3 py-1 rounded"
              onclick="editStudent(${s.id}, '${escapeQuotes(s.name)}', '${escapeQuotes(s.email)}', '${escapeQuotes(s.course)}', ${s.age})">
              Edit
            </button>
            <button class="bg-red-600 text-white px-3 py-1 rounded"
              onclick="deleteStudent(${s.id})">
              Delete
            </button>
          </div>
        `;
                list.appendChild(li);
            });
    } catch (err) {
        Swal.fire("Error", "Failed to load students", "error");
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const course = document.getElementById('course').value.trim();
    const age = parseInt(document.getElementById('age').value);

    if (!name || !email || !course || isNaN(age)) {
        Swal.fire("Validation Error", "All fields are required", "warning");
        return;
    }

    if (age < 10 || age > 100) {
        Swal.fire("Validation Error", "Age must be between 10 and 100", "warning");
        return;
    }

    const student = { name, email, course, age };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${apiUrl}/${id}` : apiUrl;

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });

        if (!res.ok) {
            const data = await res.json();
            Swal.fire("Error", data.message || "Validation failed", "error");
            return;
        }

        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';

        Swal.fire(id ? "Updated" : "Added", id ? "Student updated" : "Student added", "success");
        loadStudents();
    } catch (err) {
        Swal.fire("Error", "Server error", "error");
    }
}

function editStudent(id, name, email, course, age) {
    document.getElementById('studentId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('course').value = course;
    document.getElementById('age').value = age;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteStudent(id) {
    const confirm = await Swal.fire({
        title: "Delete Student?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
        const res = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            Swal.fire("Deleted", "Student has been removed", "success");
            loadStudents();
        } else {
            Swal.fire("Error", "Failed to delete", "error");
        }
    } catch (err) {
        Swal.fire("Error", "Network error", "error");
    }
}

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'");
}
