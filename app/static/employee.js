/* ===== Load Employees ===== */

async function loadEmployees() {

    const response = await fetch("/employees");
    const data = await response.json();

    const tbody = document.querySelector("#employeeTable tbody");
    tbody.innerHTML = "";

    if (data.Error) {
        tbody.innerHTML = `<tr><td colspan="3">${data.Error}</td></tr>`;
        return;
    }

    data.forEach(emp => {

        const row = `
            <tr>
                <td>${emp.name}</td>
                <td>${emp.salary}</td>
                <td>
                    <button class="action-btn update"
                        onclick="updateEmployee('${emp.name}')">
                        Update
                    </button>

                    <button class="action-btn delete"
                        onclick="deleteEmployee('${emp.name}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;

        tbody.innerHTML += row;
    });
}

/* ===== Add Employee ===== */

async function addEmployee() {

    const name = document.getElementById("name").value;
    const salary = document.getElementById("salary").value;

    const response = await fetch("/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, salary })
    });

    const result = await response.json();
    document.getElementById("message").innerText =
        result.Success || result.Error;

    loadEmployees();
}

/* ===== Update Employee ===== */

async function updateEmployee(name) {

    const newSalary = prompt("Enter new salary:");

    if (!newSalary) return;

    await fetch("/employee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, salary: newSalary })
    });

    loadEmployees();
}

/* ===== Delete Employee ===== */

async function deleteEmployee(name) {

    if (!confirm("Delete this employee?")) return;

    await fetch("/employee", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    loadEmployees();
}

loadEmployees();

function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
}

function closeMenu() {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}
