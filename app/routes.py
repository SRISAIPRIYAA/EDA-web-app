from flask import Flask, Blueprint, jsonify, request
from .db import connect_to_db, find_id, find_workind_days
from collections import defaultdict
from datetime import date
from .services import get_hours, get_details, count_sundays, working_days, days_except_sunday, check, calculate_price

api=Blueprint("api",__name__)
from flask import render_template

@api.route("/")
def home():
    return render_template("index.html")

@api.route("/employee_page")
def employee_page():
    return render_template("employee.html")

@api.route("/attendance_page")
def attendance_page():
    return render_template("attendance.html")

@api.route("/payslip_page")
def payslip_page():
    return render_template("payslip.html")

@api.route("/old_employees_page")
def old_employees_page():
    return render_template("old_employees.html")

@api.route("/employee",methods=["POST"])
def hi():
    data=request.json
    ans={"Success":"Created"}
    name=data.get("name")
    salary=data.get("salary")
    if not name:
        return jsonify({"Error":"Add name"})
    if not salary:
        return jsonify({"Error":"Add salary"})
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        query="select id from employees where name=(%s)"
        cursor.execute(query,(name,))
        a=cursor.fetchone()
        if a:
            query="Update employees set is_active=True, salary=(%s) where id=(%s)"
            cursor.execute(query,(salary,a['id']))
            conn.commit()
        else:
            query="insert into employees (name,salary) values (%s,%s);"
            cursor.execute(query,(name,salary))
            conn.commit()
    except:
        ans={"Error":"SQLError"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)

@api.route("/employee",methods=["PUT"])
def hii():
    data=request.json
    ans={"Success":"Updated"}
    data=request.json
    name=data.get("name")
    salary=data.get("salary")
    if not name or not salary:
        return jsonify({"Error":"Send all the required fields"})
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        query="update employees set salary=(%s) where name=(%s)"
        cursor.execute(query,(salary,name))
        conn.commit()
    except:
        ans={"Error":"SQL error"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)
    
@api.route("/employee",methods=["DELETE"])
def hiii():
    data=request.json
    name=data.get('name')
    ans={'Success':'Deleted'}
    if not name:
        return jsonify({'Error':'Name not given'})
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        id=find_id(cursor,name)
        query="UPDATE employees SET is_active = FALSE WHERE name =(%s)"
        cursor.execute(query,(name,))
        conn.commit()
    except:
        ans={'Error':'SQL error'}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)

@api.route("/attendance",methods=["POST"])
def hiiii():
    data=request.json
    name=data.get('name')
    hours=float(data.get('hours'))+0.0
    date=data.get('date')
    day=data.get('day')
    ans={"Success":"Created"}
    if not name or not hours or not date:
        return jsonify({'Error':'Send all fields'})
    if not check(str(hours)):
        return{'Error':'Min can not be 60 or more'}
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        id=find_id(cursor,name)
        query="insert into attendance (employee_id,date,hours) values (%s,%s,%s)"
        cursor.execute(query,(id,date,hours))
        conn.commit()
    except Exception as e:
        print(e)
        ans={"Error":"SQL Error"}
    finally:
        cursor.close()
        conn.close()
    return jsonify(ans)

@api.route('/attendance',methods=["PUT"])
def hiiiii():
    data=request.json
    date=data.get("date")
    name=data.get("name")
    hours=float(data.get("hours"))+0.0
    ans={"Success":"Updated"}
    if not check(str(hours)):
        return{'Error':'Min can not be 60 or more'}
    if not date or not name:
        return jsonify({"Error":"Missing Fields"}), 400
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        cu=conn.cursor()
        id=find_id(cu,name)
        cu.close()
        query="update attendance set hours=(%s) where employee_id=(%s) and date=(%s)"
        cursor.execute(query,(hours,id,date))
        conn.commit()
    except:
        ans={"Error":"SQL Error"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)
    
@api.route("/attendance",methods=['DELETE'])
def hiiiiiiiiiiii():
    data=request.json
    date=data.get('date')
    name=data.get('name')
    ans={"Success":"Delete"}
    if not date or not name:
        return jsonify({"Error":"Missing fields"})
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        id=find_id(cursor,name)
        query="delete from attendance where date=(%s) and employee_id=(%s);"
        cursor.execute(query,(date,id))
        conn.commit()
    except:
        ans={"Error":"SQLError"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)


@api.route('/attendance_month',methods=['POST'])
def hiiiiiiiiii():
    data=request.json
    month=data.get("month")
    year=data.get("year")
    name=data.get("name")
    ans={}
    if not month or not year:
        return jsonify({"Error":"Missing fields"})
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        cu=conn.cursor()
        id=find_id(cu,name)
        cu.close()
        query="select * from attendance where employee_id=(%s) and (%s)=month(date) and (%s)=year(date)"
        cursor.execute(query,(id,month,year))
        ans=cursor.fetchall()
    except:
        ans={"Error":"SQL Error"}
    finally:
        conn.close()
        cursor.close()
        return jsonify(ans)


@api.route('/employees_record',methods=['POST'])
def hiiiiii():
    data=request.json
    month=data.get('month')
    year=data.get('year')
    if not month or not year:
        return jsonify({"Error":"Missing fields"})
    d={}
    ans={}
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        query="select id,name from employees where is_active=True"
        cursor.execute(query)
        l=cursor.fetchall()
        d_id={}
        for id,name in l:
            d[name]=get_hours(cursor,id,month,year)
            d_id[name]=id
        print(d)
        for name in d:
            ans[name]=list(get_details(d[name]))
            ans[name].append(find_workind_days(cursor,d_id[name],year,month))
            
    except:
        ans={"Error":"Sql Error"}
    finally:
        conn.close()
        cursor.close()
        return ans
        
@api.route('/employees',methods=['GET'])
def vanakam():
    ans={}
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        query="select * from employees where is_active=True"
        cursor.execute(query)
        ans=cursor.fetchall()
    except:
        ans={"Error":"SQL Error"}
    finally:
        conn.close()
        cursor.close()
        return jsonify(ans)
    
@api.route("/payslip",methods=['POST'])
def vanakamm():
    from datetime import datetime
    data=request.json
    name=data.get('name')
    month=data.get('month')
    year=data.get('year')
    date=data.get('date')
    allowance=data.get('allowance')
    advance=data.get('advance')
    sun=data.get('sundays')
    today = datetime.today()
    current_month = today.month
    current_year = today.year

    if int(year) > current_year:
        return {"Error": "Cannot generate payslip for future year"}

    if int(year) == current_year and int(month) >= current_month:
        return {"Error": "Cannot generate payslip for current or future month"}
    if not name or not month or not year:
        return jsonify({"Error":"Missing fields"})
    ans={}
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        id=find_id(cursor,name)
        cur=conn.cursor(dictionary=True)
        query="select * from payslips where employee_id=(%s) and month=(%s) and year=(%s)"
        cur.execute(query,(id,month,year))
        ans=cur.fetchone()
        cur.close()
        if not ans:
            l=get_hours(cursor,id,month,year)
            query="select salary from employees where name=(%s) and is_active=True"
            cursor.execute(query,(name,))
            price=cursor.fetchone() #base salary
            price=price[0]
            id=find_id(cursor,name) #id
            query="select date from attendance where employee_id=(%s) and month(date)=(%s) and year(date)=(%s)"
            cursor.execute(query,(id,month,year))
            ll=cursor.fetchall()
            days=days_except_sunday(list(ll)) #how many days i worked
            n_days=working_days(int(month),int(year)) #no of working days except sunday
            query="select count(*) from attendance where employee_id=(%s) and hours>=12 and year(date)=(%s) and month(date)=(%s) group by year(date), month(date);"
            cursor.execute(query,(id,year,month))
            t_hours_count=cursor.fetchone()
            if not t_hours_count:
                t_hours_count=0
            else:
                t_hours_count=int(t_hours_count[0])
            s,ot,t=get_details(l)
            attendance_bonus=0 #attendance bonus
            if days==n_days:
                attendance_bonus=750
            sundays=count_sundays(int(year),int(month))
            twelve_hours_reward=t_hours_count*70 #reward
            tot=sundays+n_days
            per_hour=float(price)/(tot*8) #salary per hour
            print(ot,per_hour,tot,sundays,n_days)
            ot_price=calculate_price(ot,per_hour)
            base_salary=s*per_hour
            total=base_salary+attendance_bonus+twelve_hours_reward+allowance+ot_price+(per_hour*sun*8)-advance
            query="insert into payslips (employee_id, month, year, total_salary, over_time_wage, total_days, over_time, days_worked, no_of_working_days, attendance_bonus,allowance, advance, twelve_hours_count, twelve_hours_bonus, base_salary) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);"
            cursor.execute(query,(id,month,year,total,ot_price,sundays+n_days,ot,days,n_days,attendance_bonus,allowance,advance,t_hours_count,t_hours_count*70,price)) 
            conn.commit()
            ans={"total_salary":total,
                "over_time_wage":ot_price,
                "total_days": sundays+n_days,
                "over_time":ot,
                "days_worked":days,
                "no_of_working_days":n_days,
                "attendance_bonus":attendance_bonus,
                "allowance":allowance,
                "advance":advance,
                "twelve_hours_count":t_hours_count,
                "twelve_hours_bonus": t_hours_count*70,
                "base_salary":price}

        
    except Exception as e:
        print(e)
        ans={"Error":"SQL Error"}
    finally:
        cursor.close()
        conn.close()
        return(jsonify(ans))

@api.route("/payslip",methods=['PUT'])
def van():
    from datetime import datetime
    data=request.json
    name=data.get('name')
    month=data.get('month')
    year=data.get('year')
    allowance=data.get('allowance')
    advance=data.get('advance')
    sun=data.get('sundays')
    today = datetime.today()
    current_month = today.month
    current_year = today.year
    if int(year) > current_year:
        return {"Error": "Cannot generate payslip for future year"}

    if int(year) == current_year and int(month) >= current_month:
        return {"Error": "Cannot generate payslip for current or future month"}
    if not name or not month or not year:
        return jsonify({"Error":"Missing fields"})
    ans={}
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        id=find_id(cursor,name)
        if not sun:
            sun=0
        if not advance:
            advance=0
        if not allowance:
            allowance=0
        
        query="update payslips set allowance=(%s),advance=(%s) where employee_id=(%s)"
        cursor.execute(query,(allowance,advance,id))
        conn.commit()
        l=get_hours(cursor,id,month,year)
        query="select base_salary from payslips where employee_id=(%s)"
        cursor.execute(query,(id,))
        price=cursor.fetchone()
        price=price[0]
        query="select date from attendance where employee_id=(%s) and month(date)=(%s) and year(date)=(%s)"
        cursor.execute(query,(id,month,year))
        ll=cursor.fetchall()
        days=days_except_sunday(list(ll)) #how many days i worked
        n_days=working_days(int(month),int(year)) #no of working days except sunday
        query="select count(*) from attendance where employee_id=(%s) and hours>=12 and year(date)=(%s) and month(date)=(%s) group by year(date), month(date);"
        cursor.execute(query,(id,year,month))
        t_hours_count=cursor.fetchone()
        if not t_hours_count:
            t_hours_count=0
        else:
            t_hours_count=int(t_hours_count[0])
        s,ot,t=get_details(l)
        attendance_bonus=0 #attendance bonus
        if days==n_days:
            attendance_bonus=750
        sundays=count_sundays(int(year),int(month))
        twelve_hours_reward=t_hours_count*70 #reward
        tot=sundays+n_days
        per_hour=float(price)/(tot*8) #salary per hour
        ot_price=calculate_price(ot,per_hour)
        base_salary=s*per_hour
        total=base_salary+attendance_bonus+twelve_hours_reward+allowance+ot_price+(per_hour*sun*8)-advance
        ans={"total_salary":total,
                "over_time_wage":ot_price,
                "total_days": sundays+n_days,
                "over_time":ot,
                "days_worked":days,
                "no_of_working_days":n_days,
                "attendance_bonus":attendance_bonus,
                "allowance":allowance,
                "advance":advance,
                "twelve_hours_count":t_hours_count,
                "twelve_hours_bonus": t_hours_count*70,
                "base_salary":price}

        
    except Exception as e:
        print(e)
        ans={"Error":"SQL Error"}
    finally:
        cursor.close()
        conn.close()
        return(jsonify(ans))
    
@api.route("/old_employees",methods=["GET"])
def vann():
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        query="select name from employees where is_active=False;"
        cursor.execute(query)
        ans=cursor.fetchall()
    except Exception as e:
        print(e)
        ans={"Error":"SQL error"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)
    
@api.route("/old_employees_attendance",methods=["POST"])
def vannn():
    data=request.json
    name=data.get("name")
    month=data.get("month")
    year=data.get("year")
    if not name or not month or not year:
        return jsonify({"Error":"Missing fields"})
    try:
        conn=connect_to_db()
        cursor=conn.cursor()
        id=find_id(cursor,name)
        query="select date, hours from attendance where employee_id=(%s) and month(date)=(%s) and year(date)=(%s);"
        cursor.execute(query,(id,month,year))
        ans=cursor.fetchall()
    except Exception as e:
        print(e)
        ans={"Error":"SQL Error"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)
    
@api.route("/old_employees_payslip",methods=["POST"])
def vannnn():
    data=request.json
    name=data.get("name")
    month=data.get("month")
    year=data.get("year")
    if not name or not month or not year:
        return jsonify({"Error":"Missing fields"})
    try:
        conn=connect_to_db()
        cursor=conn.cursor(dictionary=True)
        cu=conn.cursor()
        id=find_id(cu,name)
        cu.close()
        query="select * from payslips where employee_id=(%s);"
        cursor.execute(query,(id,))
        ans=cursor.fetchone()
        if not ans:
            ans={"Value":"No result found"}
    except Exception as e:
        print(e)
        ans={"Error":"SQL Error"}
    finally:
        cursor.close()
        conn.close()
        return jsonify(ans)