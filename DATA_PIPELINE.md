# خطة البيانات — من الصفر إلى أصول جاهزة

## المبدأ
كل البيانات عامة ومجانية. لا نطلب من المستخدم رفع أي شيء. نجمعها ونعالجها مرة واحدة قبل الحدث، ونشحن الناتج مع الموقع حتى يعمل بدون إنترنت وقت العرض.

## ما نحتاجه فعلا
| الأصل | المصدر | الحجم | الاستخدام |
|---|---|---|---|
| لون القمر 2K | NASA SVS CGI Moon Kit | 447 KB | معاينة وfallback |
| لون القمر 4K | NASA SVS | 59 MB | نسيج الكرة الأساسي |
| لون القمر 8K | NASA SVS | 232 MB | نسيج عالي (اختياري) |
| ارتفاع عالمي 16ppd | NASA SVS `ldem_16.tif` | 63 MB | displacement للكرة |
| ارتفاع عالمي 64ppd | NASA SVS `ldem_64_uint.tif` | 506 MB | أفق أدق لكل المواقع |
| DEM القطب 4m | USGS Astrogeology | 296 MB | تضاريس محلية عالية الدقة |
| LOLA 118m عالمي | USGS | ~8 GB | اختياري لدقة أعلى |
| طبقات Moon Trek | WMTS | streaming | خريطة 2D |
| Horizons | JPL API | نص | شمس وأرض |

### روابط مباشرة
```
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_4k.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_8k.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_64_uint.tif
https://asc-astropedia.s3.us-west-2.amazonaws.com/Moon/LRO/MOON_LRO_NAC_DEM_89S210E_4mp.tif
```

## تحذير تغطية مهم
DEM القطب 4m يغطي:
- خط عرض ‎-88.33 إلى -88.56
- خط طول 141 إلى 310

يعني **ليس كل القطب**. المواقع خارج هذا النطاق تحتاج 64ppd أو 118m. لازم نتحقق من إحداثيات كل موقع قبل ما نعده "دقة عالية".

## خط المعالجة
### 1. التنزيل (مرة واحدة)
- 4K color + 16ppd height + 64ppd height + south pole DEM.
- التحقق من checksum والحجم.
- تخزين خارج Git (`data/raw/`)، والملفات النهائية فقط في `public/`.

### 2. الأنسجة
- TIF → WebP/JPEG للكرة (4K) + KTX2/Basis للمتصفح.
- heightmap → 16-bit PNG أو `.bin` منظم، مع scale/offset واضح.
- إنشاء normal map اختياري لتحسين الإضاءة.

### 3. التضاريس المحلية
- إعادة إسقاط DEM القطبي (Polar Stereographic) إلى شبكة محلية.
- قص مقطع 40–60 كم حول كل موقع.
- توليد mesh + hillshade + metadata (دقة، مصدر، نطاق).
- ضغط Meshopt/Draco.

### 4. حساب الأفق
لكل موقع:
- 360 درجة سمت، خطوة 1 درجة.
- أقصى زاوية ارتفاع للتضاريس داخل 30 كم (قابل للتغيير).
- تصحيح انحناء القمر: `drop = d² / (2R)`.
- ناتج: `horizon[360]` بالدرجات + الدقة + نصف القطر.

### 5. كتالوج المواقع
- 8–10 مواقع، إحداثيات موثقة من LPI/PDS.
- لكل موقع: lat, lon, elevation, source, dem_resolution, coverage.
- اختبار: هل الموقع داخل تغطية DEM العالي؟

### 6. كتالوج Horizons
- 6 مواقع × (شمس + أرض) × 2026–2028 × 30 دقيقة.
- حفظ JSON مضغوط.
- سكربت تحديث يعيد التوليد عند الحاجة.

### 7. حزمة العرض
- snapshot ثابت لكل موقع/تاريخ شائع.
- وضع Demo يعمل بدون API.

## هيكل التخزين
```
public/
  textures/moon-color-4k.webp
  textures/moon-height-16.png
  data/sites.json
  data/horizon/{site}.json
  data/ephemeris/{site}.json
  data/patches/{site}.bin
  data/meta.json
```
ميزانية مقترحة: أقل من 25 MB للتحميل الأول، والباقي Lazy.

## الاعتمادات والترخيص
- NASA SVS / LOLA / LRO / USGS.
- ذكر المصدر في صفحة Learn وفي metadata.
- عدم ادعاء ملكية البيانات.

## زمن التنفيذ المتوقع
- تنزيل: 20–40 دقيقة حسب الشبكة.
- معالجة الأنسجة: 30–60 دقيقة.
- الأفق والـ patches: 60–90 دقيقة.
- كتالوج Horizons: 20–30 دقيقة.

## خطة الطوارئ
- لو 8K كبير: نستخدم 4K فقط.
- لو DEM القطبي لا يغطي موقعا: نستخدم 64ppd ونعلن الدقة.
- لو المعالجة تعطلت: نستخدم 16ppd للكرة + أفق مسطح للمواقع غير الجاهزة.
- لو الشبكة ضعيفة: نبدأ بـ 2K + 4ppd ونحسن لاحقا.
