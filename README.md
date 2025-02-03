# Online Satranç Oyunu

Bu proje, gerçek zamanlı çok oyunculu bir online satranç oyunudur. Socket.IO kullanılarak anlık iletişim sağlanmıştır ve MongoDB ile oyun verileri saklanmaktadır.

## Özellikler

- Gerçek zamanlı oyun deneyimi
- Özelleştirilebilir zaman kontrolü (5, 10, 15, 30 dakika)
- Renk seçimi (beyaz, siyah veya rastgele)
- Hamle geçmişi görüntüleme
- Oda sistemi ile arkadaşlarınızla oynama imkanı
- Kalan süre göstergesi

## Kurulum

1. Projeyi klonlayın:
```bash
git clone [repo-url]
cd chess
```

2. Gerekli paketleri yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun ve MongoDB bağlantı bilgilerinizi ekleyin:
```
MONGODB_URI=mongodb+srv://admin:admin@cluster0.cexbe.mongodb.net/chess
PORT=3000
```

4. Uygulamayı başlatın:
```bash
npm start
```

5. Tarayıcınızda `http://localhost:3000` adresine gidin.

## Nasıl Oynanır?

1. Ana sayfada "Yeni Oyun Oluştur" bölümünden:
   - Oyun süresini seçin
   - Renk tercihinizi yapın (beyaz, siyah veya rastgele)
   - "Oyun Oluştur" butonuna tıklayın

2. Size verilen oda numarasını arkadaşınızla paylaşın.

3. Arkadaşınız ana sayfada "Oyuna Katıl" bölümünden oda numarasını girerek oyuna katılabilir. (Url'yi paylaşmayın token kişiye özeldir)

4. Oyun başladığında:
   - Sıra sizdeyken taşları sürükleyip bırakarak hamle yapabilirsiniz
   - Sağ tarafta hamle geçmişini görebilirsiniz
   - Üst kısımda kalan sürenizi takip edebilirsiniz

## Teknolojiler

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Chess.js
- Chessboard.js

## Geliştirme

Projeyi geliştirme modunda çalıştırmak için:

```bash
npm run dev
```

Bu komut, nodemon ile sunucuyu başlatacak ve kod değişikliklerinde otomatik olarak yeniden başlatacaktır. 
