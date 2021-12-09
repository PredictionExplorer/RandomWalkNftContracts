You need to install opencv. On an Ubuntu machine you would need to run the following command:
  apt-get update && apt-get install -y python3-opencv

Install the Python requirements:
  pip3 install -r requirements.txt

You can generate the image and videos for a given NFT using the following command:
  python3 randomWalkGen.py <NFT number>

For example,
  python3 randomWalkGen.py 3456
