from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
import cvxpy as cp
from sklearn.preprocessing import StandardScaler
import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define stock and ETF lists
STOCK_LIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'V', 'JNJ']
ETF_LIST = [
    'SPY', 'QQQ', 'DIA', 'XLK', 'XLF', 'XLE', 'XLV', 'XLY', 'IYR',
    'SMH', 'SOXX', 'ARKK', 'XBI', 'GDX', 'EEM', 'TLT', 'HYG', 'LQD', 'XLP', 'XLU',
]

def get_data(stock_ticker, etf_tickers, start_date, end_date):
    """Fetch stock and ETF data from Yahoo Finance."""
    tickers = [stock_ticker] + etf_tickers
    data = yf.download(tickers, start=start_date, end=end_date)['Adj Close']
    return data.dropna()

def lasso_regression_with_constraints(X, y, max_features):
    """Perform constrained Lasso regression."""
    n_samples, n_features = X.shape
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    y_scaled = y.values
    
    # Define optimization variables
    beta = cp.Variable(n_features)
    lambd = cp.Parameter(nonneg=True)
    
    # Lasso objective with constraints
    objective = cp.Minimize(
        (1 / n_samples) * cp.sum_squares(X_scaled @ beta - y_scaled) + 
        lambd * cp.norm1(beta)
    )
    constraints = [beta >= 0]  # Non-negativity constraint
    
    # Solve the optimization problem
    problem = cp.Problem(objective, constraints)
    lambda_value = 0.001
    max_lambda = 1000
    tol = 1e-4
    
    while lambda_value < max_lambda:
        lambd.value = lambda_value
        problem.solve(solver=cp.SCS)
        beta_value = beta.value
        selected = np.where(beta_value > tol)[0]
        if len(selected) <= max_features:
            break
        lambda_value *= 1.5
    
    # Get weights and filter small values
    weights = pd.Series(beta_value, index=X.columns)
    weights = weights[weights > tol]
    
    return weights

def calculate_metrics(actual_returns, portfolio_returns):
    """Calculate performance metrics."""
    # Correlation
    corr = np.corrcoef(actual_returns, portfolio_returns)[0,1]
    
    # Tracking Error
    tracking_error = np.std(actual_returns - portfolio_returns) * np.sqrt(252)
    
    # Cumulative Returns
    cumulative_actual = (1 + actual_returns).cumprod() - 1
    cumulative_portfolio = (1 + portfolio_returns).cumprod() - 1
    
    # Daily Returns for Chart
    daily_data = [{
        'date': date.strftime('%Y-%m-%d'),
        'stock': (1 + actual_returns.iloc[:i+1]).cumprod().iloc[-1] * 100,
        'portfolio': (1 + portfolio_returns.iloc[:i+1]).cumprod().iloc[-1] * 100
    } for i, date in enumerate(actual_returns.index)]
    
    return {
        'correlation': float(corr),
        'tracking_error': float(tracking_error),
        'final_return_stock': float(cumulative_actual.iloc[-1]),
        'final_return_portfolio': float(cumulative_portfolio.iloc[-1]),
        'daily_data': daily_data
    }

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    """Return list of available stocks."""
    return jsonify(STOCK_LIST)

@app.route('/api/analyze', methods=['GET'])
def analyze_stock():
    """Analyze stock and generate ETF portfolio."""
    stock = request.args.get('stock', 'AAPL')
    if stock not in STOCK_LIST:
        return jsonify({'error': 'Invalid stock symbol'}), 400
    
    # Calculate dates
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=365)
    
    try:
        # Get data
        data = get_data(stock, ETF_LIST, start_date, end_date)
        returns = data.pct_change().dropna()
        
        # Calculate correlations
        correlations = returns.corr()[stock].drop(stock)
        top_pos_corr = correlations.nlargest(10)
        top_neg_corr = correlations.nsmallest(10)
        selected_etfs = list(top_pos_corr.index) + list(top_neg_corr.index)
        
        # Prepare data for model
        X = returns[selected_etfs]
        y = returns[stock]
        
        # Fit model
        weights = lasso_regression_with_constraints(X, y, max_features=5)
        
        # Calculate portfolio returns
        portfolio_returns = X[weights.index] @ weights.values
        
        # Calculate metrics
        metrics = calculate_metrics(y, portfolio_returns)
        
        # Add ETF weights to response
        metrics['etf_weights'] = {k: float(v) for k, v in weights.items()}
        
        return jsonify(metrics)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
