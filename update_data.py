import yfinance as yf
import pandas as pd
import json
from datetime import datetime
import os
import sys

def fetch_nifty_data():
    try:
        print("Starting Nifty data fetch process...")
        
        # Ensure the public directory exists
        print("Creating public directory if it doesn't exist...")
        os.makedirs('public', exist_ok=True)
        
        # Define the path for the JSON file
        json_path = 'public/nifty_returns.json'
        print(f"JSON file will be saved to: {json_path}")
        
        # Load existing data if it exists
        existing_data = {}
        if os.path.exists(json_path):
            print("Found existing data file, loading it...")
            with open(json_path, 'r') as f:
                existing_data = json.load(f)
            print("Existing data loaded successfully")
        else:
            print("No existing data file found, starting fresh")
        
        # Download Nifty data
        print("Downloading Nifty data from Yahoo Finance...")
        nifty = yf.download('^NSEI', period='6mo', progress=False)
        print(f"Downloaded {len(nifty)} rows of data")
        
        if len(nifty) == 0:
            raise Exception("No data downloaded from Yahoo Finance")
        
        # Calculate monthly returns
        print("Calculating monthly returns...")
        monthly_data = nifty['Close'].resample('ME').last()
        monthly_returns = monthly_data.pct_change() * 100
        
        # Convert the Series to a DataFrame with a DateTimeIndex
        monthly_returns_df = monthly_returns.to_frame('returns')
        
        # Update the existing data with new values
        print("Updating data dictionary...")
        update_count = 0
        
        for index, row in monthly_returns_df.iterrows():
            value = row['returns']
            if not pd.isna(value):  # Check for NaN values
                year = str(index.year)
                month = index.strftime('%b')
                
                if year not in existing_data:
                    existing_data[year] = {}
                
                existing_data[year][month] = round(float(value), 2)
                update_count += 1
        
        print(f"Updated {update_count} months of data")
        
        # Save updated data
        print(f"Saving updated data to {json_path}...")
        with open(json_path, 'w') as f:
            json.dump(existing_data, f, indent=4)
            
        print("Data updated successfully")
        return True
        
    except Exception as e:
        print(f"Error updating data: {str(e)}", file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        return False

if __name__ == "__main__":
    success = fetch_nifty_data()
    sys.exit(0 if success else 1)
