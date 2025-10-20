# Akal Video Stüdyo

Bu depo, tarayıcı üzerinde çalışan tek sayfalık bir video montaj uygulamasını içerir. Uygulama; video kırpma, oynatma hızı ayarlama, metin bindirmesi, basit filtreler ve arka plan müziği ekleme gibi temel düzenleme adımlarını destekler. Tüm işlemler yerel cihazınızda gerçekleşir ve herhangi bir sunucuya dosya yüklenmez.

## Başlangıç

1. Depoyu bilgisayarınıza klonlayın veya ZIP olarak indirin.
2. `index.html` dosyasını modern bir tarayıcıda (Chrome, Edge veya Firefox) açın.
3. "Video Dosyası Seç" düğmesiyle bir video yükleyin ve düzenlemeye başlayın.

> **Not:** Dışa aktarma için tarayıcınızın `MediaRecorder` ve `canvas.captureStream` API'lerini desteklemesi gerekir. Eski tarayıcılar bu özellikleri sunmayabilir.

## Özellikler

- Video içinden başlangıç ve bitiş noktaları seçme
- Oynatma hızını değiştirme
- Metin bindirmesi (renk, boyut, konum, yazı tipi ve gölge ayarı)
- Görsel filtreler
- Video ve arka plan müziği ses seviyelerini düzenleme
- Düzenlenmiş videoyu WebM formatında dışa aktarma

## Katkıda Bulunma

Özellik eklemek veya hata düzeltmek isterseniz lütfen bir dal açın ve Pull Request gönderin. Tarayıcı üzerinde çalışan çözümlere odaklandığımız için sunucu tarafı bileşenler kabul edilmemektedir.