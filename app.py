from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Home Route
@app.route('/')
def home():
    return render_template('home.html')

# About Me Route
@app.route('/about')
def about():
    return render_template('about.html')

# Projects Route
@app.route('/projects')
def projects():
    return render_template('projects.html')

# Python Code Execution Route
@app.route('/execute', methods=['POST'])
def execute():
    try:
        code = request.json.get('code', '')
        exec_globals = {}
        exec(code, exec_globals)
        return jsonify({"output": str(exec_globals.get("output", "Code executed successfully!"))})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)
