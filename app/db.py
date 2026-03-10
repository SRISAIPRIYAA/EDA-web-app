import mysql.connector

def connect_to_db():
    conn=mysql.connector.connect(
        host="localhost",
        user="root",
        password="lovetobake",
        database="sree_narayana"
    )
    return conn

def find_id(cursor,name):
    query="Select id from employees where name=(%s);"
    cursor.execute(query,(name,))
    id=cursor.fetchone()
    if not id:
        return None
    return id[0]

def find_workind_days(cursor,name,year,month):
    query="Select count(id) from attendance where employee_id=(%s) and year(date)=(%s) and month(date)=(%s) group by employee_id"
    cursor.execute(query,(name,year,month))
    a=cursor.fetchone()
    if not a:
        return 0
    return a[0]