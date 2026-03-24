import { PolicyDocument, ProcedureStep } from '../types';

export const PROCEDURE_LIBRARY: Record<string, Omit<ProcedureStep, 'stepNo'>[]> = {
  'erişim|access control|yetkilendirme|rbac|privilege|kimlik doğrulama|authentication|mfa|oturum|iam|parola|password': [
    { title: 'Erişim Talebi ve Onay', description: 'Kullanıcı, sistem veya uygulama erişim talebini yetkili amiri aracılığıyla erişim yönetim sistemine iletir. Talep, iş gereksinimi ve minimum yetki prensibine göre değerlendirilir.', responsible: 'İlgili Departman Yöneticisi', inputs: ['Erişim talep formu', 'Görev tanımı'], outputs: ['Onaylı erişim talebi'] },
    { title: 'Hesap Oluşturma ve Yetkilendirme', description: 'Onaylanan talep BT/IAM ekibine iletilir; kullanıcı hesabı oluşturulur, rol ve yetkiler atanır, MFA etkinleştirilir.', responsible: 'BT / IAM Ekibi', inputs: ['Onaylı erişim talebi'], outputs: ['Kullanıcı hesabı', 'Yetki kaydı'] },
    { title: 'Erişim Bilgilerinin Teslimi', description: 'Başlangıç kimlik bilgileri kullanıcıya güvenli kanal üzerinden iletilir. Kullanıcı, ilk girişte parolasını değiştirmekle yükümlüdür.', responsible: 'BT / IAM Ekibi', inputs: ['Kullanıcı hesabı'], outputs: ['Teslim tutanağı', 'Parola değişim kaydı'] },
    { title: 'Periyodik Erişim Gözden Geçirme', description: 'En az altı ayda bir tüm hesaplar ve yetkiler gözden geçirilir; iş gereksinimi kalkmış veya değişmiş erişimler revize edilir ya da iptal edilir.', responsible: 'Bilgi Güvenliği Yöneticisi + Departman Yöneticileri', inputs: ['Güncel kullanıcı/yetki listesi'], outputs: ['Gözden geçirme raporu', 'Revizyon kaydı'] },
    { title: 'Ayrılış / Görev Değişikliği İşlemleri', description: 'Çalışanın ayrılması veya görev değişikliği durumunda hesap derhal devre dışı bırakılır, yetkiler güncellenir ve tüm sistemlere erişim sonlandırılır.', responsible: 'İnsan Kaynakları + BT Ekibi', inputs: ['Ayrılış bildirimi / atama kararı'], outputs: ['Hesap kapatma kaydı', 'Erişim iptal tutanağı'] },
  ],
  'veri koruma|data protection|kvkk|gdpr|kişisel veri|personal data|gizlilik|privacy|dpia': [
    { title: 'Kişisel Veri Envanteri Güncelleme', description: 'İşlenen kişisel verilerin kategorileri, işleme amaçları, saklama süreleri ve aktarılan taraflar envantere kaydedilir ve düzenli güncellenir.', responsible: 'Veri Koruma Sorumlusu (DPO)', inputs: ['Süreç haritası', 'Sistem envanteri'], outputs: ['Güncel KVKK / GDPR veri envanteri'] },
    { title: 'Veri İşleme Etki Değerlendirmesi (DPIA)', description: 'Yüksek riskli veri işleme faaliyetleri başlatılmadan önce DPIA gerçekleştirilir; riskler belirlenerek azaltıcı tedbirler uygulanır.', responsible: 'DPO + İlgili Süreç Sahibi', inputs: ['Yeni süreç / sistem tanımı'], outputs: ['DPIA raporu', 'Risk azaltma planı'] },
    { title: 'Veri Sahibi Hakları Yönetimi', description: 'Veri sahiplerinden gelen başvurular (erişim, silme, itiraz vb.) kayıt altına alınır ve yasal süreler içinde yanıtlanır.', responsible: 'DPO / İlgili Birim', inputs: ['Veri sahibi başvurusu'], outputs: ['Yanıt kaydı', 'İşlem tutanağı'] },
    { title: 'Veri İhlali Bildirim Prosedürü', description: 'Kişisel veri ihlali tespit edildiğinde 72 saat içinde ilgili otoriteye (KVKK Kurulu / supervisory authority) bildirim yapılır; etkilenen kişiler bilgilendirilir.', responsible: 'DPO + Bilgi Güvenliği Yöneticisi', inputs: ['İhlal tespit kaydı'], outputs: ['Resmi bildirim', 'İhlal kayıt formu'] },
    { title: 'Gözden Geçirme ve Denetim', description: 'Veri işleme faaliyetleri yıllık olarak denetlenir; mevzuat değişiklikleri takip edilerek politika ve prosedürler güncellenir.', responsible: 'İç Denetim + DPO', inputs: ['Veri envanteri', 'Denetim planı'], outputs: ['Denetim raporu', 'Güncellenmiş politika'] },
  ],
  'olay|incident|csirt|siber olay|müdahale|containment|playbook': [
    { title: 'Olay Tespiti ve Sınıflandırma', description: 'Güvenlik izleme araçları, kullanıcı bildirimleri veya üçüncü taraf uyarılarıyla tespit edilen olay; etki, kapsam ve aciliyet kriterlerine göre P1-P4 arasında sınıflandırılır.', responsible: 'SOC / CSIRT Analisti', inputs: ['SIEM uyarısı', 'Kullanıcı bildirimi', 'Tehdit istihbarat akışı'], outputs: ['Olay kaydı (ticket)', 'Sınıflandırma etiketi'] },
    { title: 'Kontrol Altına Alma (Containment)', description: 'Olayın yayılmasını önlemek amacıyla etkilenen sistem, hesap veya ağ segmenti izole edilir; geçici erişim kısıtlamaları uygulanır.', responsible: 'CSIRT Teknik Ekibi', inputs: ['Olay kaydı', 'Ağ/sistem topolojisi'], outputs: ['İzolasyon kaydı', 'Anlık durum raporu'] },
    { title: 'Kök Neden Analizi ve Temizleme', description: 'Olayın kaynağı araştırılır, kötü amaçlı yazılım / istismar kodu temizlenir, istismar edilen açıklar kapatılır.', responsible: 'CSIRT Teknik Ekibi + İlgili Sistem Sahibi', inputs: ['İzolasyon kaydı', 'Forensic veri'], outputs: ['Kök neden raporu', 'Temizleme kanıtı'] },
    { title: 'Kurtarma ve Hizmet Yeniden Başlatma', description: 'Temiz sistem görüntülerinden veya yedeklerden kurtarma yapılır; hizmetler kontrollü şekilde yeniden başlatılır ve normal işleyiş doğrulanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Temiz yedek', 'Kurtarma planı'], outputs: ['Servis kurtarma kaydı', 'Onay tutanağı'] },
    { title: 'Olay Sonrası Değerlendirme (PIR)', description: 'Olay kapatıldıktan sonraki 5 iş günü içinde post-incident review toplantısı yapılır; dersler çıkarılır, playbook ve kontroller güncellenir.', responsible: 'CSIRT Lideri + Üst Yönetim', inputs: ['Tüm olay kayıtları', 'Zaman çizelgesi'], outputs: ['PIR raporu', 'Güncellenmiş playbook', 'İyileştirme aksiyonları'] },
  ],
  'zafiyet|vulnerability|patch|yama|güvenlik açığı|cve|tarama|scan': [
    { title: 'Zafiyet Tarama Planlaması', description: 'Tüm sistem ve uygulamaları kapsayan tarama takvimi oluşturulur; kritik varlıklar aylık, diğerleri çeyrek dönemli taramaya dahil edilir.', responsible: 'Bilgi Güvenliği Ekibi', inputs: ['Varlık envanteri', 'Tarama aracı konfigürasyonu'], outputs: ['Tarama takvimi', 'Kapsam belgesi'] },
    { title: 'Zafiyet Taraması ve Tespit', description: 'Onaylanan araçlarla (Nessus, Qualys vb.) tarama gerçekleştirilir; bulunan zafiyetler CVSS skoruna göre Kritik / Yüksek / Orta / Düşük olarak derecelendirilir.', responsible: 'Bilgi Güvenliği Analisti', inputs: ['Tarama takvimi'], outputs: ['Ham tarama raporu', 'Zafiyet listesi (CVSS ile)'] },
    { title: 'Risk Değerlendirme ve Önceliklendirme', description: 'Tespit edilen zafiyetler iş etkisi ve istismar olasılığı göz önünde bulundurularak önceliklendirilir; ilgili sistem sahipleriyle paylaşılır.', responsible: 'Bilgi Güvenliği Yöneticisi + Sistem Sahipleri', inputs: ['Zafiyet listesi'], outputs: ['Önceliklendirilmiş aksiyon planı'] },
    { title: 'Yama Uygulama ve Giderme', description: 'Kritik yamalar 72 saat, yüksek yamalar 7 gün, orta/düşük yamalar 30 gün içinde uygulanır. Test ortamında doğrulama yapıldıktan sonra üretim ortamına geçilir.', responsible: 'BT Operasyon / DevOps Ekibi', inputs: ['Aksiyon planı', 'Onaylı yama'], outputs: ['Yama uygulama kaydı', 'Test onay belgesi'] },
    { title: 'Doğrulama Taraması ve Raporlama', description: 'Yama sonrası doğrulama taraması yapılarak giderme başarısı teyit edilir; kalan zafiyetler için risk kabul formu doldurulur.', responsible: 'Bilgi Güvenliği Analisti', inputs: ['Yama uygulama kaydı'], outputs: ['Doğrulama raporu', 'Risk kabul formu (gerekirse)'] },
  ],
  'yedek|backup|iş sürekliliği|business continuity|bcp|drp|felaket|disaster|kurtarma|rto|rpo': [
    { title: 'Yedekleme Kapsamı ve Sıklığı Belirleme', description: 'Kritik varlıklar risk değerlendirmesi doğrultusunda sınıflandırılır; RTO ve RPO hedefleri belirlenerek yedekleme sıklıkları (günlük/saatlik/anlık) tanımlanır.', responsible: 'BT Yöneticisi + İş Birimi Sahipleri', inputs: ['Varlık kritiklik listesi', 'İş etki analizi'], outputs: ['Yedekleme planı', 'RTO/RPO tablosu'] },
    { title: 'Yedekleme Uygulaması ve İzleme', description: 'Otomatik yedekleme görevleri çalıştırılır; başarı/başarısızlık sonuçları izleme sisteminde takip edilir ve anomaliler derhal raporlanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Yedekleme takvimi'], outputs: ['Yedekleme iş kuyruğu kaydı', 'İzleme dashboard'] },
    { title: 'Yedek Bütünlük Testi', description: 'Aylık olarak rastgele seçilen yedekler test ortamında geri yüklenerek bütünlük ve kullanılabilirlik doğrulanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Yedek arşivi'], outputs: ['Geri yükleme test raporu'] },
    { title: 'DR Tatbikatı', description: 'Yılda en az bir kez belgelenmiş DR tatbikatı yapılır; RTO/RPO hedeflerine ulaşılıp ulaşılmadığı ölçülür ve bulgular üst yönetime raporlanır.', responsible: 'İş Sürekliliği Yöneticisi', inputs: ['DR planı', 'Tatbikat senaryosu'], outputs: ['Tatbikat raporu', 'Boşluk analizi'] },
    { title: 'Plan Güncelleme ve Onay', description: 'DR/BCP planları, önemli altyapı değişikliklerinden sonra veya yılda en az bir kez gözden geçirilir; güncel versiyon üst yönetim tarafından onaylanır.', responsible: 'İş Sürekliliği Yöneticisi + Üst Yönetim', inputs: ['Tatbikat raporu', 'Altyapı değişiklik kayıtları'], outputs: ['Güncel DR/BCP planı', 'Onay tutanağı'] },
  ],
  'kriptografi|şifreleme|encryption|tls|aes|ssl|sertifika|certificate': [
    { title: 'Kriptografik Gereksinim Analizi', description: 'Korunması gereken veri kategorileri ve iletişim kanalları belirlenir; her biri için uygun şifreleme algoritması ve anahtar uzunluğu standartları tanımlanır.', responsible: 'Bilgi Güvenliği Mimarı', inputs: ['Veri sınıflandırma politikası', 'Sistem envanteri'], outputs: ['Kriptografi standartları belgesi'] },
    { title: 'Anahtar Oluşturma ve Dağıtım', description: 'Kriptografik anahtarlar onaylı HSM veya anahtar yönetim sistemi (KMS) aracılığıyla oluşturulur; dağıtım güvenli kanal üzerinden gerçekleştirilir.', responsible: 'BT Güvenlik Ekibi', inputs: ['Kriptografi standartları'], outputs: ['Oluşturulan anahtar seti', 'Dağıtım kaydı'] },
    { title: 'Sertifika Yaşam Döngüsü Yönetimi', description: 'Dijital sertifikaların son kullanma tarihleri izlenir; süresi dolmadan en az 30 gün önce yenileme başlatılır; iptal edilen sertifikalar CRL/OCSP üzerinden yayımlanır.', responsible: 'PKI / BT Ekibi', inputs: ['Sertifika envanteri'], outputs: ['Yenilenmiş sertifika', 'İptal kayıtları'] },
    { title: 'Anahtar Rotasyonu ve İmha', description: 'Anahtarlar politikada belirtilen periyotta veya risk olayı sonrasında döndürülür; kullanım dışı anahtarlar güvenli imha protokolüne göre silinir.', responsible: 'Bilgi Güvenliği Ekibi', inputs: ['Rotasyon takvimi'], outputs: ['Rotasyon kaydı', 'İmha tutanağı'] },
    { title: 'Denetim ve Uyum Kontrolü', description: 'Tüm kriptografik uygulamalar yılda bir denetlenir; zayıf algoritma kullanımı (MD5, SHA-1, DES vb.) tespit edilerek güçlendirilir.', responsible: 'İç Denetim + Bilgi Güvenliği', inputs: ['Sistem konfigürasyonları'], outputs: ['Kriptografi denetim raporu'] },
  ],
  'ağ|network|firewall|ids|ips|segmentation|güvenlik duvarı': [
    { title: 'Ağ Mimarisi Belgeleme ve Segmentasyon', description: 'Ağ topolojisi ve güvenlik bölgeleri (DMZ, iç ağ, yönetim ağı vb.) tanımlanır ve belgelenir; kritik varlıklar ayrı segmentlere yerleştirilir.', responsible: 'Ağ Mimarı / Bilgi Güvenliği', inputs: ['Varlık envanteri', 'Risk değerlendirme'], outputs: ['Ağ mimarisi diyagramı', 'Segmentasyon konfigürasyonu'] },
    { title: 'Güvenlik Duvarı Kural Yönetimi', description: 'Yeni kural talepleri değişiklik yönetimi süreciyle onaylanır; gereksiz veya güncel olmayan kurallar çeyrek dönemde gözden geçirilip kaldırılır.', responsible: 'Ağ / Güvenlik Ekibi', inputs: ['Değişiklik talebi'], outputs: ['Güncel kural seti', 'Gözden geçirme kaydı'] },
    { title: 'Ağ İzleme ve Anomali Tespiti', description: 'NetFlow, IDS/IPS ve SIEM entegrasyonuyla ağ trafiği sürekli izlenir; anormal trafik desenleri tespit edildiğinde olay müdahale süreci başlatılır.', responsible: 'SOC Ekibi', inputs: ['SIEM akışları', 'IDS/IPS uyarıları'], outputs: ['Anomali raporu', 'Olay kaydı'] },
    { title: 'Sızma Testi ve Güvenlik Değerlendirme', description: 'Yılda en az bir kez harici ve dahili sızma testi gerçekleştirilir; bulunan açıklar zafiyet yönetimi süreciyle kapatılır.', responsible: 'Bilgi Güvenliği Yöneticisi (dış temin)', inputs: ['Kapsam belgesi'], outputs: ['Sızma testi raporu', 'Kapatma planı'] },
    { title: 'Ağ Konfigürasyon Denetimi', description: 'Ağ cihazları konfigürasyonları CIS Benchmark veya benzeri standartlara göre altı ayda bir denetlenir; sapmaların giderilmesi takip edilir.', responsible: 'Ağ Ekibi + İç Denetim', inputs: ['CIS Benchmark baseline'], outputs: ['Konfigürasyon denetim raporu'] },
  ],
  'log|siem|izleme|monitoring|denetim günlüğü|audit': [
    { title: 'Log Kaynağı Tanımlama ve Yapılandırma', description: 'Tüm kritik sistem, uygulama ve ağ cihazlarının log akışları SIEM veya merkezi log yönetim platformuna yönlendirilir; format ve zaman damgası standardizasyonu sağlanır.', responsible: 'BT / SOC Ekibi', inputs: ['Sistem envanteri', 'SIEM konfigürasyonu'], outputs: ['Log kaynak envanteri', 'Aktif log akış listesi'] },
    { title: 'Log Saklama ve Arşivleme', description: 'Loglar yasal ve sektörel gereksinimlere uygun süreyle (minimum 1 yıl, arşivde 3 yıl) saklanır; bütünlük koruması için hash/imzalama uygulanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Saklama politikası'], outputs: ['Arşiv planı', 'Bütünlük hash kaydı'] },
    { title: 'Korelasyon Kuralları ve Alarm Yönetimi', description: 'SIEM üzerinde kullanım senaryoları (use case) tanımlanır; alarm eşikleri belirlenir ve yanlış pozitif oranı düzenli olarak optimize edilir.', responsible: 'SOC Analisti / Güvenlik Mühendisi', inputs: ['Tehdit modeli', 'Geçmiş olay verileri'], outputs: ['Use case kataloğu', 'Alarm konfigürasyonu'] },
    { title: 'Aktif İzleme ve Triage', description: 'SOC analistleri SIEM alarmlarını 7/24 izler; yüksek öncelikli alarmlar 15 dakika içinde triyaj edilir ve gerekirse olay müdahale süreci başlatılır.', responsible: 'SOC L1/L2 Analisti', inputs: ['SIEM alarmları'], outputs: ['Triage kaydı', 'Olay bileti (gerekirse)'] },
    { title: 'Denetim Günlüğü Gözden Geçirme', description: 'Ayrıcalıklı hesap aktiviteleri ve hassas veri erişim logları aylık olarak gözden geçirilir; anormallikler raporlanır.', responsible: 'Bilgi Güvenliği Yöneticisi + İç Denetim', inputs: ['Ayrıcalıklı hesap log raporu'], outputs: ['Aylık denetim raporu'] },
  ],
  'değişiklik|change management|cab|release|deployment|ci/cd': [
    { title: 'Değişiklik Talebinin Kaydı ve Sınıflandırması', description: 'Değişiklik talebi (RFC) ITSM sistemine kayıt edilir; aciliyet, etki ve risk kriterlerine göre Standart / Normal / Acil olarak sınıflandırılır.', responsible: 'Değişiklik Sahibi', inputs: ['RFC formu'], outputs: ['Kayıtlı RFC', 'Sınıflandırma etiketi'] },
    { title: 'Risk Değerlendirme ve Onay', description: 'Normal değişiklikler CAB (Değişiklik Danışma Kurulu) tarafından değerlendirilir; risk analizi, geri alma planı ve test stratejisi incelenerek onaylanır ya da reddedilir.', responsible: 'CAB / Değişiklik Yöneticisi', inputs: ['RFC', 'Risk ve geri alma planı'], outputs: ['Onay/red kararı', 'CAB tutanağı'] },
    { title: 'Test Ortamında Doğrulama', description: 'Onaylı değişiklik önce test/sahne ortamında uygulanır; işlevsellik, performans ve güvenlik testleri tamamlanmadan üretime geçiş yapılmaz.', responsible: 'Geliştirici / DevOps Ekibi', inputs: ['Onaylı RFC', 'Test planı'], outputs: ['Test sonuç raporu'] },
    { title: 'Üretim Geçişi ve İzleme', description: 'Değişiklik onaylı bakım penceresi içinde uygulanır; geçiş sonrası belirlenen süre izlenerek başarı kriterleri doğrulanır.', responsible: 'Operasyon Ekibi / Release Manager', inputs: ['Değişiklik planı', 'Geri alma talimatı'], outputs: ['Geçiş kaydı', 'İzleme raporu'] },
    { title: 'Kapanış ve Dokümantasyon', description: 'Başarılı değişiklik kapatılır; etkilenen dokümanlar, yapılandırma kayıtları ve CMDB güncellenir. Başarısız değişiklikler kök neden analizi için incelenir.', responsible: 'Değişiklik Yöneticisi', inputs: ['Geçiş kaydı'], outputs: ['Kapatılmış RFC', 'Güncel CMDB'] },
  ],
  'varlık|asset|envanter|inventory|cmdb': [
    { title: 'Varlık Keşfi ve Envantere Kayıt', description: 'Ağ tarama araçları ve manuel bildirimlerle tüm donanım, yazılım ve veri varlıkları tespit edilerek CMDB/envanter sistemine kaydedilir.', responsible: 'BT Varlık Yöneticisi', inputs: ['Ağ tarama çıktısı', 'Satın alma kayıtları'], outputs: ['Güncel varlık envanteri'] },
    { title: 'Varlık Sınıflandırma ve Sahiplik', description: 'Her varlık kritiklik, veri hassasiyeti ve iş etkisine göre sınıflandırılır; bir iş birimi sahibine atanır.', responsible: 'Bilgi Güvenliği + İş Birimi', inputs: ['Varlık envanteri'], outputs: ['Sınıflandırılmış envanter', 'Sahiplik matrisi'] },
    { title: 'Konfigürasyon Yönetimi', description: "Varlıkların onaylı baseline konfigürasyonları CMDB'ye kaydedilir; yetkisiz değişiklikler konfigürasyon uyum aracıyla tespit edilir.", responsible: 'BT Operasyon Ekibi', inputs: ['Baseline konfigürasyon'], outputs: ['CMDB kaydı', 'Uyumsuzluk uyarıları'] },
    { title: 'Periyodik Envanter Doğrulama', description: 'Fiziksel ve mantıksal envanter çeyrek dönemde doğrulanır; kayıp/fazla varlıklar raporlanır ve gerekli güncelleme yapılır.', responsible: 'BT Varlık Yöneticisi', inputs: ['CMDB kayıtları'], outputs: ['Doğrulama raporu', 'Delta listesi'] },
    { title: 'Kullanım Ömrü Sonu (EOL) Yönetimi', description: 'EOL/EOS tarihine ulaşan varlıklar zamanında yenilenir veya güvenli şekilde kullanım dışı bırakılır; veri taşıma/imha prosedürleri uygulanır.', responsible: 'BT Yöneticisi + Satın Alma', inputs: ['EOL takvimi'], outputs: ['Yenileme planı', 'İmha tutanağı'] },
  ],
  'farkındalık|awareness|eğitim|training|phishing': [
    { title: 'Eğitim İhtiyaç Analizi', description: 'Rol bazlı güvenlik eğitim gereksinimleri belirlenir; risk ortamı değişiklikleri ve geçmiş olay verileri analiz edilerek müfredat güncellenir.', responsible: 'Bilgi Güvenliği + İnsan Kaynakları', inputs: ['Risk değerlendirme', 'Olay kayıtları'], outputs: ['Yıllık eğitim planı', 'Müfredat belgesi'] },
    { title: 'Eğitim İçeriği Hazırlama ve Dağıtım', description: 'Zorunlu temel farkındalık eğitimi ve rol bazlı ileri eğitimler LMS üzerinden çalışanlara atanır; yeni işe başlayanlar için onboarding programı tanımlanır.', responsible: 'Bilgi Güvenliği + İK', inputs: ['Eğitim planı', 'Rol envanteri'], outputs: ['LMS kurs ataması', 'Onboarding eğitim paketi'] },
    { title: 'Phishing Simülasyonu', description: 'Yılda en az iki kez simüle phishing kampanyası yürütülür; tıklama ve veri girme oranları ölçülür; başarısız olan çalışanlara hedefli eğitim verilir.', responsible: 'Bilgi Güvenliği Ekibi', inputs: ['Simülasyon senaryosu'], outputs: ['Simülasyon raporu', 'Hedefli eğitim listesi'] },
    { title: 'Tamamlanma Takibi ve Raporlama', description: 'Eğitim tamamlanma oranları aylık olarak izlenir; %90 altında kalan birimlere hatırlatma yapılır; sonuçlar üst yönetime raporlanır.', responsible: 'İnsan Kaynakları + Bilgi Güvenliği', inputs: ['LMS tamamlanma verileri'], outputs: ['Aylık tamamlanma raporu'] },
    { title: 'Etkinlik Ölçümü ve İyileştirme', description: 'Eğitim sonrası değerlendirme testleri ve olay istatistikleri analiz edilerek programın etkinliği ölçülür; bir sonraki dönem için iyileştirme planı hazırlanır.', responsible: 'Bilgi Güvenliği Yöneticisi', inputs: ['Test sonuçları', 'Olay istatistikleri'], outputs: ['Etkinlik raporu', 'İyileştirme önerileri'] },
  ],
  'uygulama güvenliği|application security|owasp|sast|dast|sdlc|sql injection|xss': [
    { title: 'Güvenli Geliştirme Eğitimi', description: 'Yazılım geliştiricilere OWASP Top 10, güvenli kodlama standartları ve yaygın zafiyet türleri konusunda yıllık eğitim verilir.', responsible: 'Bilgi Güvenliği + Yazılım Geliştirme Yöneticisi', inputs: ['Eğitim müfredatı'], outputs: ['Eğitim tamamlanma kaydı'] },
    { title: 'Statik Kod Analizi (SAST)', description: "CI/CD pipeline entegrasyonuyla her commit/pull request sonrası otomatik SAST taraması çalıştırılır; kritik/yüksek bulgular build'i engeller.", responsible: 'DevSecOps / Geliştirici', inputs: ['Kaynak kod'], outputs: ['SAST tarama raporu', 'Build durumu'] },
    { title: 'Dinamik Uygulama Testi (DAST)', description: "Test ve sahne ortamında haftalık DAST taraması yapılır; üretim geçişinden önce tüm kritik açıkların kapatıldığı doğrulanır.", responsible: 'Güvenlik Testi Ekibi', inputs: ["Çalışan uygulama URL'leri"], outputs: ['DAST tarama raporu', 'Zafiyet kapatma kaydı'] },
    { title: 'Güvenlik Kod İncelemesi', description: 'Kritik modüller ve yüksek riskli değişiklikler eşler arası güvenlik kodu incelemesine tabi tutulur; bulgular geliştirici tarafından kapatılır.', responsible: 'Kıdemli Geliştirici / Güvenlik Ekibi', inputs: ['Pull request / diff'], outputs: ['Code review onayı', 'Güvenlik notu'] },
    { title: 'Üretim Sonrası İzleme ve Yama', description: 'Üretimdeki uygulamalar WAF, RASP ve DAST ile sürekli izlenir; keşfedilen açıklar zafiyet yönetimi süresiyle belirlenen SLA içinde kapatılır.', responsible: 'DevSecOps + Uygulama Sahibi', inputs: ['WAF logları', 'Zafiyet bildirimleri'], outputs: ['Yama kaydı', 'Kapanış kanıtı'] },
  ],
};

export function buildProceduresForControl(ctrl: { title?: string; category?: string; description?: string }): ProcedureStep[] {
  const text = `${ctrl.title || ''} ${ctrl.category || ''} ${ctrl.description || ''}`.toLowerCase();
  for (const [pattern, steps] of Object.entries(PROCEDURE_LIBRARY)) {
    if (pattern.split('|').some(kw => text.includes(kw.toLowerCase()))) {
      return steps.map((s, i) => ({ stepNo: i + 1, ...s }));
    }
  }
  // Generic fallback
  return [
    { stepNo: 1, title: 'Gereksinim Analizi ve Planlama', description: `${ctrl.title} kontrolüne ilişkin yasal, düzenleyici ve iş gereksinimleri belirlenir; uygulama kapsamı ve sorumluluklar tanımlanır.`, responsible: 'Bilgi Güvenliği Yöneticisi', inputs: ['Risk değerlendirme raporu', 'İlgili standart gereksinimleri'], outputs: ['Uygulama planı', 'Sorumluluk matrisi'] },
    { stepNo: 2, title: 'Kontrol Tasarımı ve Uygulama', description: 'Belirlenen gereksinimleri karşılayan kontroller tasarlanır ve ilgili süreçlere entegre edilir; teknik ve idari tedbirler hayata geçirilir.', responsible: 'İlgili Departman Yöneticisi + BT', inputs: ['Uygulama planı'], outputs: ['Uygulanan kontroller', 'Konfigürasyon kanıtı', 'Prosedür belgeleri'] },
    { stepNo: 3, title: 'Farkındalık ve Eğitim', description: 'Etkilenen personel yeni kontrol ve prosedürler hakkında bilgilendirilir; gerekli eğitimler tamamlatılır.', responsible: 'İnsan Kaynakları + Bilgi Güvenliği', inputs: ['Uygulama planı', 'Eğitim materyali'], outputs: ['Eğitim kayıtları', 'Katılım listeleri'] },
    { stepNo: 4, title: 'İzleme ve Etkinlik Ölçümü', description: 'Kontrollerin etkinliği KPI ve metriklerle düzenli olarak ölçülür; uyumsuzluklar ve sapma raporları ilgili yöneticilere iletilir.', responsible: 'Bilgi Güvenliği Yöneticisi', inputs: ['İzleme verileri', 'Denetim bulguları'], outputs: ['Aylık / çeyreklik etkinlik raporu'] },
    { stepNo: 5, title: 'Gözden Geçirme ve Sürekli İyileştirme', description: 'Politika ve prosedürler yılda en az bir kez ya da önemli değişiklikler sonrasında gözden geçirilir; iyileştirme fırsatları değerlendirilerek güncelleme yapılır.', responsible: 'Üst Yönetim / BGYS Komitesi', inputs: ['Etkinlik raporları', 'Denetim bulguları', 'Paydaş geri bildirimleri'], outputs: ['Güncellenmiş politika ve prosedürler', 'Onay tutanağı'] },
  ];
}

export function buildDefaultTemplate(ctrl: { title?: string; description?: string; category?: string }): PolicyDocument {
  const procedures = buildProceduresForControl(ctrl);
  return {
    documentTitle: `${ctrl.title} Politikası`,
    purpose: `Bu politika, organizasyonun ${(ctrl.title || '').toLowerCase()} kapsamındaki kontrol gereksinimlerini karşılamak ve uyum güvencesini sağlamak amacıyla hazırlanmıştır. ${ctrl.description || ''}`,
    scope: `Bu politika; kuruluşun tüm çalışanlarını, yüklenicilerini, danışmanlarını ve bilgi varlıklarına erişimi olan üçüncü tarafları kapsar.`,
    policyStatement: `Kuruluş, ${(ctrl.title || '').toLowerCase()} alanında gerekli tüm kontrolleri oluşturmayı, uygulamayı ve sürekliliğini sağlamayı taahhüt eder.\n\nBu politika kapsamındaki tüm faaliyetler ilgili yasal düzenlemeler, sektörel standartlar ve kuruluş içi yönergelere uygun şekilde yürütülmelidir.\n\nPolitika ihlalleri disiplin prosedürlerini ve gerektiğinde yasal süreçleri başlatabilir.`,
    procedures,
    responsibilities: [
      { role: 'Üst Yönetim', duties: 'Politikayı onaylamak, gerekli kaynakları sağlamak ve uyum kültürünü desteklemek.' },
      { role: 'Bilgi Güvenliği Yöneticisi', duties: 'Politikanın uygulanmasını koordine etmek, izlemek ve raporlamak.' },
      { role: 'Departman Yöneticileri', duties: 'Kendi birimlerinde politikaya uyumu sağlamak ve personeli yönlendirmek.' },
      { role: 'Tüm Çalışanlar', duties: 'Politika hükümlerine uymak; ihlal ve zafiyetleri derhal bildirmek.' },
      { role: 'İç Denetim', duties: 'Uyumu bağımsız olarak denetlemek ve bulgularını raporlamak.' },
    ],
    measurementCriteria: [
      'Politika gözden geçirme tamamlanma oranı: %100 (yıllık)',
      'Tespit edilen politika ihlal sayısı: Hedef 0',
      'Farkındalık eğitimi tamamlama oranı: >= %90',
      'Açık bulgu kapatma süresi: <= 30 gün',
    ],
    relatedDocuments: ['Bilgi Güvenliği Ana Politikası', `${ctrl.category || 'BT'} Prosedürleri`, 'Risk Değerlendirme Çerçevesi', 'İç Denetim Planı'],
    exceptions: 'İstisna talepleri yazılı olarak Bilgi Güvenliği Yöneticisine iletilmeli, gerekçelendirilmeli ve Üst Yönetim tarafından onaylanmalıdır. Onaylanan istisnalar kayıt altına alınır ve periyodik olarak gözden geçirilir.',
    compliance: 'Bu politikaya uymayan personel hakkında İnsan Kaynakları politikaları çerçevesinde disiplin süreci başlatılır. Kasıtlı veya tekrarlayan ihlaller iş akdi feshine ve yasal işleme yol açabilir.',
    reviewPeriod: 'Yıllık',
  };
}

export function bumpVersion(current: string): string {
  if (!current) return '1.0';
  const parts = current.split('.');
  const maj = parseInt(parts[0]) || 1;
  const min = parseInt(parts[1]) || 0;
  return `${maj}.${min + 1}`;
}

export function getCurrentDocument(policy: any): any {
  if (!policy || !policy.versions) return null;
  const ver = policy.versions.find((v: any) => v.version === policy.currentVersion);
  return ver ? ver.document : null;
}

// ── Doc-type template builders ─────────────────────────────────────────────

export function buildTemplateForType(docType: string, title: string, description?: string, category?: string): any {
  const t = title || 'Kontrol';
  const d = description || '';
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = (new Date().getFullYear() + 1) + today.slice(4);

  switch (docType) {
    case 'procedure': return buildProcedureTemplate(t, d, category);
    case 'checklist': return buildChecklistTemplate(t, d);
    case 'raci':      return buildRaciTemplate(t);
    case 'revision':  return buildRevisionTemplate(t, today, nextYear);
    default:          return buildDefaultTemplate({ title: t, description: d, category });
  }
}

function buildProcedureTemplate(title: string, description: string, category?: string): any {
  // Re-use existing PROCEDURE_LIBRARY keywords
  const lc = (title + ' ' + description + ' ' + (category || '')).toLowerCase();
  let steps: any[] = [];
  for (const [pattern, lib] of Object.entries(PROCEDURE_LIBRARY)) {
    if (pattern.split('|').some(kw => lc.includes(kw))) {
      steps = lib.map((s, i) => ({ stepNo: i + 1, ...s, duration: s.duration || '1-2 saat' }));
      break;
    }
  }
  if (!steps.length) {
    steps = [
      { stepNo: 1, title: 'Hazırlık ve Planlama', responsible: 'Süreç Sahibi', description: 'Gerekli kaynaklar, yetkiler ve bağımlılıklar doğrulanır; uygulama planı onaylanır.', duration: '1 saat', inputs: ['Politika belgesi', 'Kapsam tanımı'], outputs: ['Hazırlık onay formu'] },
      { stepNo: 2, title: 'Uygulama', responsible: 'Teknik Ekip', description: 'Tanımlanan kontroller ve adımlar uygulanır, her aşama kayıt altına alınır.', duration: '4 saat', inputs: ['Hazırlık onay formu'], outputs: ['Uygulama kaydı'] },
      { stepNo: 3, title: 'Doğrulama ve Test', responsible: 'Kalite / Denetim', description: 'Uygulama çıktıları bağımsız olarak doğrulanır; test sonuçları raporlanır.', duration: '2 saat', inputs: ['Uygulama kaydı'], outputs: ['Doğrulama raporu'] },
      { stepNo: 4, title: 'Onay ve Yayımlama', responsible: 'Bilgi Güvenliği Yöneticisi', description: 'Doğrulama raporu incelenerek nihai onay verilir; prosedür yürürlüğe girer.', duration: '30 dk', inputs: ['Doğrulama raporu'], outputs: ['Onaylı prosedür kaydı'] },
    ];
  }
  return {
    documentTitle: `${title} Prosedürü`,
    trigger: `Bu prosedür; "${title.toLowerCase()}" gerektiren bir durum oluştuğunda, periyodik gözden geçirme döneminde veya ilgili politikada değişiklik yapıldığında devreye girer.`,
    steps,
    approvalChain: [
      { role: 'Sorumlu Personel', approvalType: 'Uygulama' },
      { role: 'Departman Yöneticisi', approvalType: 'Onay' },
      { role: 'Bilgi Güvenliği Yöneticisi', approvalType: 'Nihai Onay' },
    ],
    escalation: 'Prosedür aksaklıklarında veya belirsiz durumlarda doğrudan Bilgi Güvenliği Yöneticisine eskalasyon yapılır.',
    reviewPeriod: 'Yıllık',
  };
}

function buildChecklistTemplate(title: string, _description: string): any {
  return {
    documentTitle: `${title} Kontrol Listesi`,
    frequency: 'Aylık',
    approver: 'Bilgi Güvenliği Yöneticisi',
    items: [
      { itemNo: 1, description: 'Politika ve prosedür belgesi güncel ve erişilebilir durumda', responsible: 'BGY', evidenceType: 'Belge gözden geçirme kaydı', priority: 'YÜKSEK' },
      { itemNo: 2, description: 'Kontrol uygulamaları test edildi ve sonuçlar kayıt altına alındı', responsible: 'Teknik Ekip', evidenceType: 'Test raporu', priority: 'KRİTİK' },
      { itemNo: 3, description: 'Anormallik veya uyumsuzluk tespit edilmedi / tespit edilip giderildi', responsible: 'SOC / Denetim', evidenceType: 'Olay / anomali kaydı', priority: 'YÜKSEK' },
      { itemNo: 4, description: 'İlgili personel eğitim ve farkındalık durumu güncel', responsible: 'İnsan Kaynakları', evidenceType: 'Eğitim tamamlanma kayıtları', priority: 'ORTA' },
      { itemNo: 5, description: 'Periyodik yönetim raporu hazırlandı ve onaylandı', responsible: 'BGY', evidenceType: 'Onaylı yönetim raporu', priority: 'YÜKSEK' },
    ],
  };
}

function buildRaciTemplate(title: string): any {
  return {
    documentTitle: `${title} Sorumluluk Matrisi (RACI)`,
    roles: ['Bilgi Güvenliği Yöneticisi', 'Departman Yöneticisi', 'Teknik Ekip', 'İç Denetim', 'Üst Yönetim'],
    activities: [
      { activity: 'Politika onaylama ve yayımlama', R: 'BGY', A: 'Üst Yönetim', C: 'Hukuk / Uyum', I: 'Tüm Personel' },
      { activity: 'Prosedür uygulama', R: 'Teknik Ekip', A: 'Departman Yöneticisi', C: 'BGY', I: 'İç Denetim' },
      { activity: 'Kontrol listesi doğrulama', R: 'İç Denetim', A: 'BGY', C: 'Teknik Ekip', I: 'Üst Yönetim' },
      { activity: 'Uyumsuzluk ve olay yönetimi', R: 'BGY', A: 'Üst Yönetim', C: 'Hukuk, IT', I: 'İlgili Departmanlar' },
      { activity: 'Periyodik gözden geçirme', R: 'BGY', A: 'Üst Yönetim', C: 'Tüm Paydaşlar', I: 'İç Denetim' },
    ],
  };
}

function buildRevisionTemplate(title: string, today: string, nextYear: string): any {
  return {
    documentTitle: `${title} Revizyon / Versiyon Takip Belgesi`,
    nextReviewDate: nextYear,
    updateProcedure: 'İlgili regülasyon veya standart güncellenmesi durumunda 30 gün içinde doküman güncellenir. Güncelleme, BGY tarafından onaylanır ve tüm paydaşlara duyurulur. Yıllık periyodik gözden geçirme takvime bağlıdır.',
    triggerEvents: [
      'İlgili standart veya regülasyonun yeni sürümünün yayımlanması',
      'Kurumsal yapı, süreç veya teknoloji değişikliği',
      'Yıllık gözden geçirme dönemine girilmesi',
      'Ciddi güvenlik ihlali veya denetim bulgusu',
      'Yasal mevzuat değişikliği',
    ],
    records: [
      { version: '1.0', date: today, change: 'İlk sürüm oluşturuldu', changedBy: 'Sistem', approvedBy: 'Bilgi Güvenliği Yöneticisi' },
    ],
  };
}
