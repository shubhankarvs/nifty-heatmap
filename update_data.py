import yfinance as yf
import pandas as pd
import json
import os
from datetime import datetime

def fetch_nifty_data():
    try:
        # Define the correct file path
        file_path = os.path.join('public', 'data', 'nifty_returns.json')
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Load existing data if available
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = {}
        
        # Download latest data (last 6 months to ensure overlap)
        nifty = yf.download('^NSEI', period='6mo')
        
        # Calculate monthly returns
        monthly_data = nifty['Close'].resample('ME').last()
        monthly_returns = monthly_data.pct_change() * 100
        
        # Update the existing data with new values
        for date, value in monthly_returns.items():
            if pd.notna(value):
                year = str(date.year)
                month = date.strftime('%b')
                
                if year not in existing_data:
                    existing_data[year] = {}
                
                existing_data[year][month] = round(float(value), 2)
        
        # Save updated data
        with open(file_path, 'w') as f:
            json.dump(existing_data, f, indent=4)
            
        print(f"Data updated successfully at {file_path}")
        
    except Exception as e:
        print(f"Error updating data: {str(e)}")
        raise e

if __name__ == "__main__":
    fetch_nifty_data()
