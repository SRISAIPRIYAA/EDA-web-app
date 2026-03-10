from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'temp'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create temp folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/plots', exist_ok=True)

# Store uploaded dataframe in memory
stored_df = {}

def get_plot_base64(fig):
    """Convert matplotlib figure to base64 string"""
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', bbox_inches='tight', dpi=80)
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close(fig)
    return image_base64

def get_column_insights(df, column):
    """Generate automated insights for a column"""
    insights = []
    
    missing_count = df[column].isna().sum()
    missing_pct = (missing_count / len(df)) * 100
    
    insights.append(f"Missing values: {missing_count} ({missing_pct:.2f}%)")
    
    if df[column].dtype in ['object', 'category']:
        unique_count = df[column].nunique()
        insights.append(f"Unique categories: {unique_count}")
    else:
        unique_count = df[column].nunique()
        insights.append(f"Unique values: {unique_count}")
        
        # Check for skewness
        skewness = df[column].skew()
        if pd.notna(skewness):
            if abs(skewness) > 1:
                insights.append(f"Highly skewed (skewness: {skewness:.2f})")
            elif abs(skewness) > 0.5:
                insights.append(f"Moderately skewed (skewness: {skewness:.2f})")
    
    return insights

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle CSV file upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Please upload a CSV file'}), 400
    
    try:
        df = pd.read_csv(file)
        stored_df['current'] = df
        
        # Prepare response data
        preview_head = df.head(5).to_html(classes='preview-table')
        preview_tail = df.tail(5).to_html(classes='preview-table')
        
        # Data types
        dtypes = df.dtypes.astype(str).to_dict()
        
        # Missing values report
        missing_values = {
            col: {
                'count': int(df[col].isna().sum()),
                'percentage': float((df[col].isna().sum() / len(df)) * 100)
            }
            for col in df.columns
        }
        
        columns = list(df.columns)
        
        return jsonify({
            'success': True,
            'columns': columns,
            'shape': list(df.shape),
            'preview_head': preview_head,
            'preview_tail': preview_tail,
            'dtypes': dtypes,
            'missing_values': missing_values
        })
    
    except Exception as e:
        return jsonify({'error': f'Error reading file: {str(e)}'}), 400

@app.route('/analyze-column', methods=['POST'])
def analyze_column():
    """Analyze selected column and generate statistics"""
    if 'current' not in stored_df:
        return jsonify({'error': 'No data loaded'}), 400
    
    data = request.json
    column = data.get('column')
    df = stored_df['current']
    
    if column not in df.columns:
        return jsonify({'error': 'Column not found'}), 400
    
    col_data = df[column]
    result = {
        'column': column,
        'dtype': str(col_data.dtype),
        'insights': get_column_insights(df, column),
        'plots': {}
    }
    
    # Statistics for numeric columns
    if pd.api.types.is_numeric_dtype(col_data):
        result['stats'] = {
            'sum': float(col_data.sum()) if not col_data.isna().all() else None,
            'min': float(col_data.min()) if not col_data.isna().all() else None,
            'max': float(col_data.max()) if not col_data.isna().all() else None,
            'mean': float(col_data.mean()) if not col_data.isna().all() else None,
            'median': float(col_data.median()) if not col_data.isna().all() else None,
            'mode': float(col_data.mode()[0]) if not col_data.mode().empty else None,
            'unique_count': int(col_data.nunique()),
            'total_entries': int(len(col_data))
        }
        
        # Histogram
        fig, ax = plt.subplots(figsize=(8, 5))
        col_data.dropna().hist(bins=30, ax=ax, edgecolor='black', color='skyblue')
        ax.set_title(f'Histogram of {column}')
        ax.set_xlabel(column)
        ax.set_ylabel('Frequency')
        result['plots']['histogram'] = get_plot_base64(fig)
        
        # Boxplot
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.boxplot(col_data.dropna())
        ax.set_title(f'Boxplot of {column}')
        ax.set_ylabel(column)
        result['plots']['boxplot'] = get_plot_base64(fig)
    
    # Statistics for categorical columns
    else:
        result['stats'] = {
            'unique_count': int(col_data.nunique()),
            'total_entries': int(len(col_data)),
            'mode': str(col_data.mode()[0]) if not col_data.mode().empty else None
        }
        
        # Bar chart
        fig, ax = plt.subplots(figsize=(10, 6))
        value_counts = col_data.value_counts().head(20)
        value_counts.plot(kind='bar', ax=ax, color='coral', edgecolor='black')
        ax.set_title(f'Value Counts for {column}')
        ax.set_xlabel(column)
        ax.set_ylabel('Count')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        result['plots']['bar_chart'] = get_plot_base64(fig)
    
    return jsonify(result)

@app.route('/drop-missing', methods=['POST'])
def drop_missing():
    """Drop rows with missing values"""
    if 'current' not in stored_df:
        return jsonify({'error': 'No data loaded'}), 400
    
    df = stored_df['current']
    original_rows = len(df)
    df_cleaned = df.dropna()
    stored_df['current'] = df_cleaned
    
    rows_removed = original_rows - len(df_cleaned)
    
    # Update missing values report
    missing_values = {
        col: {
            'count': int(df_cleaned[col].isna().sum()),
            'percentage': float((df_cleaned[col].isna().sum() / len(df_cleaned)) * 100) if len(df_cleaned) > 0 else 0
        }
        for col in df_cleaned.columns
    }
    
    preview_head = df_cleaned.head(5).to_html(classes='preview-table')
    preview_tail = df_cleaned.tail(5).to_html(classes='preview-table')
    
    return jsonify({
        'success': True,
        'message': f'Rows with missing values have been removed. ({rows_removed} rows removed)',
        'rows_removed': rows_removed,
        'remaining_rows': len(df_cleaned),
        'preview_head': preview_head,
        'preview_tail': preview_tail,
        'missing_values': missing_values
    })

@app.route('/correlation-heatmap', methods=['POST'])
def correlation_heatmap():
    """Generate correlation heatmap for numeric columns"""
    if 'current' not in stored_df:
        return jsonify({'error': 'No data loaded'}), 400
    
    df = stored_df['current']
    numeric_df = df.select_dtypes(include=[np.number])
    
    if len(numeric_df.columns) < 2:
        return jsonify({'error': 'At least 2 numeric columns needed for correlation'}), 400
    
    fig, ax = plt.subplots(figsize=(10, 8))
    correlation_matrix = numeric_df.corr()
    sns.heatmap(correlation_matrix, annot=True, fmt='.2f', cmap='coolwarm', 
                center=0, ax=ax, cbar_kws={'label': 'Correlation'})
    ax.set_title('Correlation Heatmap')
    
    return jsonify({
        'plot': get_plot_base64(fig)
    })

if __name__ == '__main__':
    app.run(debug=True)
