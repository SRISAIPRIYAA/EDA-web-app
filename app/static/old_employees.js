const employeeSelect = document.getElementById("employeeSelect");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const calendar = document.getElementById("calendar");

const months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];


/* LOAD OLD EMPLOYEES */

async function loadEmployees(){

const res = await fetch("/old_employees");
const data = await res.json();

data.forEach(emp=>{
const opt=document.createElement("option");
opt.value=emp.name;
opt.textContent=emp.name;
employeeSelect.appendChild(opt);
});

}


/* MONTH SELECT */

months.forEach((m,i)=>{
const opt=document.createElement("option");
opt.value=String(i+1).padStart(2,"0");
opt.textContent=m;
monthSelect.appendChild(opt);
});


/* YEAR SELECT */

const currentYear=new Date().getFullYear();

for(let y=currentYear-5;y<=currentYear+2;y++){

const opt=document.createElement("option");
opt.value=y;
opt.textContent=y;
yearSelect.appendChild(opt);

}

monthSelect.value=String(new Date().getMonth()+1).padStart(2,"0");
yearSelect.value=currentYear;


/* LOAD EVERYTHING */

async function loadEmployeeData(){

const name=employeeSelect.value;
const month=monthSelect.value;
const year=yearSelect.value;

if(!name){
alert("Select employee");
return;
}

document.getElementById("resultSection").classList.remove("hidden");

loadCalendar(name,month,year);
loadPayslip(name,month,year);

}


/* CALENDAR */

async function loadCalendar(name,month,year){

calendar.innerHTML="";

const res=await fetch("/old_employees_attendance",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,month,year})
});

const data=await res.json();

const workedDays={};

data.forEach(row=>{
const day=new Date(row[0]).getDate();
workedDays[day]=row[1];
});

const daysInMonth=new Date(year,month,0).getDate();

for(let d=1;d<=daysInMonth;d++){

const div=document.createElement("div");
div.classList.add("day");
div.textContent=d;

if(workedDays[d]!=undefined){

div.classList.add("marked");

const tip=document.createElement("div");
tip.classList.add("tooltip");
tip.innerText=workedDays[d]+" hrs";

div.appendChild(tip);

}

calendar.appendChild(div);

}

}


/* PAYSLIP */

async function loadPayslip(name,month,year){

const res=await fetch("/old_employees_payslip",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,month,year})
});

const data=await res.json();

document.getElementById("empName").innerText=name;
document.getElementById("empMonth").innerText=months[parseInt(month)-1];
document.getElementById("empYear").innerText=year;

document.getElementById("generatedTime").innerText=
"Generated on: "+new Date().toLocaleString();

document.getElementById("totalDays").innerText=data.total_days;
document.getElementById("daysWorked").innerText=data.days_worked;
document.getElementById("otHours").innerText=data.over_time;
document.getElementById("otWage").innerText=data.over_time_wage;
document.getElementById("twelveHourCount").innerText=data.twelve_hours_count;
document.getElementById("twelveHourBonus").innerText=data.twelve_hours_bonus;
document.getElementById("baseSalary").innerText=data.base_salary;
document.getElementById("attendanceBonus").innerText=data.attendance_bonus;
document.getElementById("allowance").innerText=data.allowance;
document.getElementById("advance").innerText=data.advance;
document.getElementById("totalSalary").innerText=data.total_salary;

}


/* DOWNLOAD PDF */

async function downloadPayslip(){

const original=document.getElementById("payslipPreview");

const canvas=await html2canvas(original,{scale:2});

const imgData=canvas.toDataURL("image/png");

const {jsPDF}=window.jspdf;

const pdf=new jsPDF("p","mm","a4");

const width=pdf.internal.pageSize.getWidth()-40;
const height=(canvas.height*width)/canvas.width;

pdf.addImage(imgData,"PNG",20,20,width,height);

const name=document.getElementById("empName").innerText;

pdf.save(`Payslip_${name}.pdf`);

}


/* MENU */

function toggleMenu(){

document.getElementById("sidebar").classList.toggle("active");
document.getElementById("overlay").classList.toggle("active");

}

function closeMenu(){

document.getElementById("sidebar").classList.remove("active");
document.getElementById("overlay").classList.remove("active");

}

loadEmployees();