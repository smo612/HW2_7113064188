from flask import Flask, render_template, request, jsonify
import random
import copy
import os  # 新增這行

app = Flask(__name__)

@app.route('/')
def index():
    n = 5  # 預設大小
    return render_template('index.html', n=n)

@app.route('/generate_policy_value', methods=['POST'])
def generate_policy_value():
    data = request.json
    n = int(data['n'])
    grid_status = data['grid_status']

    directions = {'↑': (-1, 0), '↓': (1, 0), '←': (0, -1), '→': (0, 1)}
    policy = [['' for _ in range(n)] for _ in range(n)]
    value = [[0 for _ in range(n)] for _ in range(n)]  # 初始 V(s) 設為 0

    gamma = 0.9  # 折扣因子
    reward = -1  # 每步懲罰
    threshold = 0.01  # 收斂條件

    # 找終點位置
    end_pos = None
    for i in range(n):
        for j in range(n):
            if grid_status[i][j] == 2:
                end_pos = (i, j)

    # 初始化 V(s)
    for i in range(n):
        for j in range(n):
            if grid_status[i][j] == 0 or grid_status[i][j] == 1:  # 空格或起點
                value[i][j] = -random.uniform(0, 1)
            elif grid_status[i][j] == 2:  # 終點
                value[i][j] = 0
            elif grid_status[i][j] == 3:  # 障礙物
                value[i][j] = None

    # 價值迭代
    for _ in range(1000):
        delta = 0
        new_value = copy.deepcopy(value)
        for i in range(n):
            for j in range(n):
                if grid_status[i][j] in [2, 3]:
                    continue

                best_action = None
                best_value = float('-inf')

                for action, (di, dj) in directions.items():
                    ni, nj = i + di, j + dj
                    if 0 <= ni < n and 0 <= nj < n and grid_status[ni][nj] != 3:
                        new_v = reward + gamma * value[ni][nj]
                        if new_v > best_value:
                            best_value = new_v
                            best_action = action

                new_value[i][j] = best_value
                policy[i][j] = best_action if best_action else ''
                delta = max(delta, abs(new_value[i][j] - value[i][j]))

        value = new_value
        if delta < threshold:
            break

    value = [[round(v, 2) if v is not None else None for v in row] for row in value]
    return jsonify({'policy': policy, 'value': value})

# ✅ 支援 Render 所需：指定 host 與 port
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
