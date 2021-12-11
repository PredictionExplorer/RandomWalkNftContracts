from PIL import Image, ImageDraw

import cv2
import hashlib
import json
import numpy as np
import requests
import sys
import time

VIDEO_FPS = 60
ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc'
RANDOM_WALK_NFT_ADDRESS = "0x895a6F444BE4ba9d124F61DF736605792B35D66b".lower()

def make_req(params):
    params = json.dumps(params)
    headers = {'Content-Type': 'application/json'}
    while True:
        try:
            r = requests.post(ARBITRUM_RPC, headers=headers, data=params)
            return json.loads(r.text)
        except Exception as e:
            time.sleep(10)

def pad_zeros(val):
    v = str(hex(val))[2:]
    return '0' * (64 - len(v)) + v

def get_seed(token_id):
    p = {}
    p["to"] = RANDOM_WALK_NFT_ADDRESS

    method = "f0503e80"
    par = pad_zeros(token_id)
    p["data"] = "0x" + method + par

    params = {"jsonrpc":"2.0",
              "method":"eth_call",
              "params":[p, "latest"],"id":1}

    res = make_req(params)
    return res["result"]

def random_generator(init_seed):
    '''Generate random bits.'''
    if init_seed.startswith('0x'):
        init_seed = init_seed[2:]
    init_seed = bytes.fromhex(init_seed)

    seed = init_seed

    while True:
        m = hashlib.sha3_256()
        m.update(init_seed)
        m.update(seed)
        seed = m.digest()
        for b in seed:
            for i in range(8):
                yield (b >> i) & 1

def random_int(largest, gen):
    num = 0
    for _ in range(256):
        num = (num << 1) + next(gen)
    return num % largest

def calc_num_steps(seed):
    gen = random_generator(seed)

    horizontal_steps = []
    vertical_steps = []

    vert = 1500
    target_size = (int(vert * 1.6), vert)

    x, y = 0, 0
    min_x, max_x, min_y, max_y = 0, 0, 0, 0
    while True:
        a, b = next(gen), next(gen)
        if (a, b) == (0, 0):
            x += 1
            horizontal_steps.append(1)
            vertical_steps.append(0)
        elif (a, b) == (0, 1):
            x -= 1
            horizontal_steps.append(-1)
            vertical_steps.append(0)
        elif (a, b) == (1, 0):
            y += 1
            horizontal_steps.append(0)
            vertical_steps.append(1)
        elif (a, b) == (1, 1):
            y -= 1
            horizontal_steps.append(0)
            vertical_steps.append(-1)

        min_x = min(min_x, x)
        max_x = max(max_x, x)

        min_y = min(min_y, y)
        max_y = max(max_y, y)

        x_range = max_x - min_x
        y_range = max_y - min_y

        longer_range = max(x_range, y_range)
        shorter_range = min(x_range, y_range)

        if longer_range >= target_size[0] or shorter_range >= target_size[1]:
            break

    flipped = False
    if x_range < y_range:
        flipped = True
        vertical_steps, horizontal_steps = horizontal_steps, vertical_steps
        min_x, max_x, min_y, max_y = min_y, max_y, min_x, max_x
    x_range = max_x - min_x
    y_range = max_y - min_y

    num_steps = len(horizontal_steps)

    return num_steps, flipped

def generate_steps(horizontal_steps, vertical_steps, num_steps, seed):
    gen = random_generator(seed)

    x = horizontal_steps[-1]
    y = vertical_steps[-1]

    for _ in range(num_steps):
        a, b = next(gen), next(gen)
        if (a, b) == (0, 0):
            x += 1
            horizontal_steps.append(1)
            vertical_steps.append(0)
        elif (a, b) == (0, 1):
            x -= 1
            horizontal_steps.append(-1)
            vertical_steps.append(0)
        elif (a, b) == (1, 0):
            y += 1
            horizontal_steps.append(0)
            vertical_steps.append(1)
        elif (a, b) == (1, 1):
            y -= 1
            horizontal_steps.append(0)
            vertical_steps.append(-1)


def generate(list_num_steps, list_flipped, list_seed):
    horizontal_steps = [0]
    vertical_steps = [0]
    for i in range(len(list_num_steps)):
        if list_flipped[i]:
            generate_steps(vertical_steps, horizontal_steps, list_num_steps[i], list_seed[i])
        else:
            generate_steps(horizontal_steps, vertical_steps, list_num_steps[i], list_seed[i])

    return horizontal_steps, vertical_steps


def generate_image(horizontal_steps, vertical_steps, color_seed):

    num_steps = len(horizontal_steps)
    origin = np.zeros((1, 2))
    steps = np.stack((horizontal_steps, vertical_steps), axis=1)
    path = np.concatenate([origin, steps]).cumsum(0)

    def random_color_1ch(num_steps, gen):
        '''Geenrate colors for 1 channel.'''
        cur = 0
        result = []
        for _ in range(num_steps):
            cur += 1 if next(gen) == 1 else -1
            result.append(cur)
        lowest = min(result)
        highest = max(result)
        for i in range(len(result)):
            result[i] = (result[i] - lowest) / (highest - lowest)
        return result

    num_steps = len(horizontal_steps)
    gen = random_generator(color_seed)

    c1 = random_color_1ch(num_steps + 1, gen)
    c2 = random_color_1ch(num_steps + 1, gen)
    c3 = random_color_1ch(num_steps + 1, gen)

    C = np.array(list(zip(c1, c2, c3)))

    min_x = min(horizontal_steps)
    min_y = min(vertical_steps)

    max_x = max(horizontal_steps)
    max_y = max(vertical_steps)

    x_center = (min_x + max_x) / 2
    y_center = (min_y + max_y) / 2

    target_size = (10000, 10000)

    im = Image.new('RGB', target_size, "black")
    draw = ImageDraw.Draw(im)

    for i, step in enumerate(path):
        x, y = step
        x = int(x - x_center + target_size[0] / 2)
        y = int(y - y_center + target_size[1] / 2)
        draw.point((x, y), fill=tuple(int(x * 255) for x in C[i]))

    im.save("res.png", "PNG")
    print("saved")

if __name__ == "__main__":
    list_num_steps = []
    list_flipped = []
    list_seed = []
    for x in sys.argv[1:]:
        seed = get_seed(int(x))
        if seed == "0x0000000000000000000000000000000000000000000000000000000000000000":
            print(f"NFT #{param} does not exist")
            exit(0)
        print(seed)
        num_steps, flipped = calc_num_steps(seed)
        list_num_steps.append(num_steps)
        list_flipped.append(flipped)
        list_seed.append(seed)

    hor_steps, vert_steps = generate(list_num_steps, list_flipped, list_seed)
    generate_image(hor_steps, vert_steps, "0x00")
