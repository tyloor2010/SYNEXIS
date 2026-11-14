# دليل المصادر والبيانات — شرح وافٍ

## كيف تقرأ هذا الملف
كل مصدر فيه:
- ما هو
- لماذا نستخدمه
- كيف نصل إليه
- ماذا نأخذ منه
- دقته وحدوده
- دوره عند الفشل
- نص الاعتماد

## ترتيب الأولوية
| الأولوية | المصدر | الاستخدام |
|---|---|---|
| 1 | JPL Horizons | مواقع الشمس والأرض |
| 1 | LOLA DEM | الارتفاعات والأفق |
| 2 | NASA CGI Moon Kit | نسيج وارتفاع الكرة |
| 3 | NASA Moon Trek WMTS | خريطة أساس 2D |
| 4 | LROC QuickMap | تحقق بصري |
| 5 | CSA | محتوى تعليمي |

عند التعارض: الأعلى أولوية يفوز. إذا كان الفرق مؤثرا، نعرض القيمتين ونوضح السبب.

---

## 1. JPL Horizons
### ما هو
نظام ephemeris من مختبر الدفع النفاث يحسب مواقع الأجرام بدقة عالية لأي نقطة ووقت.

### لماذا
هو مصدر الحقيقة لزوايا الشمس والأرض من سطح القمر. بدونة لا توجد أداة.

### كيف نصل
- الموقع: https://ssd.jpl.nasa.gov/horizons/
- API: https://ssd.jpl.nasa.gov/api/horizons.api
- لا يحتاج مفتاحا.

### الاستدعاء
```
COMMAND='10'            # الشمس (399 = الأرض)
EPHEM_TYPE='OBSERVER'
CENTER='coord@301'      # 301 = القمر
COORD_TYPE='GEODETIC'
SITE_COORD='E-lon,lat,alt_km'
QUANTITIES='4'          # Azimuth & Elevation
START_TIME='2026-11-14'
STOP_TIME='2026-11-15'
STEP_SIZE='1h'
```
### مثال حقيقي (تم اختباره)
```
الموقع: 0° شرق، 89.5° جنوب، 0 كم
2026-Nov-14 00:00   Azi 126.627   Elev +1.258
2026-Nov-14 01:00   Azi 126.120   Elev +1.262
```
### ما نأخذه
- السمت (0–360).
- الارتفاع (-90 إلى +90).
- الوقت UTC.
- للشمس والأرض بنفس الطريقة.

### الدقة والحدود
- دقة عالية جدا، وتشمل libration وتغيرات المدار.
- لا غلاف جوي، فلا انكسار.
- يعتمد على نموذج كروي/بيضاوي؛ الفرق عند القطب ضئيل.
- له حدود استخدام، لذلك نستخدم كتالوج محسوبا مسبقا + كاش.
- الوقت UTC وليس محليا.

### دوره عند الفشل
- كتالوج ثابت 2026–2028.
- لو التاريخ خارج المدى: رسالة واضحة، لا تخمين.

### الاعتماد
NASA/JPL Horizons System.

---

## 2. LOLA / LRO — التضاريس
### ما هو
مقياس ارتفاع ليزري على مدار LRO، أنتج DEMs عالمية وقطبية.

### لماذا
بدونه لا يوجد أفق حقيقي ولا ظل حقيقي، والأداة تصبح آلة حاسبة للشمس.

### المنتجات
| المنتج | الدقة | التغطية | الحجم | الاستخدام |
|---|---|---|---|---|
| LOLA DEM 118m | 118 م | عالمي | ~8 GB | دقة عالية لكل المواقع (اختياري) |
| South Pole DEM | 4 م | قطاع محدد | 296 MB | تضاريس محلية عالية الدقة |
| Polar GDR | 5–20 م | القطب | حسب الحزمة | بديل عند الحاجة |
| CGI 64ppd | ~474 م | عالمي | 506 MB | أفق لكل المواقع |
| CGI 16ppd | ~1.9 كم | عالمي | 63 MB | displacement للكرة |

### تحذير التغطية
DEM القطب 4m:
```
Lat: -88.56358884  إلى  -88.33003614
Lon: 141.2910715   إلى  309.96354392
Pixel: 4 m
Projection: Polar Stereographic
Latitude type: Planetocentric
Longitude: Positive East
```
**لا يغطي كل القطب.** المواقع خارج هذا النطاق تأخذ دقة أقل، ويجب إعلان ذلك في الواجهة.

### ما نأخذه
- ارتفاع نقطي.
- خط الأفق لكل 1° سمت.
- مقطع تضاريس.
- ميل وانحدار.
- mesh للمجسم المحلي.

### الحدود
- دقة DEM تحدد دقة الظل.
- المنحدرات الحادة والتلال الصغيرة قد لا تظهر.
- الاستيفاء قد يخفي تفاصيل.
- لا نعرض دقة أعلى من المصدر.

### الاعتماد
NASA/LRO/LOLA، USGS Astrogeology، PDS Geosciences.

---

## 3. NASA CGI Moon Kit — الكرة الكاملة
### ما هو
حزمة نسيج لون وارتفاع مخصصة للرندر ثلاثي الأبعاد، من LROC وLOLA.

### لماذا
أفضل طريقة لعرض كرة قمر واقعية وخفيفة نسبيا.

### الملفات
```
lroc_color_2k.jpg                 447 KB   2048x1024
lroc_color_16bit_srgb_4k.tif       59 MB   4096x2048
lroc_color_16bit_srgb_8k.tif      232 MB   8192x4096
lroc_color_16bit_srgb_16k.tif     909 MB   16384x8192
ldem_4.tif                          4 MB   1440x720    (كم float)
ldem_4_uint.tif                     2 MB   1440x720
ldem_16.tif                        63 MB   5760x2880
ldem_16_uint.tif                   32 MB   5760x2880
ldem_64_uint.tif                  506 MB   23040x11520
ldem_64.tif                      1013 MB   23040x11520
ldem_3_8bit.jpg                   109 KB   1024x512
```
### الروابط
```
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_4k.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_8k.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_64_uint.tif
```
### الترميز
- المرجع: كرة نصف قطرها 1737.4 كم.
- `ldem_*.tif`: ارتفاع بالكيلومتر (float).
- `*_uint.tif`: 16-bit نصف متر، مع إزاحة +20000 (أي +10 كم) لتصبح كل القيم موجبة.
- اللون: sRGB.

### الاستخدام
- نسيج الكرة.
- displacement عالمي.
- fallback عند فشل DEM المحلي.

### الحدود
- اللون محسّن للجمال وليس للعلم.
- المناطق فوق 70° قد تكون مملوءة من LDAM.
- الارتفاع العالمي أقل دقة من DEMs القطبية.

### الاعتماد
NASA's Scientific Visualization Studio — CGI Moon Kit.

---

## 4. NASA Moon Trek — WMTS
### ما هو
بوابة NASA Solar System Treks، وتوفر طبقات خرائط عبر WMTS.

### لماذا
خريطة أساس 2D جاهزة بدون تحميل أصول ضخمة.

### كيف نصل
- الموقع: https://trek.nasa.gov/moon/
- توثيق WMTS: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon

### ما نأخذه
- طبقات صور مرئية.
- طبقات ارتفاع/تضاريس عند الحاجة.
- إسناد واضح.

### الحدود
- نستخدم WMTS فقط.
- لا نعتمد على أدوات تحليل غير موثقة.
- قد تتغير الطبقات، لذلك نضع fallback.

### الاعتماد
NASA Moon Trek / Solar System Treks.

---

## 5. LROC QuickMap
### ما هو
أداة تفاعلية من LROC/ASU لعرض صور عالية الدقة وتضاريس ومنحدرات.

### لماذا
مرجع بصري للتحقق من موقع الهبوط ومقارنة شكل التضاريس.

### ما نأخذه
- تحقق يدوي من الإحداثيات.
- مقارنة الأفق المحسوب مع ما يظهر بصريا.
- صور مرجعية للعرض.

### الحدود
- ليس مصدر تشغيل أساسي.
- لا نضمن واجهة API ثابتة.
- الاعتماد على الصور يخضع لشروط LROC.

### الاعتماد
LROC / Arizona State University.

---

## 6. CSA — سياق تعليمي
### ما هو
صفحات وكالة الفضاء الكندية عن استكشاف القمر وArtemis والليل القمري.

### لماذا
محتوى تعليمي يساعد الجمهور على فهم خطورة الظلام والبرد.

### ما نأخذه
- شرح مدة الليل القمري (~14 يوم أرضي).
- سياق مهمات Artemis والروفر.
- أفكار لوضع Educator.

### الحدود
- معلوماتي فقط.
- لا يدخل في الحسابات.

### الاعتماد
Canadian Space Agency.

---

## 7. إحداثيات مواقع الهبوط
### المصادر المعتمدة للتحقق
- LPI Lunar South Pole Atlas: https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/
- PDS Geosciences: https://pds-geosciences.wustl.edu/
- IAU Gazetteer: https://planetarynames.wr.usgs.gov/
- صفحات مهمات CLPS وArtemis.
- صفحات Apollo وChandrayaan وChang'e الرسمية.

### المواقع المرشحة
- Shackleton rim
- Mons Mouton
- Malapert Massif
- Nobile Rim
- de Gerlache Rim
- Faustini Rim
- Apollo 11 (تعليمي)
- Apollo 17 (تعليمي)
- Chandrayaan-3 Shiv Shakti
- Chang'e-6

### إجراء التحقق
1. الحصول على الإحداثيات من مصدرين مستقلين.
2. التأكد من النظام (planetocentric) واتجاه الطول (شرق موجب).
3. التحقق من الارتفاع مقابل DEM.
4. التحقق من تغطية DEM عالي الدقة.
5. تسجيل المصدر والتاريخ في `sites.json`.
6. عدم نشر أي إحداثي بلا مصدر.

**لا نعتمد أي رقم من الذاكرة أو من AI.**

---

## 8. سياسة التعارض
- الشمس/الأرض: Horizons دائما.
- التضاريس: LOLA 4m > LOLA 118m > 64ppd > 16ppd > أفق مسطح.
- الصور: Moon Trek/LROC > CGI.
- الإحداثيات: LPI/PDS > صفحات المهمات > أي مصدر آخر.
- عند فرق كبير: نعرض الاثنين ونشرح.

## 9. الاعتمادات
```
NASA/JPL Horizons System
NASA/LRO/LOLA — USGS Astrogeology Science Center
NASA Scientific Visualization Studio — CGI Moon Kit
NASA Moon Trek / Solar System Treks
LROC / Arizona State University
Canadian Space Agency
```
تظهر في صفحة Learn وأسفل التصدير.

## 10. أعلام جودة البيانات
كل استجابة تحمل:
- `source`
- `resolution`
- `coverage`
- `method`
- `uncertainty`
- `warnings[]`

أمثلة:
- `DEM_RESOLUTION_474M`
- `SITE_OUTSIDE_HIGHRES_DEM`
- `FLAT_HORIZON_FALLBACK`
- `EPHEMERIS_OUTSIDE_CATALOG`

## 11. ما لا نستخدمه
- OpenStreetMap (أرضي).
- خرائط تجارية.
- بيانات مولدة أو تقديرية.
- صور بلا اعتماد.
- أي API غير موثق يعتمد عليه القرار.
