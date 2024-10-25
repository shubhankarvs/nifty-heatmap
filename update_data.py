import yfinance as yf
import pandas as pd
import json
from datetime import datetime
import os

def fetch_nifty_data():
    try:
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Check if existing data file exists
        existing_data = {}
        if os.path.exists('data/nifty_returns.json'):
            with open('data/nifty_returns.json', 'r') as f:
                existing_data = json.load(f)
        
        # Download Nifty data
        print("Downloading NIFTY data...")
        nifty = yf.download('^NSEI', period='max')
        
        # Calculate monthly returns
        print("Calculating monthly returns...")
        monthly_data = nifty['Close'].resample('ME').last()
        monthly_returns = monthly_data.pct_change() * 100
        
        # Convert to year-month format
        returns_dict = existing_data.copy()
        
        # Convert the Series to a DataFrame and reset the index
        monthly_df = monthly_returns.reset_index()
        monthly_df.columns = ['Date', 'Returns']
        
        # Iterate through DataFrame rows
        for _, row in monthly_df.iterrows():
            date = row['Date']
            value = row['Returns']
            
            # Skip NaN values
            if pd.notna(value):
                year = str(date.year)
                month = date.strftime('%b')
                
                # Initialize year dictionary if it doesn't exist
                if year not in returns_dict:
                    returns_dict[year] = {}
                
                # Store the rounded value
                returns_dict[year][month] = round(float(value), 2)
        
        # Save to JSON file
        print("Saving data to JSON file...")
        with open('data/nifty_returns.json', 'w') as f:
            json.dump(returns_dict, f, indent=4)
        
        print("\nData has been successfully saved to data/nifty_returns.json")
        
        # Print some statistics
        years = sorted(returns_dict.keys())
        first_year = years[0]
        last_year = years[-1]
        
        print(f"\nData range: {first_year} to {last_year}")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise e

if __name__ == "__main__":
    fetch_nifty_data()
