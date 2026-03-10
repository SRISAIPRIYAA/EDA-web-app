/* ================= ELEMENTS ================= */

const employeeSelect = document.getElementById("employeeSelect");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");

const actionSelect = document.getElementById("actionSelect");
const dateInput = document.getElementById("dateInput");
const hoursInput = document.getElementById("hoursInput");

const calendar = document.getElementById("calendar");
const calendarMonth = document.getElementById("calendarMonth");
const calendarYear = document.getElementById("calendarYear");


/* ================= PREVENT FUTURE DATE ================= */

const todayStr = new Date().toISOString().split("T")[0];
dateInput.max = todayStr;

dateInput.addEventListener("change", function () {

    const selected = this.value;
    const today = new Date().toISOString().split("T")[0];

    if (selected > today) {
        alert("Future dates are not allowed");
        this.value = "";
    }
});


/* ================= LOAD EMPLOYEES ================= */

async function loadEmployees() {

    try {

        const res = await fetch("/employees");
        const data = await res.json();

        data.forEach(emp => {

            const opt = document.createElement("option");
            opt.value = emp.name;
            opt.textContent = emp.name;

            employeeSelect.appendChild(opt);
        });

    } catch (err) {

        console.error("Error loading employees");
    }
}


/* ================= MONTH SETUP ================= */

const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

const currentYear = new Date().getFullYear();


/* ===== TOP SELECTORS ===== */

months.forEach((m, i) => {

    const opt = document.createElement("option");
    opt.value = String(i + 1).padStart(2, "0");
    opt.textContent = m;

    monthSelect.appendChild(opt);
});

for (let y = currentYear - 3; y <= currentYear + 2; y++) {

    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;

    yearSelect.appendChild(opt);
}

monthSelect.value = String(new Date().getMonth() + 1).padStart(2, "0");
yearSelect.value = currentYear;


/* ===== CALENDAR SELECTORS ===== */

months.forEach((m, i) => {

    const opt = document.createElement("option");
    opt.value = String(i + 1).padStart(2, "0");
    opt.textContent = m;

    calendarMonth.appendChild(opt);
});

for (let y = currentYear - 5; y <= currentYear + 2; y++) {

    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;

    calendarYear.appendChild(opt);
}

calendarMonth.value = monthSelect.value;
calendarYear.value = yearSelect.value;


/* ================= LOAD BUTTON ================= */

function initializeAttendance() {

    const name = employeeSelect.value;

    if (!name) {
        alert("Select employee");
        return;
    }

    document.getElementById("actionCard").classList.remove("hidden");
    document.getElementById("calendarSection").classList.remove("hidden");

    calendarMonth.value = monthSelect.value;
    calendarYear.value = yearSelect.value;

    loadCalendar();
}


/* ================= LOAD CALENDAR ================= */

async function loadCalendar() {

    const name = employeeSelect.value;
    const month = calendarMonth.value;
    const year = calendarYear.value;

    if (!name) return;

    calendar.innerHTML = "";

    try {

        const res = await fetch("/attendance_month", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, month, year })
        });

        const data = await res.json();

        const workedDays = {};

        data.forEach(row => {

            const dayNum = new Date(row.date).getDate();
            workedDays[dayNum] = parseFloat(row.hours);
        });

        const daysInMonth = new Date(year, month, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {

            const dayDiv = document.createElement("div");
            dayDiv.classList.add("day");
            dayDiv.textContent = d;

            const dateStr = `${year}-${month}-${String(d).padStart(2,"0")}`;

            /* CLICK DATE */

            dayDiv.addEventListener("click", () => {

                dateInput.value = dateStr;

                hoursInput.focus();
            });


            /* MARK ATTENDANCE */

            if (workedDays[d] !== undefined) {

                dayDiv.classList.add("marked");

                const tooltip = document.createElement("div");
                tooltip.classList.add("tooltip");
                tooltip.innerText = workedDays[d] + " hrs";

                dayDiv.appendChild(tooltip);
            }

            calendar.appendChild(dayDiv);
        }

    } catch (err) {

        console.error("Error loading calendar");
    }
}


/* ================= AUTO RELOAD ================= */

calendarMonth.addEventListener("change", loadCalendar);
calendarYear.addEventListener("change", loadCalendar);


/* ================= ACTION CHANGE ================= */

actionSelect.addEventListener("change", function () {

    const submitBtn = document.querySelector("#actionCard button");

    if (this.value === "delete") {

        hoursInput.disabled = true;
        hoursInput.value = "";
        submitBtn.style.background = "#ff5c5c";

    } else {

        hoursInput.disabled = false;
        submitBtn.style.background = "#c4b5fd";
    }
});


/* ================= SUBMIT ATTENDANCE ================= */

async function submitAttendance() {

    const action = actionSelect.value;
    const name = employeeSelect.value;
    const date = dateInput.value;
    const hours = hoursInput.value;

    if (!action || !name || !date) {

        alert("Please fill all required fields");
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (date > today) {

        alert("Future dates are not allowed");
        return;
    }

    try {

        let res;

        if (action === "delete") {

            const confirmDelete = confirm("Are you sure you want to delete this attendance?");

            if (!confirmDelete) return;

            res = await fetch("/attendance", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, date })
            });

        } else {

            if (!hours) {
                alert("Enter hours worked");
                return;
            }

            res = await fetch("/attendance", {
                method: action === "add" ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, date, hours })
            });
        }

        const data = await res.json();

        if (data.Error) {

            alert(data.Error);

        } else {

            dateInput.value = "";
            hoursInput.value = "";

            loadCalendar();
        }

    } catch (err) {

        console.error(err);
        alert("Something went wrong");
    }
}


/* ================= MENU ================= */

function toggleMenu() {

    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
}

function closeMenu() {

    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}


/* ================= INIT ================= */

loadEmployees();