const employeeSelect = document.getElementById("employeeSelect");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const allowanceInput = document.getElementById("allowanceInput");
const advanceInput = document.getElementById("advanceInput");
const sundaysInput = document.getElementById("sundaysInput");

/* ================= LOAD EMPLOYEES ================= */

async function loadEmployees() {

    const res = await fetch("/employees");
    const data = await res.json();

    data.forEach(emp => {

        const opt = document.createElement("option");
        opt.value = emp.name;
        opt.textContent = emp.name;
        employeeSelect.appendChild(opt);

    });

}

/* ================= MONTH + YEAR ================= */

const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

months.forEach((m,i)=>{

    const opt = document.createElement("option");
    opt.value = String(i+1).padStart(2,"0");
    opt.textContent = m;
    monthSelect.appendChild(opt);

});

const currentYear = new Date().getFullYear();

for(let y=currentYear-3;y<=currentYear+2;y++){

    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);

}

monthSelect.value = String(new Date().getMonth()+1).padStart(2,"0");
yearSelect.value = currentYear;


/* ================= DISPLAY PAYSLIP ================= */

function displayPayslip(data){

    const today = new Date();

    document.getElementById("payslipPreview").classList.remove("hidden");

    document.getElementById("empName").innerText = employeeSelect.value;
    document.getElementById("empMonth").innerText = months[parseInt(monthSelect.value)-1];
    document.getElementById("empYear").innerText = yearSelect.value;

    document.getElementById("generatedTime").innerText =
        "Generated on: " + today.toLocaleString();

    document.getElementById("totalDays").innerText = data.total_days;

    document.getElementById("daysWorkedCombined").innerText =
        data.days_worked + "/" + data.no_of_working_days;

    document.getElementById("otHours").innerText = data.over_time;

    document.getElementById("otWage").innerText =
        Number(data.over_time_wage).toFixed(2);

    document.getElementById("twelveHourCount").innerText =
        data.twelve_hours_count;

    document.getElementById("twelveHourBonus").innerText =
        Number(data.twelve_hours_bonus).toFixed(2);

    document.getElementById("baseSalary").innerText =
        Number(data.base_salary).toFixed(2);

    document.getElementById("attendanceBonus").innerText =
        Number(data.attendance_bonus).toFixed(2);

    document.getElementById("allowance").innerText =
        Number(data.allowance).toFixed(2);

    document.getElementById("advance").innerText =
        Number(data.advance).toFixed(2);

    document.getElementById("totalSalary").innerText =
        Number(data.total_salary).toFixed(2);

}


/* ================= LOAD PAYSLIP ================= */

async function loadPayslip(){

    const name = employeeSelect.value;
    const month = monthSelect.value;
    const year = yearSelect.value;

    const allowance = parseFloat(allowanceInput.value) || 0;
    const advance = parseFloat(advanceInput.value) || 0;
    const sundays = parseInt(sundaysInput.value) || 0;

    if(!name || !month || !year){

        alert("Select employee, month and year");
        return;

    }

    const today = new Date();
    const currentDate = String(today.getDate()).padStart(2,"0");

    try{

        const res = await fetch("/payslip",{

            method:"POST",
            headers:{"Content-Type":"application/json"},

            body:JSON.stringify({

                name,
                month,
                year,
                date:currentDate,
                allowance,
                advance,
                sundays

            })

        });

        const data = await res.json();

        if(data.Error){

            alert(data.Error);
            return;

        }

        displayPayslip(data);

    }

    catch(err){

        console.error(err);
        alert("Something went wrong");

    }

}


/* ================= UPDATE PAYSLIP ================= */

function updatePayslip(){

    document.getElementById("modalAllowance").value = "";
    document.getElementById("modalAdvance").value = "";
    document.getElementById("modalSundays").value = "";

    document.getElementById("updateModal").classList.remove("hidden");

}

function closeUpdateModal(){

    document.getElementById("updateModal").classList.add("hidden");

}

async function submitUpdate(){

    const name = employeeSelect.value;
    const month = monthSelect.value;
    const year = yearSelect.value;

    const allowance = parseFloat(document.getElementById("modalAllowance").value) || 0;
    const advance = parseFloat(document.getElementById("modalAdvance").value) || 0;
    const sundays = parseInt(document.getElementById("modalSundays").value) || 0;

    if(!name || !month || !year){

        alert("Select employee, month and year first");
        return;

    }

    try{

        const res = await fetch("/payslip",{

            method:"PUT",
            headers:{"Content-Type":"application/json"},

            body:JSON.stringify({
                name,
                month,
                year,
                allowance,
                advance,
                sundays
            })

        });

        const data = await res.json();

        if(data.Error){

            alert(data.Error);
            return;

        }

        displayPayslip(data);

        closeUpdateModal();

    }

    catch(err){

        console.error(err);
        alert("Update failed");

    }

}
/* ================= DOWNLOAD PDF ================= */

async function downloadPayslip(){

    const original = document.getElementById("payslipPreview");

    const clone = original.cloneNode(true);
    clone.style.background="#ffffff";
    clone.style.color="#000000";
    clone.style.position="absolute";
    clone.style.left="-9999px";
    clone.style.display="block";

    const actionSection = clone.querySelector(".payslip-actions");

    if(actionSection){

        actionSection.remove();

    }

    document.body.appendChild(clone);

    const canvas = await html2canvas(clone,{
        scale:2,
        backgroundColor:"#ffffff"
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL("image/png");

    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF("p","mm","a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let imgWidth = pageWidth-40;
    let imgHeight = (canvas.height*imgWidth)/canvas.width;

    if(imgHeight>pageHeight-40){

        imgHeight = pageHeight-40;
        imgWidth = (canvas.width*imgHeight)/canvas.height;

    }

    const x = (pageWidth-imgWidth)/2;
    const y = (pageHeight-imgHeight)/2;

    pdf.addImage(imgData,"PNG",x,y,imgWidth,imgHeight);

    const name = document.getElementById("empName").innerText;
    const now = new Date();

    pdf.save(`Payslip_${name}_${now.getTime()}.pdf`);

}


/* ================= MENU ================= */

function toggleMenu(){

    document.querySelector(".sidebar").classList.toggle("active");
    document.querySelector(".overlay").classList.toggle("active");

}

function closeMenu(){

    document.querySelector(".sidebar").classList.remove("active");
    document.querySelector(".overlay").classList.remove("active");

}

loadEmployees();