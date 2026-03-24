/**
 * BT_Standartlar_Regulasyonlar.xlsx kaynaklı yeni standartlar
 * Çalıştırma: npx ts-node db/seeds/seed-new-standards.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: require('path').join(__dirname, '../../.env') });
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'regulation_engine',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// ── Standart + Kontrol Veri Yapısı ──────────────────────────────────────────

interface Ctrl {
  refNo: string; category: string; title: string;
  description: string; type: string; priority: string; keywords: string[];
}
interface Std {
  id: string; name: string; shortName: string; category: string;
  version: string; publishedBy: string; description: string;
  refFormat: string; color: string; icon: string; controls: Ctrl[];
}

const NEW_STANDARDS: Std[] = [

  // ─── BİLGİ GÜVENLİĞİ ───────────────────────────────────────────────────────

  {
    id: 'iso27002', name: 'ISO/IEC 27002:2022', shortName: 'ISO 27002',
    category: 'Bilgi Güvenliği', version: '2022', publishedBy: 'ISO/IEC',
    description: 'ISO/IEC 27001 kapsamında bilgi güvenliği kontrollerinin uygulanmasına yönelik rehber.',
    refFormat: 'x.x', color: '#1f6feb', icon: '📘',
    controls: [
      { refNo:'5.1',  category:'Organizasyonel Kontroller', title:'Bilgi Güvenliği Politikaları', description:'Bilgi güvenliği için üst yönetim tarafından onaylanmış politikalar tanımlanmalı ve yayımlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['politika','yönetim','güvenlik','onay'] },
      { refNo:'5.9',  category:'Organizasyonel Kontroller', title:'Bilgi ve İlişkili Varlıkların Envanteri', description:'Bilgi ve ilgili varlıkların envanteri oluşturulmalı ve güncel tutulmalıdır.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['envanter','varlık','bilgi','yönetim'] },
      { refNo:'6.1',  category:'İnsan Kaynakları Kontrolleri', title:'Tarama ve Özgeçmiş Doğrulama', description:'İşe alım sürecinde personel güvenlik taraması yapılmalıdır.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['işe alım','tarama','personel','doğrulama'] },
      { refNo:'7.1',  category:'Fiziksel Kontroller', title:'Fiziksel Güvenlik Perimetri', description:'Hassas bilgi işlem tesislerini korumak için güvenlik perimetri tanımlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['fiziksel güvenlik','perimetri','erişim kontrolü','bina'] },
      { refNo:'8.2',  category:'Teknolojik Kontroller', title:'Ayrıcalıklı Erişim Hakları', description:'Ayrıcalıklı erişim hakları tahsis edilmeli, kullanımı izlenmeli ve gözden geçirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ayrıcalıklı erişim','yönetici','PAM','erişim hakları'] },
      { refNo:'8.5',  category:'Teknolojik Kontroller', title:'Güvenli Kimlik Doğrulama', description:'Güvenli kimlik doğrulama teknolojileri ve prosedürleri uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['kimlik doğrulama','MFA','parola','güvenli giriş'] },
      { refNo:'8.7',  category:'Teknolojik Kontroller', title:'Kötü Amaçlı Yazılıma Karşı Koruma', description:'Kötü amaçlı yazılımlara karşı koruma uygulanmalı ve kullanıcı farkındalığı sağlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['antivirus','malware','kötü amaçlı yazılım','uç nokta'] },
      { refNo:'8.12', category:'Teknolojik Kontroller', title:'Veri Sızıntısı Önleme', description:'Yetkisiz veri ifşasını tespit edip önlemek için DLP önlemleri uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['DLP','veri sızıntısı','veri kaybı önleme','hassas veri'] },
      { refNo:'8.24', category:'Teknolojik Kontroller', title:'Kriptografi Kullanımı', description:'Kriptografik yöntemlerin kullanımına ilişkin kurallar oluşturulmalı ve uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['şifreleme','kriptografi','anahtar yönetimi','TLS'] },
      { refNo:'8.28', category:'Teknolojik Kontroller', title:'Güvenli Kodlama', description:'Yazılım geliştirmede güvenli kodlama ilkeleri uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['güvenli kodlama','SAST','DAST','uygulama güvenliği'] },
    ],
  },

  {
    id: 'iso27005', name: 'ISO/IEC 27005:2022', shortName: 'ISO 27005',
    category: 'Bilgi Güvenliği', version: '2022', publishedBy: 'ISO/IEC',
    description: 'Bilgi güvenliği risk yönetimi — ISO/IEC 27001 kapsamında risk değerlendirme ve işleme rehberi.',
    refFormat: 'Madde x.x', color: '#388bfd', icon: '⚖️',
    controls: [
      { refNo:'6.1', category:'Risk Yönetimi Bağlamı', title:'Kuruluş Bağlamının Belirlenmesi', description:'Risk yönetimi faaliyetleri için iç ve dış bağlam tanımlanmalıdır.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['bağlam','risk yönetimi','paydaş','kapsam'] },
      { refNo:'7.1', category:'Risk Değerlendirme', title:'Risk Tanımlama', description:'Bilgi güvenliği risklerini tespit etmek için sistematik bir süreç yürütülmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['risk tanımlama','tehdit','açıklık','etki'] },
      { refNo:'7.2', category:'Risk Değerlendirme', title:'Risk Analizi', description:'Tanımlanan riskler; olasılık ve etki açısından analiz edilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['risk analizi','olasılık','etki','risk matrisi'] },
      { refNo:'7.3', category:'Risk Değerlendirme', title:'Risk Değerlendirme ve Önceliklendirme', description:'Riskler kabul kriterlerine göre değerlendirilmeli ve önceliklendirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['risk değerlendirme','önceliklendirme','kabul kriterleri','risk iştahı'] },
      { refNo:'8.1', category:'Risk İşleme', title:'Risk İşleme Seçenekleri', description:'Riskleri azaltma, transfer etme, kabul etme veya kaçınma seçenekleri belirlenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['risk işleme','risk azaltma','risk transferi','risk kabulü'] },
      { refNo:'8.3', category:'Risk İşleme', title:'Risk İşleme Planı', description:'Seçilen risk işleme seçenekleri için detaylı plan hazırlanmalıdır.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['risk planı','kontrol seçimi','işleme','uygulama'] },
      { refNo:'9.1', category:'İzleme ve Gözden Geçirme', title:'Risk İzleme ve Gözden Geçirme', description:'Risk yönetimi süreci ve risklerin durumu düzenli olarak izlenmeli ve gözden geçirilmelidir.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['risk izleme','gözden geçirme','dönemsel','kontrol etkinliği'] },
      { refNo:'9.2', category:'İzleme ve Gözden Geçirme', title:'Artık Risk Değerlendirmesi', description:'Risk işleme sonrasında kalan artık riskler değerlendirilmelidir.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['artık risk','residual risk','işleme sonrası','kabul'] },
    ],
  },

  {
    id: 'nist_sp80053', name: 'NIST SP 800-53 Rev.5', shortName: 'NIST SP 800-53',
    category: 'Bilgi Güvenliği', version: 'Rev.5', publishedBy: 'NIST',
    description: 'ABD federal bilgi sistemleri için güvenlik ve gizlilik kontrolleri kataloğu.',
    refFormat: 'XX-xx', color: '#1261a0', icon: '🏛️',
    controls: [
      { refNo:'AC-1',  category:'Access Control', title:'Erişim Kontrolü Politikası ve Prosedürleri', description:'Erişim kontrolü politikası oluşturulmalı, dağıtılmalı ve dönemsel olarak güncellenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['erişim kontrolü','politika','prosedür','AC'] },
      { refNo:'AC-2',  category:'Access Control', title:'Hesap Yönetimi', description:'Bilgi sistemi hesapları; türler, koşullar ve davranışları tanımlanarak yönetilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['hesap yönetimi','kullanıcı hesabı','IAM','erişim'] },
      { refNo:'AU-2',  category:'Audit and Accountability', title:'Denetim Olayları', description:'Denetim için toplanacak olay türleri koordineli biçimde tanımlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['denetim','log','olay','audit trail'] },
      { refNo:'CM-6',  category:'Configuration Management', title:'Yapılandırma Ayarları', description:'Bilgi teknolojisi ürünleri için güvenlik yapılandırma ayarları oluşturulmalı ve belgelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['yapılandırma','hardening','baseline','güvenli yapılandırma'] },
      { refNo:'IA-2',  category:'Identification and Authentication', title:'Kimlik Doğrulama (Kuruluş Kullanıcıları)', description:'Kuruluş kullanıcıları ve süreçleri benzersiz biçimde tanımlanmalı ve kimlik doğrulaması yapılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['kimlik doğrulama','MFA','çok faktörlü','IA'] },
      { refNo:'IR-4',  category:'Incident Response', title:'Olay İşleme', description:'Güvenlik olayları için tespit, analiz, kontrol altına alma ve kurtarma yetenekleri geliştirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['olay müdahale','incident response','kurtarma','SIEM'] },
      { refNo:'RA-3',  category:'Risk Assessment', title:'Risk Değerlendirmesi', description:'Bilgi sistemi operasyonundan kaynaklanan risk değerlendirmesi yürütülmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['risk değerlendirme','tehdit','açıklık','etki analizi'] },
      { refNo:'SC-8',  category:'System and Communications Protection', title:'İletim Gizliliği ve Bütünlüğü', description:'Bilgi sistemi iletim sırasında iletilen bilgilerin gizliliğini ve bütünlüğünü korumalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['şifreleme','TLS','iletim güvenliği','veri koruma'] },
      { refNo:'SI-3',  category:'System and Information Integrity', title:'Kötü Amaçlı Kod Koruması', description:'Giriş ve çıkış noktalarında kötü amaçlı kod koruması mekanizmaları uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['antivirus','malware','kötü kod','endpoint protection'] },
      { refNo:'SR-3',  category:'Supply Chain Risk Management', title:'Tedarik Zinciri Kontrolleri ve Planları', description:'Tedarik zinciri riski yönetimine yönelik kontroller ve planlar geliştirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['tedarik zinciri','üçüncü taraf','SCRM','güven'] },
    ],
  },

  // ─── KİŞİSEL VERİ KORUMA ─────────────────────────────────────────────────────

  {
    id: 'ccpa', name: 'California Consumer Privacy Act (CCPA)', shortName: 'CCPA',
    category: 'Kişisel Veri Koruma', version: '2020', publishedBy: 'State of California',
    description: 'Kaliforniya tüketicilerine kişisel verileri üzerinde haklar tanıyan ABD veri gizlilik yasası.',
    refFormat: 'Sec. x', color: '#58a6ff', icon: '🏠',
    controls: [
      { refNo:'1798.100', category:'Tüketici Hakları', title:'Kişisel Bilgilere Erişim Hakkı', description:'Tüketicilerin topladığınız kişisel bilgilere erişim talep etme hakkı tanınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['erişim hakkı','kişisel bilgi','tüketici','talep'] },
      { refNo:'1798.105', category:'Tüketici Hakları', title:'Silme Hakkı', description:'Tüketicilerin kişisel bilgilerinin silinmesini talep etme hakkı desteklenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['silme hakkı','unutulma hakkı','veri silme','tüketici talebi'] },
      { refNo:'1798.120', category:'Tüketici Hakları', title:'Satışa İtiraz Hakkı', description:'Tüketicilerin kişisel bilgilerinin satışına itiraz etme mekanizması sağlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['opt-out','satış itirazı','kişisel bilgi satışı','veri ticareti'] },
      { refNo:'1798.115', category:'Açıklama Yükümlülükleri', title:'Kişisel Bilgi Kategorileri Açıklaması', description:'Toplanan kişisel bilgi kategorileri ve kaynakları açıklanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['açıklama','şeffaflık','veri kategorisi','gizlilik bildirimi'] },
      { refNo:'1798.135', category:'Uyum Gereksinimleri', title:'Opt-Out Butonu / Do Not Sell', description:'"Kişisel bilgilerimi satma" bağlantısı web sitesinde yer almalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['do not sell','opt-out','web sitesi','bağlantı'] },
      { refNo:'1798.150', category:'Güvenlik', title:'Makul Güvenlik Önlemleri', description:'Kişisel bilgileri yetkisiz erişime karşı korumak için makul güvenlik önlemleri alınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['güvenlik','veri ihlali','yetkisiz erişim','koruma'] },
      { refNo:'1798.155', category:'Uyum Gereksinimleri', title:'Uyum Eğitimi', description:'CCPA uyumu konusunda çalışanlara düzenli eğitim verilmelidir.', type:'TAVSİYE', priority:'🟡 ORTA', keywords:['eğitim','farkındalık','uyum','çalışan'] },
    ],
  },

  {
    id: 'pdpa', name: 'Personal Data Protection Act (PDPA)', shortName: 'PDPA',
    category: 'Kişisel Veri Koruma', version: '2022', publishedBy: 'Asya-Pasifik Ülkeleri',
    description: 'Tayland, Singapur, Malezya ve diğer Asya-Pasifik ülkelerinde kişisel verilerin toplanması, kullanımı ve ifşasını düzenler.',
    refFormat: 'Madde x', color: '#2ea043', icon: '🌏',
    controls: [
      { refNo:'M.19', category:'Rıza ve Amaç', title:'Kişisel Veri Toplama Rızası', description:'Kişisel veriler belirli amaçlar için yazılı veya elektronik rıza alınarak toplanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['rıza','onay','veri toplama','amaç sınırlaması'] },
      { refNo:'M.20', category:'Rıza ve Amaç', title:'Amaç Bildirimi', description:'Kişisel veri toplama amacı veri sahibine bildirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['amaç bildirimi','şeffaflık','bilgilendirme','veri sahibi'] },
      { refNo:'M.25', category:'Veri Sahibi Hakları', title:'Erişim ve Düzeltme Hakları', description:'Veri sahiplerine kişisel verilerine erişim ve düzeltme talep etme hakkı tanınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['erişim hakkı','düzeltme','veri sahibi hakları','talep'] },
      { refNo:'M.29', category:'Güvenlik', title:'Kişisel Veri Güvenlik Koruması', description:'Kişisel verileri yetkisiz erişim, ifşa veya kayıptan koruyacak güvenlik önlemleri alınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['güvenlik','yetkisiz erişim','veri koruma','kriptografi'] },
      { refNo:'M.33', category:'İhlal Bildirimi', title:'Veri İhlali Bildirimi', description:'Kişisel veri ihlali durumunda yetkili makamlara ve veri sahiplerine bildirim yapılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ihlal bildirimi','veri ihlali','bildirim','makam'] },
      { refNo:'M.37', category:'Yurt Dışı Transfer', title:'Uluslararası Veri Transferi', description:'Kişisel verilerin yurt dışına transferinde yeterli koruma güvencesi sağlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['yurt dışı transfer','uluslararası','yeterlilik','koruma'] },
    ],
  },

  {
    id: 'iso27701', name: 'ISO/IEC 27701:2019', shortName: 'ISO 27701',
    category: 'Kişisel Veri Koruma', version: '2019', publishedBy: 'ISO/IEC',
    description: 'ISO/IEC 27001 ve 27002 uzantısı olarak Gizlilik Bilgi Yönetim Sistemi (PIMS) — GDPR uyum desteği sağlar.',
    refFormat: 'x.x', color: '#a371f7', icon: '🔐',
    controls: [
      { refNo:'6.1',  category:'PIMS Spesifik Gereksinimler', title:'Kuruluş ve Bağlamının Anlaşılması (Gizlilik)', description:'Gizlilik bilgi yönetimiyle ilgili iç ve dış faktörler belirlenmelidir.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['gizlilik','PIMS','bağlam','kişisel veri'] },
      { refNo:'7.2',  category:'PII Kontrolörü Gereksinimleri', title:'Kişisel Tanımlanabilir Bilgi Amaçları', description:'Kişisel tanımlanabilir bilginin (PII) işlenme amaçları belirlenip belgelenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['PII','amaç','kişisel veri işleme','belgeleme'] },
      { refNo:'7.3',  category:'PII Kontrolörü Gereksinimleri', title:'Gizlilik Bildirim ve Rıza Yönetimi', description:'PII prensipleri temelinde rıza yönetimi ve gizlilik bildirimleri uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['rıza','gizlilik bildirimi','veri sahibi','onay yönetimi'] },
      { refNo:'7.4',  category:'PII Kontrolörü Gereksinimleri', title:'Gizlilik Etkisi Değerlendirmesi', description:'Yeni veya değişen PII işleme faaliyetleri için Gizlilik Etkisi Değerlendirmesi (PIA/DPIA) yapılmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['DPIA','PIA','gizlilik etkisi','risk değerlendirme'] },
      { refNo:'8.1',  category:'PII İşleyici Gereksinimleri', title:'İşleyici Sözleşme Yükümlülükleri', description:'PII işleyiciler olarak müşterilerle imzalanan sözleşmelerdeki yükümlülüklere uyulmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['işleyici','sözleşme','DPA','veri işleme sözleşmesi'] },
      { refNo:'8.2',  category:'PII İşleyici Gereksinimleri', title:'Müşteri Onayı Dışında İşleme Yapılmaması', description:'PII yalnızca müşteri talimatları doğrultusunda işlenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['işleyici sınırları','talimat','yetkisiz işleme','müşteri onayı'] },
      { refNo:'7.5',  category:'PII Kontrolörü Gereksinimleri', title:'Veri Sahibi Haklarının Yerine Getirilmesi', description:'Erişim, düzeltme, silme ve taşınabilirlik gibi veri sahibi hakları yönetilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['veri sahibi hakları','erişim','silme','taşınabilirlik','GDPR'] },
    ],
  },

  // ─── ÖDEME VE FİNANS ─────────────────────────────────────────────────────────

  {
    id: 'psd2', name: 'PSD2 (Payment Services Directive 2)', shortName: 'PSD2',
    category: 'Ödeme ve Finans', version: '2018', publishedBy: 'Avrupa Birliği',
    description: 'AB ödeme hizmetleri direktifi: açık bankacılık, güçlü müşteri kimlik doğrulama (SCA) ve üçüncü taraf sağlayıcı (TPP) çerçevesi.',
    refFormat: 'Madde x', color: '#f0a830', icon: '🏦',
    controls: [
      { refNo:'Art.97', category:'Güçlü Müşteri Kimlik Doğrulama', title:'SCA Uygulaması', description:'Çevrimiçi ödemelerde en az iki bağımsız faktörden oluşan güçlü kimlik doğrulama (SCA) uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['SCA','güçlü kimlik doğrulama','MFA','ödeme'] },
      { refNo:'Art.98', category:'Güçlü Müşteri Kimlik Doğrulama', title:'Dinamik Bağlantı', description:'İşlem tutarı ve alıcıyla dinamik olarak ilişkilendirilen kimlik doğrulama kodları kullanılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['dinamik bağlantı','işlem onayı','ödeme doğrulama','TAC'] },
      { refNo:'Art.66', category:'Açık Bankacılık', title:'Ödeme Başlatma Hizmeti (PIS)', description:'Ödeme başlatma hizmet sağlayıcılarına (PISP) güvenli API erişimi sağlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['PIS','PISP','açık bankacılık','ödeme başlatma','API'] },
      { refNo:'Art.67', category:'Açık Bankacılık', title:'Hesap Bilgisi Hizmeti (AIS)', description:'Hesap bilgisi hizmet sağlayıcılarına (AISP) güvenli veri erişimi sağlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['AIS','AISP','hesap bilgisi','açık bankacılık','API'] },
      { refNo:'Art.95', category:'Olay Yönetimi', title:'Büyük Olay Bildirimi', description:'Büyük operasyonel veya güvenlik olayları yetkili makama bildirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['olay bildirimi','EBA','güvenlik olayı','operasyonel olay'] },
      { refNo:'Art.93', category:'Güvenlik', title:'İşlem İzleme', description:'İşlem anomalilerini tespit etmek için sürekli izleme mekanizmaları uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['işlem izleme','fraud detection','anomali','risk tabanlı analiz'] },
    ],
  },

  {
    id: 'sox', name: 'SOX (Sarbanes-Oxley Act)', shortName: 'SOX',
    category: 'Ödeme ve Finans', version: '2002', publishedBy: 'ABD Kongresi',
    description: 'ABD halka açık şirketlerinde finansal raporlama bütünlüğü, iç kontroller ve BT denetimi gereksinimleri.',
    refFormat: 'Sec. xxx', color: '#1f6feb', icon: '📊',
    controls: [
      { refNo:'Sec.302', category:'Mali Kontroller', title:'Mali Raporların Yönetici Onayı', description:'CEO ve CFO, finansal raporların doğruluğunu ve iç kontrollerin etkinliğini sertifikalandırmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['yönetici sertifikası','CFO','CEO','mali raporlama'] },
      { refNo:'Sec.404', category:'Mali Kontroller', title:'İç Kontrol Değerlendirmesi', description:'Finansal raporlamayla ilgili iç kontrollerin yönetim ve bağımsız denetçi tarafından değerlendirilmesi zorunludur.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['iç kontrol','SOX 404','ICFR','bağımsız denetim'] },
      { refNo:'IT-1',   category:'BT Kontrolleri', title:'BT Genel Kontrolleri (ITGC)', description:'Değişiklik yönetimi, erişim kontrolleri ve operasyon güvenilirliğine yönelik BT genel kontrolleri uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ITGC','BT kontrolleri','değişiklik yönetimi','erişim kontrolleri'] },
      { refNo:'IT-2',   category:'BT Kontrolleri', title:'Finansal Sistem Erişim Kontrolü', description:'Finansal sistemlere erişim en az ayrıcalık ilkesiyle kısıtlanmalı ve izlenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['erişim kontrolü','en az ayrıcalık','finansal sistem','SOD'] },
      { refNo:'IT-3',   category:'BT Kontrolleri', title:'Değişiklik Yönetimi Kontrolleri', description:'Finansal sistemlerdeki değişiklikler onay, test ve kayıt süreçlerinden geçirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['değişiklik yönetimi','onay süreci','test','finansal sistem değişikliği'] },
      { refNo:'Sec.802', category:'Kayıt Tutma', title:'Kayıtların Saklanması ve İmha Edilmemesi', description:'İlgili finansal kayıtlar ve elektronik iletişimler belirlenen süre boyunca saklanmalı, imha edilmemelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['kayıt saklama','imha yasağı','e-posta arşivleme','belge yönetimi'] },
    ],
  },

  {
    id: 'swift_csp', name: 'SWIFT Customer Security Programme (CSP)', shortName: 'SWIFT CSP',
    category: 'Ödeme ve Finans', version: '2024', publishedBy: 'SWIFT',
    description: 'Bankalar arası SWIFT ödeme ağı altyapı güvenliği için müşteri güvenlik programı gereksinimleri.',
    refFormat: 'CSC x.x', color: '#f0a830', icon: '🌐',
    controls: [
      { refNo:'1.1', category:'SWIFT Ortamını Kısıtla', title:'SWIFT Altyapısını İnternetten Ayır', description:'SWIFT altyapısı genel internet ve kurumsal ağdan izole edilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ağ izolasyonu','SWIFT','internet ayrımı','secure zone'] },
      { refNo:'1.2', category:'SWIFT Ortamını Kısıtla', title:'Ayrıcalıklı Hesap Kontrolü', description:'İşletim sistemi, veritabanı ve uygulama hesapları ayrıcalık düzeyine göre yönetilmeli ve izlenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ayrıcalıklı hesap','PAM','SWIFT hesap','yönetici kontrolü'] },
      { refNo:'2.1', category:'Saldırı Yüzeyini Azalt', title:'Dahili Veri Akışı Güvenliği', description:'SWIFT ile iletişen uygulamalar arasındaki dahili veri akışı şifrelenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['veri akışı şifreleme','SWIFT API','iç iletişim','TLS'] },
      { refNo:'6.1', category:'Olağandışı İşlemleri Tespit Et', title:'İnsan Dışı Hesap Tespiti', description:'SWIFT ortamında yetkisiz veya anormal hesap aktiviteleri tespit edilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['anomali tespiti','SWIFT izleme','fraud','olağandışı işlem'] },
      { refNo:'6.2', category:'Olağandışı İşlemleri Tespit Et', title:'Yazılım Bütünlüğü', description:'SWIFT yazılım bileşenlerinin bütünlüğü düzenli olarak doğrulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['bütünlük doğrulama','yazılım hash','SWIFT yazılım','güvenlik kontrolü'] },
      { refNo:'7.1', category:'Siber Olayları Planla ve Yönet', title:'Siber Olay Müdahale Planı', description:'SWIFT saldırılarına özgü olay müdahale ve kurtarma planı hazırlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['olay müdahale','siber saldırı','SWIFT IR','kurtarma planı'] },
    ],
  },

  // ─── SAĞLIK VERİSİ ───────────────────────────────────────────────────────────

  {
    id: 'hipaa', name: 'HIPAA (Health Insurance Portability and Accountability Act)', shortName: 'HIPAA',
    category: 'Sağlık Verisi', version: '1996/2013', publishedBy: 'ABD HHS',
    description: 'ABD sağlık sektöründe korunan sağlık bilgilerinin (PHI) gizliliğini, güvenliğini ve elektronik iletimini düzenler.',
    refFormat: '45 CFR §xxx.xxx', color: '#3fb950', icon: '🏥',
    controls: [
      { refNo:'164.308(a)(1)', category:'İdari Güvenlik', title:'Risk Analizi ve Yönetimi', description:'ePHI güvenliğine yönelik risklerin ve açıklıkların kapsamlı değerlendirmesi yapılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['risk analizi','PHI','sağlık verisi','güvenlik değerlendirmesi'] },
      { refNo:'164.308(a)(3)', category:'İdari Güvenlik', title:'İşgücü Güvenliği', description:'ePHI içeren sistem ve tesislere yalnızca yetkili personelin erişimi sağlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['personel güvenliği','yetkili erişim','çalışan','PHI erişimi'] },
      { refNo:'164.308(a)(5)', category:'İdari Güvenlik', title:'Güvenlik Farkındalık Eğitimi', description:'Tüm çalışanlara düzenli güvenlik farkındalık eğitimi verilmeli ve belgelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['güvenlik eğitimi','farkındalık','HIPAA eğitimi','çalışan'] },
      { refNo:'164.310(a)',   category:'Fiziksel Güvenlik', title:'Tesis Erişim Kontrolleri', description:'ePHI içeren sistemlere fiziksel erişim sınırlandırılmalı ve izlenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['fiziksel güvenlik','tesis erişimi','PHI','veri merkezi'] },
      { refNo:'164.312(a)',   category:'Teknik Güvenlik', title:'Erişim Kontrolleri (Teknik)', description:"ePHI'ye yalnızca yetkili kişilerin veya yazılımların erişimine izin verecek teknik politikalar uygulanmalıdır.", type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['teknik erişim kontrolü','ePHI','kimlik doğrulama','yetkilendirme'] },
      { refNo:'164.312(b)',   category:'Teknik Güvenlik', title:'Denetim Kontrolleri', description:'ePHI içeren sistemlerdeki aktiviteyi kaydeden ve inceleyebilen donanım/yazılım mekanizmaları uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['denetim logu','aktivite kaydı','ePHI izleme','SIEM'] },
      { refNo:'164.312(e)',   category:'Teknik Güvenlik', title:'İletim Güvenliği', description:'Açık ağlar üzerinden iletilen ePHI yetkisiz erişime karşı korunmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['iletim şifreleme','TLS','ePHI güvenliği','ağ şifreleme'] },
      { refNo:'164.314(a)',   category:'Organizasyonel Gereksinimler', title:'İş Ortağı Sözleşmeleri', description:'ePHI paylaşılan tüm iş ortaklarıyla BAA (Business Associate Agreement) imzalanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['BAA','iş ortağı','sözleşme','PHI paylaşımı'] },
    ],
  },

  {
    id: 'hl7_fhir', name: 'HL7 FHIR R4', shortName: 'HL7/FHIR',
    category: 'Sağlık Verisi', version: 'R4 (4.0.1)', publishedBy: 'HL7 International',
    description: 'Sağlık bilgi sistemleri arasında elektronik veri alışverişi için modern REST tabanlı birlikte çalışabilirlik standardı.',
    refFormat: 'FHIR-xxx', color: '#3fb950', icon: '🔄',
    controls: [
      { refNo:'FHIR-001', category:'FHIR API Güvenliği', title:'SMART on FHIR Kimlik Doğrulama', description:'FHIR API erişimi için OAuth 2.0 tabanlı SMART on FHIR yetkilendirme çerçevesi kullanılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['SMART','OAuth','FHIR','kimlik doğrulama','yetkilendirme'] },
      { refNo:'FHIR-002', category:'FHIR API Güvenliği', title:'FHIR Kaynak Erişim Kontrolü', description:'FHIR kaynak erişimi hasta onayı ve klinik role göre kısıtlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['erişim kontrolü','FHIR kaynak','hasta rızası','klinik yetki'] },
      { refNo:'FHIR-003', category:'Veri Kalitesi', title:'FHIR Profil Doğrulaması', description:'FHIR kaynakları ulusal veya uluslararası profillere uygunluk açısından doğrulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['FHIR profil','doğrulama','veri kalitesi','birlikte çalışabilirlik'] },
      { refNo:'FHIR-004', category:'Birlikte Çalışabilirlik', title:'FHIR Terminoloji Servisleri', description:'SNOMED CT, LOINC ve ICD kodlama sistemleri FHIR terminoloji servisleriyle entegre edilmelidir.', type:'TAVSİYE', priority:'🟡 ORTA', keywords:['SNOMED','LOINC','ICD','terminoloji','kodlama'] },
      { refNo:'FHIR-005', category:'Denetim ve Uyum', title:'FHIR Denetim Günlükleri', description:'Tüm FHIR API erişimleri ATNA (Audit Trail and Node Authentication) profiliyle denetlenmeli ve kayıt altına alınmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['denetim','ATNA','FHIR log','erişim kaydı'] },
    ],
  },

  // ─── BULUT VE SERVİS YÖNETİMİ ────────────────────────────────────────────────

  {
    id: 'iso27017', name: 'ISO/IEC 27017:2015', shortName: 'ISO 27017',
    category: 'Bulut Güvenliği', version: '2015', publishedBy: 'ISO/IEC',
    description: 'ISO/IEC 27002 temelli bulut hizmetlerine özgü bilgi güvenliği kontrolleri — hem bulut sağlayıcılar hem müşteriler için.',
    refFormat: 'CLD x.x', color: '#58a6ff', icon: '☁️',
    controls: [
      { refNo:'CLD.6.3',  category:'Bulut Müşteri Kontrolleri', title:'Paylaşılan Roller ve Sorumluluklar', description:'Bulut sağlayıcı ile müşteri arasındaki güvenlik rolleri ve sorumlulukları açıkça belgelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['paylaşılan sorumluluk','bulut güvenliği','roller','SLA'] },
      { refNo:'CLD.9.5',  category:'Bulut Müşteri Kontrolleri', title:'Sanal Makine Güçlendirmesi', description:'Sanal makineler CIS Benchmark gibi güvenlik temellerine uygun olarak yapılandırılmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['VM hardening','sanal makine','CIS Benchmark','güvenli yapılandırma'] },
      { refNo:'CLD.12.4', category:'Bulut Müşteri Kontrolleri', title:'Bulut Hizmeti İzleme', description:'Bulut hizmetlerindeki güvenlik olayları ve anormallikleri izlenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['bulut izleme','CSPM','log analizi','anomali tespiti'] },
      { refNo:'CLD.13.1', category:'Bulut Sağlayıcı Kontrolleri', title:'Sanal ve Fiziksel Ağ Ayrımı', description:'Farklı müşterilere ait ağ ortamları sanal ve fiziksel düzeyde izole edilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['multi-tenant izolasyon','ağ segmentasyonu','VLAN','güvenlik grubu'] },
      { refNo:'CLD.13.2', category:'Bulut Sağlayıcı Kontrolleri', title:'Sanal Makinelerin Güvenliği', description:'VM göç işlemleri sırasında veri güvenliği sağlanmalı ve yetkilendirilmeden göç yapılmamalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['VM göçü','vMotion','güvenli göç','yetkilendirme'] },
      { refNo:'CLD.16.1', category:'Olay Yönetimi', title:'Müşteri Olay Bildirimi', description:'Müşteri ortamını etkileyen güvenlik olayları belirtilen sürelerde müşteriye bildirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['olay bildirimi','SLA','müşteri bildirimi','bulut olay'] },
    ],
  },

  {
    id: 'iso27018', name: 'ISO/IEC 27018:2019', shortName: 'ISO 27018',
    category: 'Bulut Güvenliği', version: '2019', publishedBy: 'ISO/IEC',
    description: 'Bulut hizmetlerinde kişisel tanımlanabilir bilgi (PII) işlenmesi için gizlilik kontrolleri.',
    refFormat: 'A.xx', color: '#a371f7', icon: '🔏',
    controls: [
      { refNo:'A.1',  category:'Rıza ve Seçim', title:'PII İşleme Onayı', description:'Kişisel veriler yalnızca müşterinin açık talimatları doğrultusunda işlenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['rıza','PII işleme','talimat','müşteri onayı'] },
      { refNo:'A.3',  category:'Veri Sahibi Katılımı', title:'Kişisel Verilere Erişim İmkânı', description:'Veri sahiplerinin kendi PII verilerine erişim ve düzeltme taleplerinin yerine getirilmesi için mekanizmalar oluşturulmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['veri sahibi hakları','erişim','düzeltme','PII'] },
      { refNo:'A.9',  category:'Güvenlik', title:"PII'nın Şifrelenmesi", description:'Bulutta depolanan ve iletilen PII uygun şifreleme yöntemleriyle korunmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['PII şifreleme','bulut şifreleme','AES','TLS'] },
      { refNo:'A.10', category:'Gizlilik', title:'Reklam veya Pazarlama İçin PII Kullanmama', description:'Müşteri PII verisi reklam veya pazarlama amacıyla kullanılmamalı ve üçüncü taraflarla paylaşılmamalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['reklam yasağı','pazarlama','PII kullanımı','üçüncü taraf'] },
      { refNo:'A.11', category:'Hesap Verebilirlik', title:'Alt İşleyici Yönetimi', description:'Alt işleyiciler (sub-processors) müşteriyle mutabık kalınarak belirlenmeli ve sözleşmeye bağlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['alt işleyici','sub-processor','tedarik zinciri','DPA'] },
    ],
  },

  {
    id: 'csa_star', name: 'CSA STAR (Security, Trust, Assurance and Risk)', shortName: 'CSA STAR',
    category: 'Bulut Güvenliği', version: '4.0', publishedBy: 'Cloud Security Alliance',
    description: 'Bulut güvenliği değerlendirmesi için şeffaflık ve güvence sağlayan sertifikasyon ve öz-değerlendirme programı.',
    refFormat: 'CCM v4.x', color: '#58a6ff', icon: '⭐',
    controls: [
      { refNo:'AIS-01', category:'Uygulama ve Arayüz Güvenliği', title:'Uygulama Güvenlik Temeli', description:'Uygulama güvenliği gereksinimleri belgelenmeli ve tehditlere karşı güvenlik değerlendirmeleri yapılmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['uygulama güvenliği','tehdit modelleme','güvenlik gereksinimleri'] },
      { refNo:'CCC-01', category:'Değişiklik Kontrolü', title:'Değişiklik Yönetimi Politikası', description:'Tüm sistem değişiklikleri için onay, test ve geri alma prosedürlerini içeren politika oluşturulmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['değişiklik yönetimi','onay','test','geri alma'] },
      { refNo:'DSP-01', category:'Veri Güvenliği', title:'Veri Sınıflandırma Politikası', description:'Müşteri ve şirket verileri için resmi bir sınıflandırma politikası uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['veri sınıflandırma','hassasiyet seviyesi','etiketleme','politika'] },
      { refNo:'IVS-01', category:'Altyapı Sanallaştırma', title:'Hypervisor Güvenliği', description:'Hypervisor yönetim arayüzlerine erişim sınırlandırılmalı ve ayrıcalıklı hesaplar izlenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['hypervisor','sanallaştırma','VM escape','yönetim güvenliği'] },
      { refNo:'LOG-01', category:'Kayıt ve İzleme', title:'Günlük Kaydı ve İzleme Politikası', description:'Güvenlik olaylarını izlemek için kapsamlı günlük kaydı ve analiz politikası uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['log yönetimi','SIEM','güvenlik izleme','denetim kaydı'] },
    ],
  },

  {
    id: 'fedramp', name: 'FedRAMP (Federal Risk and Authorization Management Program)', shortName: 'FedRAMP',
    category: 'Bulut Güvenliği', version: 'Rev.5', publishedBy: 'US GSA',
    description: 'ABD federal hükümeti için bulut hizmetlerini güvenlik değerlendirmesi, yetkilendirmesi ve sürekli izleme programı.',
    refFormat: 'FED-xxx', color: '#1261a0', icon: '🦅',
    controls: [
      { refNo:'FED-001', category:'Yetkilendirme', title:'ATO (Authority to Operate)', description:'Federal ortamda kullanılmadan önce resmi FedRAMP yetkilendirme süreci tamamlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ATO','yetkilendirme','FedRAMP','federal onay'] },
      { refNo:'FED-002', category:'Sürekli İzleme', title:'Aylık Güvenlik Raporlaması', description:'Güvenlik durumu FIPS 199 seviyesine göre aylık olarak raporlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['sürekli izleme','ConMon','aylık rapor','güvenlik durumu'] },
      { refNo:'FED-003', category:'Veri Koruma', title:'FIPS 140-2 Kriptografi', description:'Federal veriler için FIPS 140-2 onaylı kriptografik modüller kullanılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['FIPS 140-2','kriptografi','federal veri','şifreleme modülü'] },
      { refNo:'FED-004', category:'Sızma Testi', title:'Yıllık Sızma Testi', description:'FedRAMP gereksinimlerine göre yıllık sızma testi yapılarak bulgular belgelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['sızma testi','pentest','yıllık test','güvenlik açığı'] },
      { refNo:'FED-005', category:'Olay Yönetimi', title:'Federal Olay Bildirimi (US-CERT)', description:'Güvenlik olayları belirtilen sürelerde US-CERT\'e bildirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['US-CERT','olay bildirimi','federal bildirim','CISA'] },
    ],
  },

  // ─── YAZILIM GELİŞTİRME VE KALİTE ───────────────────────────────────────────

  {
    id: 'iso25010', name: 'ISO/IEC 25010:2023', shortName: 'ISO 25010',
    category: 'Yazılım Kalitesi', version: '2023', publishedBy: 'ISO/IEC',
    description: 'Yazılım ürün kalitesi modeli — kullanılabilirlik, güvenlik, güvenilirlik ve bakım kolaylığı gibi sekiz kalite özelliğini tanımlar.',
    refFormat: 'QC-x', color: '#f0a830', icon: '✨',
    controls: [
      { refNo:'QC-1', category:'İşlevsel Uygunluk', title:'İşlevsel Tamlık', description:'Yazılım, belirtilen tüm işlev ve görevleri eksiksiz olarak karşılamalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['işlevsel uygunluk','tamlık','gereksinim karşılama','test'] },
      { refNo:'QC-2', category:'Güvenilirlik', title:'Olgunluk ve Hata Toleransı', description:'Yazılım, işletim hataları durumunda belirlenen güvenilirlik seviyesini korumalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['güvenilirlik','hata toleransı','MTBF','sistem olgunluğu'] },
      { refNo:'QC-3', category:'Güvenlik', title:'Gizlilik ve Bütünlük', description:'Yazılım, veri ve programlara yetkisiz erişimi ve değişikliği önleyecek güvenlik mekanizmaları içermelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['veri gizliliği','bütünlük','yetkisiz erişim','uygulama güvenliği'] },
      { refNo:'QC-4', category:'Bakım Kolaylığı', title:'Değiştirilebilirlik', description:'Yazılım, değişiklik istek ve gereksinimlerine karşı minimum yan etki ile uyarlanabilir olmalıdır.', type:'TAVSİYE', priority:'🟡 ORTA', keywords:['bakım','değişiklik','yeniden yapılandırma','teknik borç'] },
      { refNo:'QC-5', category:'Performans Verimliliği', title:'Zaman Davranışı', description:'Yazılımın işlem hızı ve yanıt süresi gereksinim eşiklerini karşılamalıdır.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['performans','yanıt süresi','gecikme','throughput'] },
      { refNo:'QC-6', category:'Kullanılabilirlik', title:'Öğrenilebilirlik', description:'Kullanıcılar sistemi belirlenen süre içinde öğrenebilmeli ve verimli kullanabilmelidir.', type:'TAVSİYE', priority:'🟢 DÜŞÜK', keywords:['kullanılabilirlik','UX','öğrenme eğrisi','kullanıcı deneyimi'] },
    ],
  },

  {
    id: 'iso12207', name: 'ISO/IEC 12207:2017', shortName: 'ISO 12207',
    category: 'Yazılım Kalitesi', version: '2017', publishedBy: 'ISO/IEC',
    description: 'Yazılım yaşam döngüsü süreçleri — edinim, tedarik, geliştirme, operasyon ve bakım süreçlerini kapsar.',
    refFormat: 'SLC-x.x', color: '#f0a830', icon: '🔄',
    controls: [
      { refNo:'6.1', category:'Anlaşma Süreçleri', title:'Edinim Süreci', description:'Yazılım ürünü veya hizmetinin edinilmesi için gereksinim tanımlama ve sözleşme gereksinimleri belirlenmelidir.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['yazılım edinimi','sözleşme','tedarikçi','gereksinim'] },
      { refNo:'6.3', category:'Teknik Süreçler', title:'Sistem/Yazılım Gereksinimleri Tanımlama', description:'Sistem gereksinimleri izlenebilir, test edilebilir ve tutarlı biçimde tanımlanıp belgelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['gereksinim analizi','SRS','izlenebilirlik','gereksinimlerin doğrulanması'] },
      { refNo:'6.4', category:'Teknik Süreçler', title:'Yazılım Tasarım Süreci', description:'Yazılım mimarisi ve detay tasarımı gereksinimlere uygun biçimde tanımlanmalı ve belgelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['yazılım mimarisi','tasarım','UML','detay tasarım'] },
      { refNo:'6.5', category:'Teknik Süreçler', title:'Yazılım İnşa (Kodlama) Süreci', description:'Yazılım birimleri, kodlama standartları ve tasarım belgelerine uygun olarak geliştirilmelidir.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['kodlama standartları','geliştirme','kod kalitesi','peer review'] },
      { refNo:'6.6', category:'Teknik Süreçler', title:'Yazılım Entegrasyon ve Test Süreci', description:'Yazılım birimleri entegre edilerek birim, entegrasyon ve sistem testleri yürütülmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['test','entegrasyon','birim testi','sistem testi','CI/CD'] },
      { refNo:'6.7', category:'Teknik Süreçler', title:'Yazılım Doğrulama ve Geçerleme (V&V)', description:'Yazılımın gereksinimleri karşıladığını doğrulamak için bağımsız doğrulama ve geçerleme yapılmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['doğrulama','geçerleme','V&V','kabul testi'] },
    ],
  },

  {
    id: 'cmmi', name: 'CMMI (Capability Maturity Model Integration) v2.0', shortName: 'CMMI',
    category: 'Yazılım Kalitesi', version: '2.0', publishedBy: 'CMMI Institute',
    description: 'Yazılım ve sistem geliştirme süreç olgunluk seviyeleri modeli — Seviye 1 (Başlangıç) ile Seviye 5 (Optimize) arasında süreç iyileştirme rehberi.',
    refFormat: 'PA-xxx', color: '#d29922', icon: '📈',
    controls: [
      { refNo:'PA-RDM', category:'Gereksinim Geliştirme', title:'Gereksinim Yönetimi', description:'Paydaş gereksinimleri belgelenmeli, izlenebilmeli ve değişiklikler yönetilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['gereksinim yönetimi','CMMI','izlenebilirlik','değişiklik yönetimi'] },
      { refNo:'PA-VER', category:'Doğrulama ve Geçerleme', title:'Doğrulama Süreci', description:'Çalışma ürünlerinin tanımlanmış gereksinimleri karşıladığı doğrulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['doğrulama','peer review','inceleme','çalışma ürünü'] },
      { refNo:'PA-CM',  category:'Konfigürasyon Yönetimi', title:'Konfigürasyon Yönetimi Süreci', description:'Çalışma ürünlerinin ve değişikliklerinin bütünlüğü konfigürasyon yönetimi ile korunmalıdır.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['konfigürasyon yönetimi','sürüm kontrolü','git','CI/CD'] },
      { refNo:'PA-CAR', category:'Nedensel Analiz', title:'Nedensel Analiz ve Çözüm', description:'Seçilen sonuçların nedenleri analiz edilmeli ve gelecekte önlemek için harekete geçilmelidir.', type:'TAVSİYE', priority:'🟡 ORTA', keywords:['kök neden analizi','RCA','sürekli iyileştirme','düzeltici faaliyet'] },
      { refNo:'PA-OPM', category:'Süreç İyileştirme', title:'Organizasyonel Performans Yönetimi', description:'Süreç ve teknoloji iyileştirmeleri değerlendirilmeli ve iş hedeflerine katkıları izlenmelidir.', type:'TAVSİYE', priority:'🟡 ORTA', keywords:['süreç iyileştirme','organizasyonel performans','CMMI-5','hedef izleme'] },
    ],
  },

  // ─── ENDÜSTRİYEL / OT GÜVENLİK ───────────────────────────────────────────────

  {
    id: 'iec62443', name: 'IEC 62443', shortName: 'IEC 62443',
    category: 'OT/ICS Güvenliği', version: '2018-2022', publishedBy: 'IEC',
    description: 'Endüstriyel otomasyon ve kontrol sistemleri (IACS/SCADA/ICS) için kapsamlı siber güvenlik standartlar serisi.',
    refFormat: 'IEC 62443-x.x §x', color: '#f85149', icon: '🏭',
    controls: [
      { refNo:'3-3/SR 1.1', category:'Tanımlama ve Kimlik Doğrulama', title:'İnsan Kullanıcı Kimlik Doğrulama', description:'Tüm insan kullanıcılar ICS sisteme erişimde benzersiz kimlik ve kimlik doğrulama mekanizmasıyla tanımlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ICS kimlik doğrulama','SCADA kullanıcı','OT erişimi','kimlik yönetimi'] },
      { refNo:'3-3/SR 2.1', category:'Kullanım Kontrolü', title:'Yetkilendirme Zorunluluğu', description:'ICS kaynaklarına erişim tanımlanmış kullanım denetimine dayalı yetkilendirme mekanizmalarıyla kısıtlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['OT yetkilendirme','ICS erişim kontrolü','RBAC','SCADA yetki'] },
      { refNo:'3-3/SR 3.1', category:'Sistem Bütünlüğü', title:'İletişim Bütünlüğü', description:'ICS bileşenleri arasındaki iletişimin bütünlüğü kriptografik mekanizmalarla güvence altına alınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ICS iletişim','bütünlük','şifreleme','OT protokol güvenliği'] },
      { refNo:'3-3/SR 5.1', category:'Kaynak Yönetimi', title:'Ağ Segmentasyonu', description:'ICS ağı güvenlik seviyeleri (Security Level) temelinde bölgelere ve kanallara ayrılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['OT ağ segmentasyonu','güvenlik bölgesi','demilitarized zone','ICS ağı'] },
      { refNo:'2-1/4.3', category:'Güvenlik Yönetim Sistemi', title:'Siber Risk Değerlendirmesi', description:'ICS/SCADA ortamı için periyodik siber güvenlik risk değerlendirmesi yapılmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['OT risk değerlendirmesi','ICS güvenlik riski','endüstriyel siber güvenlik','HAZOP'] },
      { refNo:'2-1/4.4', category:'Güvenlik Yönetim Sistemi', title:'Yamalar ve Güvenlik Açığı Yönetimi', description:'OT sistemleri için uygun test ortamında doğrulanmış yama yönetimi prosedürü uygulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['OT yama yönetimi','ICS güvenlik açığı','SCADA patch','endüstriyel güvenlik'] },
      { refNo:'3-3/SR 6.1', category:'Olay Yönetimi', title:'Denetim Günlükleri', description:'Güvenlik açısından kritik ICS olaylarına ilişkin denetim günlükleri oluşturulup yönetilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['OT log','ICS denetim','SCADA izleme','güvenlik olayı kaydı'] },
    ],
  },

  {
    id: 'nerc_cip', name: 'NERC CIP (Critical Infrastructure Protection)', shortName: 'NERC CIP',
    category: 'OT/ICS Güvenliği', version: 'CIP-014', publishedBy: 'NERC',
    description: 'Kuzey Amerika elektrik şebekesi için kritik altyapı siber güvenlik standartları — güç üretimi ve iletimini korur.',
    refFormat: 'CIP-0xx', color: '#f85149', icon: '⚡',
    controls: [
      { refNo:'CIP-002', category:'Varlık Tanımlama', title:'BES Siber Sistem Sınıflandırması', description:'Bulk Electric System (BES) siber sistemleri etkisine göre Yüksek, Orta veya Düşük olarak sınıflandırılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['BES','siber sistem sınıflandırması','enerji sistemi','kritik altyapı'] },
      { refNo:'CIP-005', category:'Elektronik Güvenlik Perimetri', title:'Elektronik Güvenlik Perimetri (ESP)', description:'BES siber sistemlerine yönelik elektronik güvenlik perimetrileri tanımlanmalı ve korunmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ESP','elektronik güvenlik','enerji ağ güvenliği','firewall','OT perimetrisi'] },
      { refNo:'CIP-006', category:'Fiziksel Güvenlik', title:'Fiziksel Güvenlik Planı', description:'Yüksek ve Orta etki BES siber sistemlerine yönelik fiziksel güvenlik perimetrileri oluşturulmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['fiziksel güvenlik','BES fiziksel erişim','güvenlik perimetri','enerji tesisi'] },
      { refNo:'CIP-007', category:'Sistem Güvenliği Yönetimi', title:'Portlar ve Hizmetler', description:'Fiziksel ve mantıksal I/O portları yönetilmeli, kullanılmayan portlar devre dışı bırakılmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['port yönetimi','hizmet güvenliği','USB devre dışı','saldırı yüzeyi azaltma'] },
      { refNo:'CIP-010', category:'Değişiklik Yönetimi', title:'Yapılandırma Değişikliği Yönetimi', description:'BES siber sistemlerindeki değişiklikler yetkilendirilmeli, belgelenmeli ve güvenlik açısından değerlendirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['OT değişiklik yönetimi','CIP yapılandırma','değişiklik onayı','enerji sistemi'] },
    ],
  },

  // ─── KİMLİK VE ERİŞİM YÖNETİMİ ──────────────────────────────────────────────

  {
    id: 'fido2', name: 'FIDO2 / WebAuthn', shortName: 'FIDO2',
    category: 'Kimlik ve Erişim Yönetimi', version: 'L2 (2022)', publishedBy: 'FIDO Alliance / W3C',
    description: 'Şifre kullanımını ortadan kaldıran güçlü kimlik doğrulama standardı — biyometri ve donanım anahtarlarıyla kimlik doğrulama.',
    refFormat: 'FIDO-xxx', color: '#1f6feb', icon: '🔑',
    controls: [
      { refNo:'FIDO-001', category:'Kimlik Doğrulayıcı Kaydı', title:'Doğrulayıcı Seçim Kriterleri', description:'Güvenlik gereksinimlerine (aaa, aaL) uygun FIDO2 doğrulayıcıları seçilmeli ve politikayla kısıtlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['FIDO2 doğrulayıcı','AAL','authenticator','güvenlik anahtarı'] },
      { refNo:'FIDO-002', category:'Kimlik Doğrulama Akışı', title:'Şifresiz Oturum Açma', description:'Parolasız kimlik doğrulama için WebAuthn API uygulanmalı; parola kaldırılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['passwordless','WebAuthn','şifresiz giriş','passkey'] },
      { refNo:'FIDO-003', category:'Aygıt Yönetimi', title:'Doğrulayıcı Yaşam Döngüsü Yönetimi', description:'Doğrulayıcı kaydı, güncellemesi ve iptali için kullanıcı arayüzleri ve prosedürler oluşturulmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['doğrulayıcı yönetimi','kayıt','iptal','yaşam döngüsü'] },
      { refNo:'FIDO-004', category:'Kurtarma', title:'Hesap Kurtarma Prosedürleri', description:'Doğrulayıcının kaybolması durumunda kimlik doğrulama güvenliğini koruyacak kurtarma prosedürü tanımlanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['hesap kurtarma','recovery','backup doğrulayıcı','kayıp anahtar'] },
      { refNo:'FIDO-005', category:'Uyumluluk', title:'FIDO Metadata Service Kullanımı', description:'FIDO MDS kullanılarak doğrulayıcı sertifikasyon durumu ve güvenlik açıkları izlenmelidir.', type:'TAVSİYE', priority:'🟡 ORTA', keywords:['FIDO MDS','metadata','doğrulayıcı sertifikası','güvenlik açığı izleme'] },
    ],
  },

  {
    id: 'oauth2_oidc', name: 'OAuth 2.0 / OpenID Connect', shortName: 'OAuth 2.0/OIDC',
    category: 'Kimlik ve Erişim Yönetimi', version: 'RFC 6749/8252', publishedBy: 'IETF / OpenID Foundation',
    description: 'Modern yetkilendirme (OAuth 2.0) ve kimlik federasyonu (OpenID Connect) protokolleri — API güvenliği ve SSO altyapısı.',
    refFormat: 'RFC-xxxx §x', color: '#f0a830', icon: '🔗',
    controls: [
      { refNo:'RFC6749-4', category:'Yetkilendirme Akışları', title:'Yetkilendirme Akışı Seçimi', description:'Uygulama türüne uygun OAuth 2.0 akışı (Authorization Code + PKCE, Client Credentials vb.) kullanılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['OAuth akışı','authorization code','PKCE','grant type'] },
      { refNo:'RFC6749-10', category:'Güvenlik', title:'İstemci Kimlik Bilgileri Koruma', description:'Client ID ve Secret güvenli depolanmalı; istemci kimlik bilgileri kaynak koduna gömülmemelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['client secret','gizli anahtar','güvenli depolama','secret manager'] },
      { refNo:'OIDC-3',    category:'Kimlik Doğrulama', title:'ID Token Doğrulama', description:'OpenID Connect ID Token imzası, süre ve audience değerleri doğrulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ID token','JWT doğrulama','imza doğrulama','OIDC'] },
      { refNo:'RFC8252',   category:'Mobil Güvenlik', title:'Mobil Uygulama için OAuth (PKCE)', description:'Mobil ve native uygulamalarda PKCE (Proof Key for Code Exchange) zorunlu kılınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['PKCE','mobil OAuth','native uygulama','code verifier'] },
      { refNo:'RFC7662',   category:'Token Yönetimi', title:'Token Değerlendirme (Introspection)', description:'Kaynak sunucuları token geçerliliğini doğrulamak için introspection uç noktasını kullanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['token introspection','token geçerliliği','access token','RFC 7662'] },
    ],
  },

  {
    id: 'ldap_saml', name: 'LDAP / SAML 2.0', shortName: 'LDAP/SAML',
    category: 'Kimlik ve Erişim Yönetimi', version: 'SAML 2.0', publishedBy: 'OASIS / IETF',
    description: 'Kurumsal dizin hizmetleri (LDAP) ve çoklu oturum açma (SAML 2.0) — Active Directory entegrasyonu ve SSO altyapısı.',
    refFormat: 'SAML-xxx', color: '#58a6ff', icon: '📂',
    controls: [
      { refNo:'SAML-001', category:'SAML Güvenliği', title:'SAML Assertion İmzalama', description:'Tüm SAML Assertion ve Response\'lar dijital olarak imzalanmalı ve doğrulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['SAML imzalama','assertion güvenliği','XMLDSig','IDP imzası'] },
      { refNo:'SAML-002', category:'SAML Güvenliği', title:'Assertion Şifreleme', description:'Hassas nitelikler içeren SAML Assertion\'lar şifrelenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['SAML şifreleme','assertion şifrelemesi','XMLEnc','nitelik güvenliği'] },
      { refNo:'LDAP-001', category:'LDAP Güvenliği', title:'LDAP Şifreli Bağlantı (LDAPS/STARTTLS)', description:'LDAP trafiği LDAPS (636/tcp) veya STARTTLS ile şifrelenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['LDAPS','STARTTLS','dizin şifreleme','Active Directory güvenliği'] },
      { refNo:'LDAP-002', category:'LDAP Güvenliği', title:'Servis Hesabı Ayrıcalık Kontrolü', description:'LDAP sorguları için kullanılan servis hesapları yalnızca gerekli nesne ve özelliklere okuma erişimine sahip olmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['servis hesabı','en az ayrıcalık','LDAP bind','dizin izinleri'] },
    ],
  },

  // ─── YAPAY ZEKA VE VERİ ──────────────────────────────────────────────────────

  {
    id: 'eu_ai_act', name: 'EU AI Act', shortName: 'EU AI Act',
    category: 'Yapay Zeka', version: '2024', publishedBy: 'Avrupa Birliği',
    description: 'AB yapay zeka sistemleri riski sınıflandırma çerçevesi — yüksek riskli AI sistemleri için şeffaflık, insan denetimi ve uyum gereksinimleri.',
    refFormat: 'Madde x', color: '#a371f7', icon: '🤖',
    controls: [
      { refNo:'Art.9',  category:'Risk Yönetim Sistemi', title:'Yüksek Riskli AI Risk Yönetimi', description:'Yüksek riskli AI sistemleri için yaşam döngüsü boyunca sürdürülen risk yönetim sistemi uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['AI risk yönetimi','yüksek riskli AI','risk sınıflandırma','AI yaşam döngüsü'] },
      { refNo:'Art.10', category:'Veri Kalitesi', title:'Eğitim Veri Yönetimi', description:'Eğitim, doğrulama ve test verileri veri yönetim uygulamalarına tabi tutulmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['AI eğitim verisi','veri kalitesi','bias tespiti','veri yönetimi'] },
      { refNo:'Art.11', category:'Teknik Dokümantasyon', title:'Yüksek Riskli AI Teknik Dokümantasyon', description:'Yüksek riskli AI sistemleri için kapsamlı teknik dokümantasyon hazırlanmalı ve güncel tutulmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['AI dokümantasyon','teknik şartname','model kartı','şeffaflık'] },
      { refNo:'Art.13', category:'Şeffaflık', title:'AI Sistemi Şeffaflığı', description:'Yüksek riskli AI sistemleri, çalışma prensiplerini anlamaya olanak sağlayacak şeffaflık sağlamalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['AI şeffaflığı','açıklanabilirlik','XAI','black box'] },
      { refNo:'Art.14', category:'İnsan Denetimi', title:'İnsan Gözetimi', description:'Yüksek riskli AI sistemleri etkin insan gözetimini olanaklı kılacak araç ve arayüzlerle donatılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['insan denetimi','human-in-the-loop','AI oversight','kill switch'] },
      { refNo:'Art.15', category:'Doğruluk ve Gürbüzlük', title:'Doğruluk, Dayanıklılık ve Siber Güvenlik', description:'Yüksek riskli AI sistemleri uygun doğruluk, sağlamlık ve siber güvenlik seviyelerine ulaşmalı ve bunu sürdürmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['AI doğruluğu','model sağlamlığı','adversarial robustness','AI siber güvenlik'] },
      { refNo:'Art.69', category:'Davranış Kuralları', title:'Genel Amaçlı AI Şeffaflık Yükümlülükleri', description:'Genel amaçlı AI sağlayıcıları teknik dokümantasyon ve telif hakkı uyum politikalarını sağlamalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['GPAI','genel amaçlı AI','telif hakkı','şeffaflık yükümlülüğü'] },
    ],
  },

  {
    id: 'iso42001', name: 'ISO/IEC 42001:2023', shortName: 'ISO 42001',
    category: 'Yapay Zeka', version: '2023', publishedBy: 'ISO/IEC',
    description: 'Yapay Zeka Yönetim Sistemi (AIMS) — yapay zekanın sorumlu, şeffaf ve güvenli kullanımı için kurumsal çerçeve.',
    refFormat: 'x.x', color: '#d2a8ff', icon: '🧠',
    controls: [
      { refNo:'4.1', category:'Kuruluş Bağlamı', title:'AI Bağlamı ve Paydaşlar', description:'Yapay zekanın kullanıldığı bağlam, ilgili paydaşlar ve etkilenen gruplar belirlenmelidir.', type:'ZORUNLU', priority:'🟡 ORTA', keywords:['AI bağlamı','paydaş analizi','etki değerlendirmesi','AI politikası'] },
      { refNo:'6.1', category:'Risk ve Fırsat', title:'AI Etki Değerlendirmesi', description:'AI sistemlerinin olumsuz etkilerini değerlendirmek için risk ve fırsat analizi yapılmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['AI etki değerlendirmesi','risk analizi','AI riskleri','bias'] },
      { refNo:'8.2', category:'Operasyonel Planlama', title:'AI Sistemi Etki Değerlendirmesi (AIIA)', description:'Dağıtımdan önce ve sonra AI sistemi etki değerlendirmesi yürütülmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['AIIA','AI etki','dağıtım öncesi değerlendirme','AI denetimi'] },
      { refNo:'8.4', category:'AI Tedarik', title:'AI Tedarikçi Yönetimi', description:'Dış kaynaklı AI sistemleri ve bileşenleri sorumlu kullanım gereksinimlerine göre değerlendirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['AI tedarikçi','üçüncü taraf AI','model kaynağı','tedarik yönetimi'] },
      { refNo:'9.1', category:'Performans Değerlendirme', title:'AI Sistemi İzleme', description:'AI sistemlerinin performansı, adilliği ve olası sapmaları izlenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['AI izleme','model drift','bias izleme','performans degredasyonu'] },
    ],
  },

  // ─── İŞ SÜREKLİLİĞİ ─────────────────────────────────────────────────────────

  {
    id: 'iso27031', name: 'ISO/IEC 27031:2011', shortName: 'ISO 27031',
    category: 'İş Sürekliliği', version: '2011', publishedBy: 'ISO/IEC',
    description: 'BT altyapısının iş sürekliliği hazırlığı — olay sonrası BT hizmetlerinin sürekliliğini ve kurtarmasını destekler.',
    refFormat: 'Madde x.x', color: '#3fb950', icon: '🔄',
    controls: [
      { refNo:'7.1', category:'Hazırlık ve Planlama', title:'ICT Süreklilik Stratejisi', description:'Kuruluşun iş sürekliliği hedeflerini destekleyecek ICT süreklilik stratejisi geliştirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ICT süreklilik','BT kurtarma','iş sürekliliği','strateji'] },
      { refNo:'7.2', category:'Hazırlık ve Planlama', title:'ICT Süreklilik Planı', description:'ICT hizmetlerinin yeniden başlatılmasını ayrıntılayan bir ICT Süreklilik Planı hazırlanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['ICT planı','disaster recovery','kurtarma planı','RTO/RPO'] },
      { refNo:'7.3', category:'Kapasite ve Önlem', title:'Hazır Bulunuşluk Kapasitesi', description:'Gerçekçi BT kurtarma kapasitesi değerlendirilmeli ve kurtarma hedefleri (RTO/RPO) belirlenmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['RTO','RPO','kurtarma kapasitesi','felaket kurtarma'] },
      { refNo:'8.1', category:'Uygulama', title:'ICT Hizmet Yedekleme', description:'Kritik ICT hizmetleri için yedekleme ve replikasyon mekanizmaları uygulanmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['yedekleme','replikasyon','failover','yüksek erişilebilirlik'] },
      { refNo:'8.2', category:'Uygulama', title:'ICT Kurtarma Test Tatbikatları', description:'ICT süreklilik planları düzenli test tatbikatlarıyla doğrulanmalıdır.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['DR test','tatbikat','kurtarma testi','süreklilik doğrulama'] },
    ],
  },

  // ─── TÜRKİYE ÖZEL REGÜLASYONLAR ──────────────────────────────────────────────

  {
    id: 'kanun5651', name: '5651 Sayılı Kanun', shortName: '5651 Kanunu',
    category: 'Türkiye Regülasyonları', version: '2022 (son revizyon)', publishedBy: 'Türkiye Büyük Millet Meclisi',
    description: 'İnternet ortamında yapılan yayınların düzenlenmesi ve bu yayınlar yoluyla işlenen suçlarla mücadele hakkında kanun.',
    refFormat: 'Madde x', color: '#e03e3e', icon: '⚖️',
    controls: [
      { refNo:'Md.4', category:'İçerik Sağlayıcı Yükümlülükleri', title:'İçerik Sorumluluğu', description:'İçerik sağlayıcılar, oluşturdukları içerikten hukuki açıdan sorumludur ve iletişim bilgilerini sunmaları gerekmektedir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['içerik sorumluluğu','içerik sağlayıcı','hukuki sorumluluk','5651'] },
      { refNo:'Md.5', category:'Yer Sağlayıcı Yükümlülükleri', title:'Yer Sağlayıcı Bildirimi', description:'Yer sağlayıcılar BTK\'ya bildirimde bulunmalı ve içeriği saklamalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['yer sağlayıcı','BTK bildirimi','içerik saklama','hosting'] },
      { refNo:'Md.6', category:'Erişim Sağlayıcı Yükümlülükleri', title:'Trafik Verisi Saklama', description:'Erişim sağlayıcılar trafik verilerini 1 yıl boyunca saklamak ve talep halinde yetkili makamlara sunmakla yükümlüdür.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['trafik verisi','log saklama','erişim sağlayıcı','yasal yükümlülük'] },
      { refNo:'Md.9', category:'İçerik Kaldırma', title:'İçerik Kaldırma ve Erişim Engelleme', description:'Yargı kararı veya BTK talebi halinde içeriğin kaldırılması veya erişimin engellenmesi yükümlülüğü yerine getirilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['içerik kaldırma','erişim engelleme','BTK kararı','yargı kararı'] },
      { refNo:'Md.9A', category:'Sosyal Ağ Yükümlülükleri', title:'Sosyal Ağ Sağlayıcıları', description:'Günlük 1 milyon kullanıcıyı aşan sosyal ağ sağlayıcıları Türkiye temsilcisi atamak, Türk kullanıcı verilerini Türkiye\'de depolamak ve içerik kaldırma taleplerine süresi içinde uymakla yükümlüdür.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['sosyal ağ','temsilci atama','veri yerelleştirme','içerik kaldırma'] },
    ],
  },

  {
    id: 'ksvy', name: 'Kişisel Sağlık Verileri Yönetmeliği', shortName: 'KSVY',
    category: 'Türkiye Regülasyonları', version: '2019', publishedBy: 'Sağlık Bakanlığı / KVKK',
    description: 'Türkiye\'de sağlık sektöründe kişisel sağlık verilerinin işlenmesi, saklanması ve paylaşılmasına ilişkin yönetmelik.',
    refFormat: 'Md. x', color: '#e03e3e', icon: '🏥',
    controls: [
      { refNo:'Md.7',  category:'Veri İşleme', title:'Kişisel Sağlık Verisi İşleme Koşulları', description:'Kişisel sağlık verileri yalnızca kanunda öngörülen koşullar (açık rıza, hukuki yükümlülük vb.) çerçevesinde işlenebilir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['sağlık verisi','açık rıza','KVKK','veri işleme koşulları'] },
      { refNo:'Md.10', category:'Veri Güvenliği', title:'Teknik ve İdari Güvenlik Tedbirleri', description:'Kişisel sağlık verilerinin yetkisiz erişimden korunması için yeterli teknik ve idari tedbirler alınmalıdır.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['sağlık verisi güvenliği','teknik tedbir','idari tedbir','yetkisiz erişim'] },
      { refNo:'Md.13', category:'Veri Saklama', title:'Kişisel Sağlık Verisi Saklama Süreleri', description:'Kişisel sağlık verileri ilgili mevzuatta belirlenen saklama sürelerine uygun olarak tutulmalı ve süre sonunda imha edilmelidir.', type:'ZORUNLU', priority:'🟠 YÜKSEK', keywords:['saklama süresi','veri imhası','arşivleme','sağlık kaydı'] },
      { refNo:'Md.16', category:'Sistem Güvenliği', title:'Sağlık Bilgi Sistemi Güvenliği', description:'Kişisel sağlık verilerini işleyen sistemler güvenlik standartlarına uygun olmalı ve düzenli denetlenmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['HIS güvenliği','sağlık BT güvenliği','sistem denetimi','eSağlık güvenliği'] },
      { refNo:'Md.20', category:'Veri İhlali', title:'Sağlık Verisi İhlali Bildirimi', description:'Kişisel sağlık verisi ihlalleri yasal süre içinde KVKK\'ya ve ilgili taraflara bildirilmelidir.', type:'ZORUNLU', priority:'🔴 KRİTİK', keywords:['veri ihlali bildirimi','KVKK bildirimi','sağlık verisi ihlali','72 saat'] },
    ],
  },

];

// ── Ana Fonksiyon ─────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect();
  try {
    // Tenant ID al
    const tenantRes = await client.query(`SELECT id FROM tenants WHERE slug='demo' LIMIT 1`);
    if (tenantRes.rows.length === 0) throw new Error('Demo tenant bulunamadı — önce ana seed çalıştırın');
    const tenantId: number = tenantRes.rows[0].id;
    console.log(`[Seed] Tenant ID: ${tenantId}`);

    await client.query('BEGIN');

    let addedStd = 0, addedCtrl = 0, skippedStd = 0;

    for (const std of NEW_STANDARDS) {
      // Standart mevcut mu?
      const existCheck = await client.query(
        'SELECT id FROM standards WHERE id=$1 AND tenant_id=$2',
        [std.id, tenantId]
      );
      if (existCheck.rows.length > 0) {
        console.log(`[Seed] Atlandı (zaten var): ${std.shortName}`);
        skippedStd++;
        continue;
      }

      // Standart ekle
      await client.query(
        `INSERT INTO standards (id, tenant_id, name, short_name, category, version, published_by,
           description, ref_format, control_count, status, color, icon)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PRELOADED',$11,$12)`,
        [std.id, tenantId, std.name, std.shortName, std.category, std.version, std.publishedBy,
         std.description, std.refFormat, std.controls.length, std.color, std.icon]
      );
      addedStd++;

      // Kontrolleri ekle
      for (const ctrl of std.controls) {
        await client.query(
          `INSERT INTO controls (tenant_id, standard_id, ref_no, category, title, description, type, priority, keywords)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (tenant_id, standard_id, ref_no) DO UPDATE SET
             title=EXCLUDED.title, description=EXCLUDED.description,
             type=EXCLUDED.type, priority=EXCLUDED.priority, keywords=EXCLUDED.keywords`,
          [tenantId, std.id, ctrl.refNo, ctrl.category, ctrl.title, ctrl.description,
           ctrl.type, ctrl.priority, ctrl.keywords]
        );
        addedCtrl++;
      }

      // Control count güncelle
      await client.query(
        'UPDATE standards SET control_count=$1, generated_at=NOW()::date WHERE id=$2 AND tenant_id=$3',
        [std.controls.length, std.id, tenantId]
      );

      console.log(`[Seed] ✅ ${std.shortName}: ${std.controls.length} kontrol eklendi`);
    }

    await client.query('COMMIT');

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Yeni Standart Seed Tamamlandı                        ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Eklenen standart : ${String(addedStd).padEnd(37)}║`);
    console.log(`║  Atlanan standart : ${String(skippedStd).padEnd(37)}║`);
    console.log(`║  Eklenen kontrol  : ${String(addedCtrl).padEnd(37)}║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Seed] HATA — ROLLBACK:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
