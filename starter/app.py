from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/new')
def new_game():
    # Keep the existing clues parameter for backward compatibility
    # and for the existing pytest test.
    clues_param = request.args.get('clues')

    if clues_param is not None:
        clues = int(clues_param)
        difficulty = request.args.get('difficulty', 'medium')
    else:
        # Difficulty controls the number of prefilled cells.
        difficulty = request.args.get('difficulty', 'medium').lower()

        clue_counts = {
            'easy': 45,
            'medium': 35,
            'hard': 28
        }

        clues = clue_counts.get(difficulty, 35)

    puzzle, solution = sudoku_logic.generate_puzzle(clues)

    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution

    return jsonify({
        'puzzle': puzzle,
        'solution': solution,
        'difficulty': difficulty,
        'clues': clues
    })
@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({'incorrect': incorrect})

if __name__ == '__main__':
    app.run(debug=True)
