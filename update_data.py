import yfinance as yf
import pandas as pd
import json
import os
from datetime import datetime

def fetch_nifty_data():
    try:
        print("Starting Nifty data fetch process...")
        
        # Create public directory if it doesn't exist
        public_dir = 'public'
        print(f"Creating {public_dir} directory if it doesn't exist...")
        os.makedirs(public_dir, exist_ok=True)
        
        json_file_path = os.path.join(public_dir, 'nifty_returns.json')
        print(f"JSON file will be saved to: {json_file_path}")
        
        # Load existing data if available
        existing_data = {}
        try:
            with open(json_file_path, 'r') as f:
                existing_data = json.load(f)
                print("Loaded existing data successfully")
        except FileNotFoundError:
            print("No existing data file found, starting fresh")
        
        # Download Nifty data
        print("Downloading Nifty data from Yahoo Finance...")
        nifty = yf.download('^NSEI', period='max')
        print(f"Downloaded {len(nifty)} rows of data")
        
        # Calculate monthly returns
        print("Calculating monthly returns...")
        monthly_close = nifty['Close'].resample('ME').last()
        monthly_returns = monthly_close.pct_change() * 100
        
        # Convert Series to dictionary with year-month format
        returns_dict = {}
        
        for date, value in monthly_returns.items():
            # Skip NaN values using pandas.isna()
            if not pd.isna(value):
                year = str(date.year)
                month = date.strftime('%b')
                
                if year not in returns_dict:
                    returns_dict[year] = {}
                
                returns_dict[year][month] = round(float(value), 2)
        
        # Update existing data with new data
        for year in returns_dict:
            if year in existing_data:
                existing_data[year].update(returns_dict[year])
            else:
                existing_data[year] = returns_dict[year]
        
        # Save to JSON file
        print("Saving data to JSON file...")
        with open(json_file_path, 'w') as f:
            json.dump(existing_data, f, indent=4)
        
        print("Data has been successfully saved!")
        
        # Print some basic statistics
        all_returns = []
        for year_data in existing_data.values():
            all_returns.extend(year_data.values())
        
        if all_returns:
            print("\nData Statistics:")
            print(f"Total years: {len(existing_data)}")
            print(f"Latest year: {max(existing_data.keys())}")
            print(f"Maximum monthly return: {max(all_returns):.2f}%")
            print(f"Minimum monthly return: {min(all_returns):.2f}%")
            print(f"Average monthly return: {sum(all_returns)/len(all_returns):.2f}%")
        
    except Exception as e:
        print(f"Error updating data: {str(e)}")
        raise e

if __name__ == "__main__":
    fetch_nifty_data()
