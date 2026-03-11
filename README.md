# EDA-web-app

A simple Flask-based web application that performs Automatic Exploratory Data Analysis (EDA) on CSV datasets.
Users can upload a dataset and automatically explore its structure, statistics, missing values, and visualizations without writing code.

This project demonstrates how Python, Flask, Pandas, and data visualization libraries can be used to build an interactive data analysis tool.

Features
* Upload CSV datasets
* Dataset preview (first 5 and last 5 rows)
* Dataset shape (rows and columns)
* Data type report for all columns
* Missing value analysis
* Option to remove rows with missing values
* Column-wise analysis
* Automatic statistical summary

Visualizations:
* Histogram
* Boxplot
* Bar chart for categorical data
* Correlation heatmap for numeric features

Technologies Used
Backend - Flask, Pandas, NumPy, Matplotlib, Seaborn

Frontend - HTML, CSS, JavaScript

'''Project Structure
Automatic-EDA-Web-App
│
├── app.py
│
├── templates
│   └── index.html
│
├── static
│   ├── style.css
│   ├── script.js
│   └── plots
│
├── temp
│
└── README.md'''

Installation
* Clone the repository
git clone https://github.com/your-username/automatic-eda-web-app.git
cd automatic-eda-web-app

Install the required dependencies
pip install flask pandas numpy matplotlib seaborn
Running the Application

Run the Flask server:
python app.py

Open your browser and go to:
http://127.0.0.1:5000

How to Use
* Upload a CSV dataset.
* View the dataset preview and data reports.
* Check data types and missing values.
* Use Drop Missing Values to clean the data if needed.
* Select a column to perform column analysis.
* View statistics, insights, and visualizations.
* Generate a correlation heatmap for numeric features.

Purpose of the Project
* The goal of this project is to practice:
* Exploratory Data Analysis (EDA)
* Data visualization
* Flask web development
* Connecting backend data processing with frontend UI
