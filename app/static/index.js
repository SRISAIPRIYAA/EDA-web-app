const sidebar = document.getElementById("sidebar");

/* ===== Toggle Sidebar ===== */

function toggleMenu() {
    sidebar.classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
}

/* ===== Close when clicking outside ===== */

function closeMenu() {
    sidebar.classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}

/* ===== Month Handling ===== */

const today = new Date();
const month = today.getMonth() + 1;
const year = today.getFullYear();

const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

document.getElementById("monthName").innerText = monthNames[month - 1];
document.getElementById("monthDisplay").innerText =
    monthNames[month - 1] + " " + year;

/* ===== Fetch Data ===== */

async function loadData() {

    try {

        const response = await fetch("/employees_record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month, year })
        });

        const data = await response.json();
        const tbody = document.querySelector("#employeeTable tbody");
        tbody.innerHTML = "";

        if (data.Error) {
            tbody.innerHTML =
                `<tr><td colspan="5">${data.Error}</td></tr>`;
            return;
        }

        for (let name in data) {
            const values = data[name];

            const row = `
                <tr>
                    <td>${name}</td>
                    <td>${values[0]}</td>
                    <td>${values[1]}</td>
                    <td>${values[2]}</td>
                    <td>${values[3]}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        }

    } catch (err) {
        console.error(err);
    }
}

loadData();
