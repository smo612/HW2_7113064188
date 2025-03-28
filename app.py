from flask import Flask, render_template, request, jsonify
import random
import copy

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

    # 初始化 V(s)，非終點的格子初始值為負數
    for i in range(n):
        for j in range(n):
            if grid_status[i][j] == 0 or grid_status[i][j] == 1:  # 空格或起點
                value[i][j] = -random.uniform(0, 1)  # 隨機負值
            elif grid_status[i][j] == 2:  # 終點
                value[i][j] = 0  # 終點值固定 0
            elif grid_status[i][j] == 3:  # 障礙物
                value[i][j] = None  # 障礙物不參與計算

    # 進行價值迭代
    for _ in range(1000):  # 最多迭代 1000 次
        delta = 0
        new_value = copy.deepcopy(value)
        for i in range(n):
            for j in range(n):
                if grid_status[i][j] in [2, 3]:  # 終點 & 障礙物不變
                    continue

                best_action = None
                best_value = float('-inf')

                # 嘗試所有可能行動，選擇 V(s) 最大的
                for action, (di, dj) in directions.items():
                    ni, nj = i + di, j + dj
                    if 0 <= ni < n and 0 <= nj < n and grid_status[ni][nj] != 3:
                        new_v = reward + gamma * value[ni][nj]
                        if new_v > best_value:
                            best_value = new_v
                            best_action = action

                new_value[i][j] = best_value
                policy[i][j] = best_action if best_action else ''  # 更新最佳行動
                delta = max(delta, abs(new_value[i][j] - value[i][j]))

        value = new_value
        if delta < threshold:
            break  # 收斂則停止

    # 四捨五入保留兩位小數
    value = [[round(v, 2) if v is not None else None for v in row] for row in value]

    return jsonify({'policy': policy, 'value': value})

if __name__ == '__main__':
    app.run(debug=True)
