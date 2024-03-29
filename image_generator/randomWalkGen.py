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

def create_media(file_name, seed, background_color):
    '''Generate a PNG image and 2 MP4 videos.'''

    file_name += '_' + background_color

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

    if x_range < y_range:
        vertical_steps, horizontal_steps = horizontal_steps, vertical_steps
        min_x, max_x, min_y, max_y = min_y, max_y, min_x, max_x
    x_range = max_x - min_x
    y_range = max_y - min_y

    num_steps = len(horizontal_steps)
    print(f"Number of steps in walk: {num_steps}")

    origin = np.zeros((1, 2))

    steps = np.stack((horizontal_steps, vertical_steps), axis=1)

    path = np.concatenate([origin, steps]).cumsum(0)

    def random_color_1ch(num_steps):
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

    c1 = random_color_1ch(num_steps + 1)
    c2 = random_color_1ch(num_steps + 1)
    c3 = random_color_1ch(num_steps + 1)

    C = np.array(list(zip(c1, c2, c3)))

    x_center = (min_x + max_x) / 2
    y_center = (min_y + max_y) / 2

    BORDER_PERCENT = 0.03
    border = int(target_size[1] * BORDER_PERCENT)

    final_size = tuple(x + 2 * border for x in target_size)
    im = Image.new('RGB', final_size, background_color)
    draw = ImageDraw.Draw(im)

    for i, step in enumerate(path):
        x, y = step
        x = int(x - x_center + target_size[0] / 2) + border
        y = int(y - y_center + target_size[1] / 2) + border
        draw.point((x, y), fill=tuple(int(x * 255) for x in C[i]))

    im.save(f"{file_name}.png", "PNG")
    print(f"{file_name}.png saved.")

    def generate_video(walkers, label):
        '''Generate a video. num_walkers is the number of starting points for
        the random walk.'''
        images = []
        im = Image.new('RGB', final_size, background_color)
        images.append(im)
        draw = ImageDraw.Draw(im)

        visited_coordinates = np.zeros(final_size)

        jump = len(path) // 600


        visited_index = set()

        def advance_walker(walker_num, draw):
            index, direction, active = walkers[walker_num]
            if not active:
                return 0
            new_index = index + direction

            if new_index in visited_index or new_index < 0 or new_index >= len(path):
                walkers[walker_num] = (index, direction, False)
                return 0

            walkers[walker_num] = (new_index, direction, True)

            visited_index.add(new_index)

            x, y = path[new_index]
            x = int(x - x_center + target_size[0] / 2) + border
            y = int(y - y_center + target_size[1] / 2) + border

            if visited_coordinates[x][y] < new_index:
                draw.point((x, y), fill=tuple(int(x * 255) for x in C[new_index]))
                visited_coordinates[x][y] = new_index
            return 1

        walker_num = 0
        since_frame = 0
        while any(x[-1] for x in walkers):
            since_frame += advance_walker(walker_num % len(walkers), draw)
            walker_num += 1
            if since_frame >= jump:
                images.append(im)
                im = im.copy()
                draw = ImageDraw.Draw(im)
                since_frame = 0
            else:
                since_frame += 1

        def add_holds(images):
            '''Add a few seconds before and at the end of the video.'''
            result = []
            INIT_HOLD_SECONDS = 0.3
            blank = Image.new('RGB', final_size, background_color)

            for _ in range(int(INIT_HOLD_SECONDS * VIDEO_FPS)):
                result.append(blank)

            result.extend(images)

            END_HOLD_SECONDS = 2
            for _ in range(END_HOLD_SECONDS * VIDEO_FPS):
                result.append(images[-1])
            return result

        images = add_holds(images)

        out = cv2.VideoWriter(f'{file_name}_{label}.mp4',cv2.VideoWriter_fourcc(*'MP4V'), VIDEO_FPS, final_size)

        for i in range(len(images)):
            cv_img = cv2.cvtColor(np.array(images[i]), cv2.COLOR_RGB2BGR)
            out.write(cv_img)

        out.release()
        print(f"{file_name}_{label}.mp4 saved.")

    # Generate video with 1 starting point
    walkers = [(-1, 1, True)]
    generate_video(walkers, "single")

    # Generate video with 3 starting points
    num_walkers = 3
    walkers = []
    for i in range(num_walkers):
        k = i / num_walkers + (1 / (num_walkers * 2))
        c = int(k * len(path))
        walkers.append((c - 1, 1, True))
        walkers.append((c, -1, True))
    generate_video(walkers, "triple")

if __name__ == "__main__":
    param = sys.argv[1]
    file_name = "out"
    if param.startswith("0x"):
        seed = param
    else:
        seed = get_seed(int(param))
        if seed == "0x0000000000000000000000000000000000000000000000000000000000000000":
            print(f"NFT #{param} does not exist")
            exit(0)
        file_name = "{0:06}".format(int(param))
        print('filename', file_name)
    print(f"Seed: {seed}")

    create_media(file_name, seed, "black")
    create_media(file_name, seed, "white")
