#!/bin/bash

# Satranç taşları için klasör oluştur
mkdir -p public/img/chesspieces

# Taşları indir
cd public/img/chesspieces

# Siyah taşlar
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/bK.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/bQ.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/bR.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/bB.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/bN.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/bP.png

# Beyaz taşlar
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/wK.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/wQ.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/wR.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/wB.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/wN.png
curl -O https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia/wP.png

echo "Satranç taşları indirildi!" 