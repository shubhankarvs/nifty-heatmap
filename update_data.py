import yfinance as yf
import pandas as pd
import json
from datetime import datetime
import os

def fetch_nifty_data():
    try:
        # Ensure the public directory exists
        os.makedirs('public', exist_ok=True)
        
        # Define the path for the JSON file
        json_path = 'public/nifty_returns.json'
        
        # Load existing data if it exists
        existing_data = {}
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                existing_data = json.load(f)
        
        # Download Nifty data (last 6 months to ensure overlap)
        nifty = yf.download('^NSEI', period='6mo')
        
        # Calculate monthly returns
        monthly_data = nifty['Close'].resample('M').last()
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
        with open(json_path, 'w') as f:
            json.dump(existing_data, f, indent=4)
            
        print("Data updated successfully")
        
    except Exception as e:
        print(f"Error updating data: {str(e)}")
        raise e

if __name__ == "__main__":
    fetch_nifty_data()
