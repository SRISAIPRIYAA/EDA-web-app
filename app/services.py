import calendar

def get_details(l):
    n_h, n_m = 0, 0
    o_h, o_m = 0, 0

    for day, hour in l:
        h, m = str(hour).split('.')
        h = int(h)
        m = int(m) * 10   # convert .3 → 30 minutes

        if day == "Sunday":
            o_h += h
            o_m += m
        else:
            if h < 8:
                n_h += h
                n_m += m
            else:
                n_h += 8
                o_h += h - 8
                o_m += m

        # normalize normal minutes
        if n_m >= 60:
            n_h += n_m // 60
            n_m = n_m % 60

        # normalize overtime minutes
        if o_m >= 60:
            o_h += o_m // 60
            o_m = o_m % 60

    normal_hours = n_h + n_m / 60
    ot_hours = o_h + o_m / 60

    return (
        round(normal_hours, 2),
        round(ot_hours, 2),
        round(normal_hours + ot_hours, 2)
    )

def get_hours(cursor,id,month,year):
    query="select dayname(date) as day,hours from attendance where employee_id=(%s) and year(date)=(%s) and month(date)=(%s);"
    cursor.execute(query,(id,str(year),str(month)))
    a=cursor.fetchall()
    return a

def count_sundays(year, month):
    month_matrix = calendar.monthcalendar(year, month)
    count = 0

    for week in month_matrix:
        sunday = week[calendar.SUNDAY]
        if sunday != 0:
            count += 1

    return count

def working_days(month, year):
    cal = calendar.monthcalendar(year, month)
    count = 0
    for week in cal:
        for day in week[:6]:
            if day != 0:
                count += 1
    return count

from datetime import datetime

def days_except_sunday(date_list):
    working_days = 0

    for item in date_list:
        date_obj = item[0]   # extract datetime.date object
        
        # weekday(): Monday=0 ... Sunday=6
        if date_obj.weekday() != 6:
            working_days += 1

    return working_days

def check(s):
    a=s.split('.')
    if len(a)==2 and (int(a[1])>59 or a[1] in ['6','7','8','9']):
        return 0
    return 1

def calculate_price(time_input, wage_per_hour):
    """
    time_input: HH.MM format (e.g., "10.56")
    wage_per_hour: numeric wage

    Returns total salary rounded to 2 decimals
    """

    time_str = str(time_input)

    # Split hours and minutes
    if "." in time_str:
        hours_part, minutes_part = time_str.split(".")
    else:
        hours_part = time_str
        minutes_part = "0"

    hours = int(hours_part)
    minutes = int(minutes_part)

    # Validate minutes
    if minutes < 0 or minutes >= 60:
        raise ValueError("Minutes must be between 0 and 59")

    # Convert to decimal hours
    decimal_hours = hours + (minutes / 60)

    # Calculate salary
    salary = decimal_hours * float(wage_per_hour)

    return round(salary, 2)